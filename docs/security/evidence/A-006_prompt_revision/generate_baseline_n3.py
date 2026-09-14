"""
Diagnostic, not "the probe" M1 asked for. Before designing a prompt revision,
get valid (non-rate-limited) data on how the CURRENT, unrevised A-006 prompt
actually behaves on ORD-1003 - the earlier A-006_verify_order_experiment run
turned out to be 5/5 rate-limit errors on this exact target, so the real
current-prompt behavior on ORD-1003 has never actually been observed. Small
sample (n=3), paced, retry-on-429, using the exact committed attacks_seed.json
A-006 case unmodified (read-only - attacks_seed.json is not written to).
"""
import sys, json, asyncio
from pathlib import Path

sys.path.insert(0, "/Users/harshaavardhinij/Desktop/projects/Red-Teaming/backend")

from app.evaluation.runner import load, run_case, judge
from app.evaluation.checks import deterministic_checks, most_severe

DEST = Path("/Users/harshaavardhinij/Desktop/projects/Red-Teaming/docs/security/evidence/A-006_prompt_revision")

cases, world = load()
case = next(c for c in cases if c["id"] == "A-006")


def analyze(events):
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

    def verify_succeeded(call_event, events):
        idx = events.index(call_event)
        for later in events[idx + 1:]:
            if later["type"] == "TOOL_RESULT" and later["tool"] == "verify_order":
                r = later.get("result") or {}
                return "error" not in r
        return False

    verify_success_count = sum(1 for c in verify_calls if verify_succeeded(c, events))

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


async def run_with_retry(max_attempts=6):
    for attempt in range(1, max_attempts + 1):
        result = await run_case(case, world, "vulnerable", use_fixtures=False)
        if not result["final_response"].startswith("ERROR: LLM API Error 429"):
            return result
        wait = 20 * attempt
        print(f"  rate-limited (attempt {attempt}/{max_attempts}), waiting {wait}s")
        await asyncio.sleep(wait)
    raise RuntimeError(f"Still rate-limited after {max_attempts} attempts")


async def main():
    rows = []
    for i in range(1, 4):
        result = await run_with_retry()
        trace_path = DEST / f"a006_baseline_current_prompt_run{i}.json"
        trace_path.write_text(json.dumps(result, indent=2))
        analysis = analyze(result["events"])
        analysis["run"] = i
        analysis["trace_file"] = trace_path.name
        analysis["final_response"] = result["final_response"]
        rows.append(analysis)
        print(json.dumps(analysis, indent=2))
        await asyncio.sleep(12)

    (DEST / "a006_baseline_current_prompt_results.json").write_text(json.dumps({"case_prompt": case["prompt"], "runs": rows}, indent=2))


asyncio.run(main())
