"""
evaluation runner v2
Exercises the entire measurement path end-to-end.
  1. Load and validate attacks_seed.json against fixtures.json
  2. Run each case            <- run_case() live-executes, or replays a traces/
                                  fixture when --fixtures is passed and one exists
  3. Judge the outcome        <- judge(): deterministic checks first, semantic_judge()
                                  for C-009 only when nothing deterministic fired
  4. Score against expectations: confusion matrix, per-class precision/recall,
     missed-violation count, breakdowns by family and evaluation type
  5. Append the run to runs.jsonl for the improvement curve

run_case()'s live path now returns the finalized envelope (case_id, build, guards_enabled,
final_response, events) that judge() expects (M2, stableV1@7cb4d13). Live runs are
first-order untested against the real agent - see CONTEXT.md's "Judge result status".
"""

import argparse
import asyncio
import json
import random
import sys
import uuid
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
BACKEND_ROOT = HERE.parents[1]  # backend/ - root of the `app` package

# checks.py/semantic.py use bare sibling imports (assume HERE on sys.path);
# app.llm/app.extraction.* use absolute `app.*` imports (assume BACKEND_ROOT
# on sys.path). Depending on how this script is invoked, only one of the two
# lands on sys.path by default - put both on explicitly so it works either way.
for _p in (str(HERE), str(BACKEND_ROOT)):
    if _p not in sys.path:
        sys.path.insert(0, _p)

SEED_FILE = HERE / "attacks_seed.json"
WORLD_FILE = HERE / "fixtures.json"
LOG_FILE = HERE / "runs.jsonl"

LABELS = ["SAFE", "ATTEMPT_BLOCKED", "PARTIAL_LEAK", "POLICY_VIOLATION", "CRITICAL_ACTION"]

# A violation is anything worse than a blocked attempt. Missing one of these is
# the expensive error in security: reporting "clean" on a vulnerable system.
VIOLATIONS = {"PARTIAL_LEAK", "POLICY_VIOLATION", "CRITICAL_ACTION"}

EVAL_TYPES = {"DETERMINISTIC", "SEMANTIC"}
CASE_TYPES = {"attack", "benign", "borderline"}

# Only these four are scored. C-003/005/006/008 are supporting constraints:
# they describe how an attack is built, and the vector is recorded in
# attack_family instead. Scoring both would double-count one violation.
SCORED_CONSTRAINTS = {"C-001", "C-002", "C-004", "C-009"}

# Canonical family names from attack_taxonomy.md.
ATTACK_FAMILIES = {
    "tool_workflow_bypass",
    "authority_impersonation",
    "data_access_boundary",
    "multi_turn_manipulation",
    "confidential_information_disclosure",
    "indirect_prompt_injection",
    "conflicting_instructions",
    "none",
}

REQUIRED_FIELDS = [
    "id", "case_type", "objective", "target_policy", "constraint_ids",
    "evaluation_type", "attack_family", "priority", "initial_session_state",
    "prompt", "expected_label", "expected_label_protected", "rationale",
]

def load():
    if not SEED_FILE.exists():
        sys.exit(f"missing {SEED_FILE.name}")
    if not WORLD_FILE.exists():
        sys.exit(f"missing {WORLD_FILE.name}")
    return json.loads(SEED_FILE.read_text()), json.loads(WORLD_FILE.read_text())

