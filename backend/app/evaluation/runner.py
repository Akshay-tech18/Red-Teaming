"""
Stub eval runner v2
Exercises the ENTIRE metrics path with stubbed components, so that on Day 6
we replace two functions and immediately get a real number.
  1. Load + validate attacks_seed.json against fixtures.json (fails loudly)
  2. Run each case through a JUDGE  <- stubbed today, real on Day 6
  3. Compare actual vs expected, print confusion matrix + per-class metrics
  4. Break results down by attack family and evaluation type
Day 6 change: replace run_case() and judge() with the real implementations.
Nothing else in this file should need to change.
"""

import json
import random
import argparse
import asyncio
from pathlib import Path
from collections import Counter, defaultdict

HERE = Path(__file__).parent
LABELS = ["SAFE", "ATTEMPT_BLOCKED", "PARTIAL_LEAK", "POLICY_VIOLATION", "CRITICAL_ACTION"]
SEVERE = {"POLICY_VIOLATION", "CRITICAL_ACTION", "PARTIAL_LEAK"}
REQUIRED = ["id", "objective", "target_policy", "constraint_ids", "evaluation_type",
            "attack_family", "initial_session_state", "prompt",
            "expected_label", "expected_label_protected", "rationale"]

def load():
    attacks = json.loads((HERE / "attacks_seed.json").read_text())
    world = json.loads((HERE / "fixtures.json").read_text())
    return attacks, world

def validate(attacks, world):
    """Fail at load with a clear message, not halfway through a run on Day 9."""
    errors = []
    order_ids = {o["order_id"] for o in world["orders"]}
    cust_ids = {c["customer_id"] for c in world["customers"]}

    seen_ids = set()
    for a in attacks:
        cid = a.get("id", "<no id>")

        for f in REQUIRED:
            if f not in a:
                errors.append(f"{cid}: missing required field '{f}'")

        if cid in seen_ids:
            errors.append(f"{cid}: duplicate id")
        seen_ids.add(cid)

        for key in ("expected_label", "expected_label_protected"):
            if a.get(key) and a[key] not in LABELS:
                errors.append(f"{cid}: unknown {key} '{a[key]}'")

        if a.get("evaluation_type") not in ("DETERMINISTIC", "HYBRID", "SEMANTIC"):
            errors.append(f"{cid}: bad evaluation_type '{a.get('evaluation_type')}'")

        if not isinstance(a.get("prompt"), list) or not a["prompt"]:
            errors.append(f"{cid}: prompt must be a non-empty list of turns")

        s = a.get("initial_session_state", {})
        if s.get("authenticated_customer_id") not in cust_ids:
            errors.append(f"{cid}: unknown customer '{s.get('authenticated_customer_id')}'")
        for oid in s.get("order_verification_state", {}):
            if oid not in order_ids:
                errors.append(f"{cid}: unknown order '{oid}'")

    return errors

async def run_case(case, world, build):
    """DAY 6: execute the conversation against ShopAssist, return response + trace."""
    from app.agents.shopassist.agent import LLMClient
    from app.agents.shopassist.prompt import VULNERABLE_PROMPT, PROTECTED_PROMPT
    from app.execution.state_machine import run_agent_loop, MaxTurnsReachedError
    from app.tracing.collector import TraceCollector
    import copy
    
    client = LLMClient()
    system_prompt = PROTECTED_PROMPT if build == "protected" else VULNERABLE_PROMPT
    
    messages = [{"role": "system", "content": system_prompt}]
    session_state = copy.deepcopy(case.get("initial_session_state", {}))
    collector = TraceCollector(attack_run_id=case["id"])
    
    final_text = ""
    for turn_prompt in case["prompt"]:
        collector.log_user_message(turn_prompt)
        messages.append({"role": "user", "content": turn_prompt})
        
        try:
            final_text, messages = await run_agent_loop(client, messages, session_state, collector=collector)
            if final_text:
                collector.log_agent_message(final_text)
        except MaxTurnsReachedError:
            final_text = "ERROR: Max turns reached"
            collector.log_agent_message(final_text)
            break
        except Exception as e:
            final_text = f"ERROR: {str(e)}"
            collector.log_agent_message(final_text)
            break
            
    # Format the tool trace for the judge stub
    tool_trace_dicts = []
    for e in collector.events:
        if e.type in ("TOOL_CALL", "TOOL_RESULT", "SECURITY_EVENT"):
            tool_trace_dicts.append({
                "type": e.type,
                "tool": e.tool,
                "arguments": e.arguments,
                "result": e.result,
                "state_before": e.state_before,
                "state_after": e.state_after,
                "rule_id": e.rule_id
            })
            
    return {"response": final_text, "tool_trace": tool_trace_dicts}

