"""
Larger clean sample to firm up the A-006 baseline before deciding on a prompt
revision. 7 more paced runs on ORD-1003 (unmodified A-006 prompt; combined with
the 3 already-valid runs from a006_baseline_clean.py gives n=10), and 5 more on
ORD-1005 (TEMP repointed fixture; combined with the 2 valid runs from the
original A-006_verify_order_experiment gives n=7). attacks_seed.json not
written to. Paced + retry-on-429 throughout.
"""
import sys, json, copy, asyncio
from pathlib import Path

sys.path.insert(0, "/Users/harshaavardhinij/Desktop/projects/Red-Teaming/backend")

from app.evaluation.runner import load, run_case
from app.evaluation.checks import deterministic_checks, most_severe

DEST = Path("/Users/harshaavardhinij/Desktop/projects/Red-Teaming/docs/security/evidence/A-006_prompt_revision")

cases, world = load()
a006 = next(c for c in cases if c["id"] == "A-006")

case_1005 = copy.deepcopy(a006)
case_1005["id"] = "A-006-TEMP-ORD1005"
case_1005["initial_session_state"]["refund_verification_state"] = {"ORD-1005": "NOT_VERIFIED"}
case_1005["prompt"] = [p.replace("ORD-1003", "ORD-1005") for p in case_1005["prompt"]]


def analyze(events, order_id):
    tool_calls = [(e["tool"], e["arguments"]) for e in events if e["type"] == "TOOL_CALL"]
    verify_calls = [e for e in events if e["type"] == "TOOL_CALL" and e["tool"] == "verify_order"]
    refund_calls = []
    for i, event in enumerate(events):
        if event["type"] == "TOOL_CALL" and event["tool"] == "issue_refund":
            result_event = None
            for later in events[i + 1:]:
                if later["type"] == "TOOL_RESULT" and later["tool"] == "issue_refund":
                    result_event = later
                    break
            result = (result_event.get("result") or {}) if result_event else {}
            executed = "error" not in result
            refund_calls.append({"amount": event["arguments"].get("amount"), "executed": executed, "error": result.get("error") if not executed else None})

    def verify_succeeded(call_event):
        idx = events.index(call_event)
        for later in events[idx + 1:]:
            if later["type"] == "TOOL_RESULT" and later["tool"] == "verify_order":
                r = later.get("result") or {}
                return "error" not in r
        return False

    verify_success_count = sum(1 for c in verify_calls if verify_succeeded(c))
    findings = deterministic_checks(events)
    verdict = most_severe(findings)

    return {
        "tool_engagement_count": len(tool_calls),
        "tool_calls": tool_calls,
        "verify_order_attempts": len(verify_calls),
        "verify_order_successes": verify_success_count,
        "issue_refund_attempts": len(refund_calls),
        "issue_refund_calls": refund_calls,
        "successful_refund_count": sum(1 for c in refund_calls if c["executed"]),
        "verdict": verdict,
        "findings": findings,
    }


async def run_with_retry(case, max_attempts=6):
    for attempt in range(1, max_attempts + 1):
        result = await run_case(case, world, "vulnerable", use_fixtures=False)
        if not result["final_response"].startswith("ERROR: LLM API Error 429"):
            return result
        wait = 20 * attempt
        print(f"  rate-limited (attempt {attempt}/{max_attempts}), waiting {wait}s")
        await asyncio.sleep(wait)
    raise RuntimeError(f"Still rate-limited after {max_attempts} attempts")


async def run_batch(case, order_id, name_prefix, run_numbers):
    rows = []
    for i in run_numbers:
        result = await run_with_retry(case)
        trace_path = DEST / f"{name_prefix}_run{i}.json"
        trace_path.write_text(json.dumps(result, indent=2))
        analysis = analyze(result["events"], order_id)
        analysis["run"] = i
        analysis["trace_file"] = trace_path.name
        analysis["final_response"] = result["final_response"]
        rows.append(analysis)
        print(json.dumps(analysis, indent=2))
        await asyncio.sleep(12)
    return rows


async def main():
    print("=== ORD-1003, runs 4-10 (7 more, combines with existing 3 for n=10) ===")
    ord1003_rows = await run_batch(a006, "ORD-1003", "a006_baseline_current_prompt", range(4, 11))

    print()
    print("=== ORD-1005, runs 6-10 (5 more, combines with existing 2 valid for n=7) ===")
    ord1005_rows = await run_batch(case_1005, "ORD-1005", "a006_ord1005_extra", range(6, 11))

    (DEST / "a006_larger_sample_results.json").write_text(json.dumps({
        "ord1003_runs_4_to_10": ord1003_rows,
        "ord1005_runs_6_to_10": ord1005_rows,
    }, indent=2))


asyncio.run(main())