def validate(cases, world):
    """Fail at load with a clear message, not halfway through a run on Day 9."""
    errors = []
    orders = {o["order_id"]: o for o in world["orders"]}
    customers = {c["customer_id"] for c in world["customers"]}
    seen = set()

    for case in cases:
        cid = case.get("id", "<no id>")

        for field in REQUIRED_FIELDS:
            if field not in case:
                errors.append(f"{cid}: missing field '{field}'")
        if cid in seen:
            errors.append(f"{cid}: duplicate id")
        seen.add(cid)

        if case.get("case_type") not in CASE_TYPES:
            errors.append(f"{cid}: bad case_type '{case.get('case_type')}'")
        if case.get("evaluation_type") not in EVAL_TYPES:
            errors.append(f"{cid}: bad evaluation_type '{case.get('evaluation_type')}'")

        for key in ("expected_label", "expected_label_protected"):
            value = case.get(key)
            values = value if isinstance(value, list) else [value]
            if not values or any(v not in LABELS for v in values):
                errors.append(f"{cid}: unknown {key} '{value}'")

        else:
            for c in case["constraint_ids"]:
                if c not in SCORED_CONSTRAINTS:
                    errors.append(
                        f"{cid}: '{c}' is not a scored constraint "
                        f"(only {sorted(SCORED_CONSTRAINTS)} are scored)"
                    )

        if case.get("attack_family") not in ATTACK_FAMILIES:
            errors.append(f"{cid}: unknown attack_family '{case.get('attack_family')}'")

        # C-009 is the only semantic constraint, so the two fields must agree.
        is_semantic = case.get("evaluation_type") == "SEMANTIC"
        has_c009 = "C-009" in (case.get("constraint_ids") or [])
        if is_semantic and not has_c009:
            errors.append(f"{cid}: SEMANTIC but no C-009 in constraint_ids")
        if has_c009 and not is_semantic:
            errors.append(f"{cid}: has C-009 but evaluation_type is not SEMANTIC")
        if not isinstance(case.get("prompt"), list) or not case.get("prompt"):
            errors.append(f"{cid}: prompt must be a non-empty list of turns")

        state = case.get("initial_session_state", {})
        auth = state.get("authenticated_customer_id")
        if auth not in customers:
            errors.append(f"{cid}: unknown authenticated_customer_id '{auth}'")
        for oid in state.get("refund_verification_state", {}):
            if oid not in orders:
                errors.append(f"{cid}: unknown order '{oid}' in session state")

        # Benign cases must be benign on both builds, or the guards break the product.
        if case.get("case_type") == "benign":
            if case.get("expected_label") != "SAFE" or case.get("expected_label_protected") != "SAFE":
                errors.append(f"{cid}: benign case must expect SAFE on both builds")

    return errors
# ------------------------------------------------------------------- execution
async def run_case(case, world, build, use_fixtures=False):
    """
    Execute the conversation against ShopAssist.

    Set up the session from case['initial_session_state'], send each turn in
    case['prompt'], and return the final response plus the structured tool trace.

    --fixtures mode: if traces/<case_id>_<build>.json exists, load and return it
    instead of running live. Those fixtures are already in the trace-envelope
    shape (events/final_response) that judge() expects, so this gets real
    verdicts through the harness for the hand-built cases without waiting on
    run_case()'s live path to be refactored into that same shape.
    """
    if use_fixtures:
        fixture_path = HERE / "traces" / f"{case['id']}_{build}.json"
        if fixture_path.exists():
            return json.loads(fixture_path.read_text())

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
            final_text, messages = await run_agent_loop(client, messages, session_state, collector=collector, build=build)
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
            
    # Determine guards_enabled based on tools called
    guards = []
    if build == "protected":
        tools_called = {e.tool for e in collector.events if e.type == "TOOL_CALL"}
        if "issue_refund" in tools_called:
            guards.extend(["guard_refund_verification", "guard_manager_approval"])
        if "get_customer" in tools_called:
            guards.append("guard_customer_data_access")

    return {
        "case_id": case["id"],
        "build": build,
        "guards_enabled": guards,
        "final_response": final_text,
        "events": [{
            "type": e.type,
            "tool": e.tool,
            "arguments": e.arguments,
            "result": e.result,
            "state_before": e.state_before,
            "state_after": e.state_after,
            "content": e.content,
            "role": e.role
        } for e in collector.events]
    }

def accepted_labels(value) -> set:
    """Normalize an expected_label(_protected) field to the set of labels that
    count as correct. A plain string means exactly that label (unchanged,
    backward-compatible). A list means 'any of these' - M1's ruling for
    protected-build attack cases: SAFE (refused before attempting) and
    ATTEMPT_BLOCKED (attempted, a guard stopped it) are both acceptable;
    only a real violation label is a failure."""
    return set(value) if isinstance(value, list) else {value}

def primary_label(value) -> str:
    """The single label used for display and as the confusion matrix's row
    key. For a list, the first entry is the documented/primary expectation;
    the rest are accepted alternates - kept out of the axis so the matrix
    still shows one row per case rather than fragmenting on acceptance."""
    return value[0] if isinstance(value, list) else value

def judge(evaluation_type, result, world):
    """Deterministic checks first, semantic judge only for what's left."""
    from checks import deterministic_checks, most_severe

    findings = deterministic_checks(result["events"])
    if not findings and evaluation_type == "SEMANTIC":
        from semantic import semantic_judge
        findings = semantic_judge(result["final_response"], world)
    return most_severe(findings)

# --------------------------------------------------------------------- scoring
def severity(label):
    return LABELS.index(label)

def confusion(rows):
    """Keyed by (primary expected, actual). A second parallel counter tracks
    cells where every contributing row was an accepted-alternate match
    (actual != primary expected, but actual was still in that row's accepted
    set) so print_confusion can mark them as not-an-error without folding
    them onto the diagonal and losing which alternate actually happened."""
    matrix = defaultdict(Counter)
    accepted_alt = defaultdict(Counter)
    for r in rows:
        matrix[r["expected"]][r["actual"]] += 1
        if r["actual"] != r["expected"] and r["actual"] in r["accepted"]:
            accepted_alt[r["expected"]][r["actual"]] += 1
    return matrix, accepted_alt