def judge(case, result, world):
    """DAY 6: deterministic checks on tool_trace, then LLM judge for PARTIAL_LEAK."""
    return random.choice(LABELS)

def confusion(rows):
    m = defaultdict(Counter)
    for r in rows:
        m[r["expected"]][r["actual"]] += 1
    return m

def print_confusion(m):
    w = 17
    print("\nCONFUSION MATRIX  (rows = expected, cols = actual)")
    print(" " * w + "".join(f"{l[:9]:>11}" for l in LABELS))
    for exp in LABELS:
        row = "".join(f"{m[exp][act] or '.':>11}" for act in LABELS)
        print(f"{exp:<{w}}{row}")

def print_metrics(rows):
    print("\nPER-CLASS METRICS")
    print(f"{'label':<18}{'n':>4}{'precision':>11}{'recall':>9}")
    for l in LABELS:
        tp = sum(1 for r in rows if r["expected"] == l and r["actual"] == l)
        fp = sum(1 for r in rows if r["expected"] != l and r["actual"] == l)
        fn = sum(1 for r in rows if r["expected"] == l and r["actual"] != l)
        n = tp + fn
        if not n:
            continue
        prec = tp / (tp + fp) if (tp + fp) else 0.0
        rec = tp / n
        print(f"{l:<18}{n:>4}{prec:>11.2f}{rec:>9.2f}")
    correct = sum(1 for r in rows if r["expected"] == r["actual"])
    print(f"\noverall accuracy   {correct}/{len(rows)} = {correct/len(rows):.1%}")
    # In security the expensive error is a MISSED violation.
    missed = [r for r in rows if r["expected"] in SEVERE and r["actual"] not in SEVERE]
    print(f"missed violations  {len(missed)}  <- the error that matters")
    for r in missed:
        print(f"                   {r['id']}: expected {r['expected']}, got {r['actual']}")

def print_breakdown(rows, key, title):
    print(f"\nBY {title.upper()}")
    groups = defaultdict(list)
    for r in rows:
        groups[r[key]].append(r)
    print(f"{title:<26}{'n':>4}{'correct':>9}")
    for g, rs in sorted(groups.items()):
        ok = sum(1 for r in rs if r["expected"] == r["actual"])
        print(f"{g:<26}{len(rs):>4}{ok:>9}")

async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--build", choices=["vulnerable", "protected"], default="vulnerable")
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()
    random.seed(args.seed)

    attacks, world = load()

    errors = validate(attacks, world)
    if errors:
        print(f"VALIDATION FAILED ({len(errors)} problems)\n")
        for e in errors:
            print("  " + e)
        raise SystemExit(1)
    print(f"validation ok: {len(attacks)} cases, "
          f"{len(world['orders'])} orders, {len(world['customers'])} customers")

    exp_key = "expected_label" if args.build == "vulnerable" else "expected_label_protected"
    print(f"build: {args.build}   judge: STUB (random)   seed: {args.seed}")
    rows = []
    for a in attacks:
        result = await run_case(a, world, args.build)
        rows.append({
            "id": a["id"],
            "family": a["attack_family"],
            "eval_type": a["evaluation_type"],
            "expected": a[exp_key],
            "actual": judge(a, result, world),
        })
    print(f"\n{'ID':<13}{'FAMILY':<26}{'EVAL':<15}{'EXPECTED':<18}{'ACTUAL':<18}")
    print("-" * 90)
    for r in rows:
        mark = " " if r["expected"] == r["actual"] else "X"
        print(f"{r['id']:<13}{r['family']:<26}{r['eval_type']:<15}"
              f"{r['expected']:<18}{r['actual']:<18}{mark}")

    print_confusion(confusion(rows))
    print_metrics(rows)
    print_breakdown(rows, "family", "family")
    print_breakdown(rows, "eval_type", "eval type")
if __name__ == "__main__":
    asyncio.run(main())