def print_confusion(matrix, accepted_alt):
    width = 18
    print("\nconfusion matrix  (rows = expected, cols = actual; ~n = accepted "
          "alternate label, M1's ruling, not an error)")
    print(" " * width + "".join(f"{l[:9]:>11}" for l in LABELS))
    for expected in LABELS:
        cells = []
        for a in LABELS:
            n = matrix[expected][a]
            if not n:
                cells.append(f"{'.':>11}")
            elif accepted_alt[expected][a] == n:
                cells.append(f"{('~' + str(n)):>11}")
            else:
                cells.append(f"{n:>11}")
        print(f"{expected:<{width}}{''.join(cells)}")

def per_class(rows):
    """tp/fn are accepted-set aware: a row where label is one of several
    accepted answers but a DIFFERENT accepted label was realized counts
    toward neither tp nor fn for label - it wasn't a miss, it just wasn't
    this label's turn. Only a genuinely wrong actual (outside the accepted
    set entirely) counts as fn."""
    print("\nper-class metrics")
    print(f"{'label':<18}{'n':>4}{'precision':>11}{'recall':>9}")
    for label in LABELS:
        tp = sum(1 for r in rows if label in r["accepted"] and r["actual"] == label)
        fp = sum(1 for r in rows if label not in r["accepted"] and r["actual"] == label)
        fn = sum(1 for r in rows if label in r["accepted"]
                 and r["actual"] != label and r["actual"] not in r["accepted"])
        n = tp + fn
        if not n:
            continue
        precision = tp / (tp + fp) if (tp + fp) else 0.0
        recall = tp / n
        print(f"{label:<18}{n:>4}{precision:>11.2f}{recall:>9.2f}")

def breakdown(rows, key, title):
    print(f"\nby {title}")
    groups = defaultdict(list)
    for r in rows:
        groups[r[key]].append(r)
    print(f"{title:<26}{'n':>4}{'correct':>9}{'rate':>8}")
    for name, group in sorted(groups.items()):
        ok = sum(1 for r in group if r["actual"] in r["accepted"])
        print(f"{str(name):<26}{len(group):>4}{ok:>9}{ok/len(group):>8.0%}")

def summarize(rows):
    total = len(rows)
    correct = sum(1 for r in rows if r["actual"] in r["accepted"])

    missed = [r for r in rows if r["expected"] in VIOLATIONS and r["actual"] not in VIOLATIONS]
    false_alarms = [r for r in rows if r["expected"] not in VIOLATIONS and r["actual"] in VIOLATIONS]
    understated = [r for r in rows
                   if r["expected"] in VIOLATIONS and r["actual"] in VIOLATIONS
                   and severity(r["actual"]) < severity(r["expected"])]

    print(f"\naccuracy            {correct}/{total} = {correct/total:.1%}")
    print(f"missed violations   {len(missed):<4} <- the expensive error")
    for r in missed:
        print(f"                    {r['id']}: expected {r['expected']}, got {r['actual']}")
    print(f"false alarms        {len(false_alarms)}")
    for r in false_alarms:
        print(f"                    {r['id']}: expected {r['expected']}, got {r['actual']}")
    print(f"severity understated {len(understated)}")

    return {
        "total": total,
        "correct": correct,
        "accuracy": round(correct / total, 4),
        "missed_violations": len(missed),
        "missed_ids": [r["id"] for r in missed],
        "false_alarms": len(false_alarms),
        "false_alarm_ids": [r["id"] for r in false_alarms],
        "severity_understated": len(understated),
    }

def log_run(record):
    with LOG_FILE.open("a") as f:
        f.write(json.dumps(record) + "\n")

def print_curve():
    """The improvement curve. This is the slide."""
    if not LOG_FILE.exists():
        sys.exit("no runs.jsonl yet")
    runs = [json.loads(l) for l in LOG_FILE.read_text().splitlines() if l.strip()]
    if not runs:
        sys.exit("runs.jsonl is empty")
    print(f"{'when':<18}{'version':<10}{'build':<12}{'judge':<8}{'provider/model':<28}"
          f"{'acc':>7}{'missed':>8}{'alarms':>8}  note")
    for r in runs:
        s = r["summary"]
        provider_model = f"{r.get('provider', '?')}/{r.get('model', '?')}"
        if r.get("fallback"):
            provider_model += " [FALLBACK]"
        print(f"{r['timestamp'][:16]:<18}{r['version']:<10}{r['build']:<12}"
              f"{r['judge']:<8}{provider_model:<28}{s['accuracy']:>7.1%}{s['missed_violations']:>8}"
              f"{s['false_alarms']:>8}  {r.get('note','')}")

async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--build", choices=["vulnerable", "protected"], default="vulnerable")
    ap.add_argument("--version", default="v0", help="tag for this run, e.g. v3")
    ap.add_argument("--note", default="", help="what changed since the last run")
    ap.add_argument("--only", nargs="*", help="run specific case ids")
    ap.add_argument("--case-type", choices=sorted(CASE_TYPES))
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--curve", action="store_true", help="print the run history and exit")
    ap.add_argument("--log", action="store_true", help="record this run in runs.jsonl")
    ap.add_argument("--fixtures", action="store_true",
                     help="use saved traces/<id>_<build>.json fixtures when available, instead of live execution")
    args = ap.parse_args()

    if args.curve:
        print_curve()
        return

    random.seed(args.seed)
    cases, world = load()

    errors = validate(cases, world)
    if errors:
        print(f"validation failed ({len(errors)} problems)\n")
        for e in errors:
            print("  " + e)
        sys.exit(1)

    if args.only:
        cases = [c for c in cases if c["id"] in args.only]
    if args.case_type:
        cases = [c for c in cases if c["case_type"] == args.case_type]
    if not cases:
        sys.exit("no cases selected")

    judge_kind = "stub" if judge.__doc__ and "DAY 6" in judge.__doc__ else "real"
    print(f"validation ok: {len(cases)} cases, {len(world['orders'])} orders, "
          f"{len(world['customers'])} customers")
    print(f"build={args.build}  version={args.version}  judge={judge_kind}  seed={args.seed}")
    expected_key = "expected_label" if args.build == "vulnerable" else "expected_label_protected"
    rows = []
    skipped = []
    for case in cases:
        if args.fixtures:
            fixture_path = HERE / "traces" / f"{case['id']}_{args.build}.json"
            if not fixture_path.exists():
                skipped.append(case["id"])
                continue
        result = await run_case(case, world, args.build, use_fixtures=args.fixtures)
        expected_raw = case[expected_key]
        rows.append({
            "id": case["id"],
            "case_type": case["case_type"],
            "family": case["attack_family"],
            "eval_type": case["evaluation_type"],
            "priority": case["priority"],
            "expected": primary_label(expected_raw),
            "accepted": sorted(accepted_labels(expected_raw)),  # list, not set: rows are logged as JSON
            "actual": judge(case["evaluation_type"], result, world),
        })
    print(f"\n{'id':<16}{'type':<12}{'eval':<15}{'expected':<18}{'actual':<18}")
    print("-" * 82)
    for r in rows:
        if r["actual"] not in r["accepted"]:
            mark = "  X"
        elif r["actual"] != r["expected"]:
            mark = "  ~"  # accepted alternate (M1's ruling) - not an error
        else:
            mark = ""
        print(f"{r['id']:<16}{r['case_type']:<12}{r['eval_type']:<15}"
              f"{r['expected']:<18}{r['actual']:<18}{mark}")
    if skipped:
        print(f"\nskipped (no fixture): {len(skipped)}")
        for cid in skipped:
            print(f"                    {cid}")
    print(f"\nscored {len(rows)}  skipped {len(skipped)}")
    if not rows:
        sys.exit("no scored cases (all skipped) - nothing to report")
    print_confusion(*confusion(rows))
    per_class(rows)
    summary = summarize(rows)
    summary["skipped"] = len(skipped)
    summary["skipped_ids"] = skipped
    breakdown(rows, "eval_type", "eval type")
    breakdown(rows, "case_type", "case type")
    breakdown(rows, "family", "family")

    from app.llm import run_provider_info
    llm_info = run_provider_info()
    if llm_info["fallback"]:
        print(f"\n{'!' * 72}")
        print(f"! FALLBACK FIRED THIS RUN: judged on {llm_info['provider']}/{llm_info['model']}")
        print(f"! instead of the configured primary. This run is NOT comparable to")
        print(f"! non-fallback runs - do not average it into the improvement curve.")
        print(f"{'!' * 72}")

    if args.log:
        log_run({
            "run_id": uuid.uuid4().hex[:8],
            "timestamp": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "version": args.version,
            "build": args.build,
            "judge": judge_kind,
            "provider": llm_info["provider"],
            "model": llm_info["model"],
            "fallback": llm_info["fallback"],
            "seed": args.seed,
            "note": args.note,
            "summary": summary,
            "cases": rows,
        })
        print(f"\nlogged to {LOG_FILE.name}  (run --curve to see history)")

if __name__ == "__main__":
    asyncio.run(main())