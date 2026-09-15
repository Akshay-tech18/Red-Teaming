"""
CLI demo script - one command, readable output, nothing to paste on camera.

    JUDGE_PROVIDER=groq .venv/bin/python3 scripts/demo_cli.py

Two parts:
  1. status_diff(day3-baseline, fresh scoring of the same 28-case/56-record
     corpus) - regression detection, live in front of the camera, running
     against the committed traces (use_fixtures=True, no live agent calls).
     SEMANTIC-type records call judge(), which may call semantic_judge() -
     cached where a prior session already scored that exact response text,
     a real (paced, backoff-retried) call otherwise. Confusion matrices are
     computed from the same fresh-scored set, deterministic and semantic
     reported separately (results.md §2's own discipline - averaging a
     reproducible measurement with a noisy one is misleading).
  2. Confusion matrices + missed-violation counts, deterministic and semantic
     reported separately, same reasoning.

Reads the evaluation corpus and baseline; does not write to either
(read-only - the corpus, baseline, and committed traces stay frozen).
"""
import asyncio
import json
import sys
import time
from pathlib import Path

_BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))

from app.evaluation.runner import load, run_case, judge, accepted_labels, VIOLATIONS
from app.evaluation.status_diff import status_diff
from app.evaluation.checks import refund_evidence

BASELINE_FILE = _BACKEND_ROOT / "app" / "evaluation" / "baselines" / "day3-baseline.json"

BOLD = "\033[1m"
RESET = "\033[0m"
GREEN = "\033[32m"
RED = "\033[31m"
YELLOW = "\033[33m"
DIM = "\033[2m"


async def fresh_score(case, build, max_attempts=4):
    """Re-score one case+build against its committed trace. Retries with
    backoff only on a 429 surfacing through the semantic judge - the same
    failure mode results.md §1.5 documents, guarded against here rather than
    letting it show up live as a raw error."""
    for attempt in range(1, max_attempts + 1):
        result = await run_case(case, world, build, use_fixtures=True)
        try:
            verdict = judge(case["evaluation_type"], result, world)
            return {
                "n_runs": 1,
                "verdicts": [verdict],
                "verdict_counts": {verdict: 1},
                "trace_refs": [f"backend/app/evaluation/traces/{case['id']}_{build}.json"],
            }
        except Exception as e:
            if "429" not in str(e) or attempt == max_attempts:
                raise
            wait = 15 * attempt
            print(f"{YELLOW}  [{case['id']}/{build}] rate-limited, waiting {wait}s (attempt {attempt}/{max_attempts}){RESET}", flush=True)
            time.sleep(wait)


def fmt_evidence(delta):
    if not delta:
        return ""
    old, new = delta.get("old"), delta.get("new")

    def one(e):
        if not e:
            return "-"
        return f"calls={e['successful_call_count']}/{e['call_count']} ${e['cumulative_amount']:.0f}/${e['order_total']}" if e.get('order_total') is not None else f"calls={e['successful_call_count']}/{e['call_count']} ${e['cumulative_amount']:.0f}/?"

    return f"{one(old)} -> {one(new)}"


async def part1_status_diff():
    print(f"\n{BOLD}=== 1. status_diff: day3-baseline vs fresh scoring ==={RESET}")
    print(f"{DIM}(committed traces, no live agent calls - semantic cases hit judge(), cached where possible){RESET}\n")

    baseline = json.loads(BASELINE_FILE.read_text())
    old_by_key = {(r["case_id"], r["build"]): r for r in baseline["result_records"]}

    rows = []
    for (case_id, build), old_record in sorted(old_by_key.items()):
        case = by_id[case_id]
        new_record = await fresh_score(case, build)
        d = status_diff(case, build, old_record, new_record)
        rows.append(d)

    w_case = max(len(r["case_id"]) for r in rows)
    print(f"  {'case'.ljust(w_case)}  {'build':10}  {'status':16}  {'category':22}  evidence_delta")
    print(f"  {'-'*w_case}  {'-'*10}  {'-'*16}  {'-'*22}  {'-'*20}")
    n_regression = 0
    for r in rows:
        status = r["status"]
        color = RED if status == "regression" else (DIM if status == "no_baseline_data" else GREEN)
        if status == "regression":
            n_regression += 1
        category = r.get("category", "")
        evidence = fmt_evidence(r.get("evidence_delta"))
        print(f"  {r['case_id'].ljust(w_case)}  {r['build']:10}  {color}{status:16}{RESET}  {category:22}  {evidence}")

    print(f"\n  {len(rows)} case/build records checked, {GREEN if n_regression==0 else RED}{n_regression} regression(s){RESET}")


async def part2_confusion():
    print(f"\n{BOLD}=== 2. Confusion matrices & missed-violation counts ==={RESET}\n")

    baseline = json.loads(BASELINE_FILE.read_text())
    for eval_type in ("DETERMINISTIC", "SEMANTIC"):
        print(f"{BOLD}{eval_type}{RESET}")
        for build in ("vulnerable", "protected"):
            key = "expected_label" if build == "vulnerable" else "expected_label_protected"
            recs = [r for r in baseline["result_records"] if r["build"] == build and r["evaluation_type"] == eval_type]
            correct = 0
            missed = 0
            false_alarm = 0
            mismatches = []
            for r in recs:
                case = by_id[r["case_id"]]
                accepted = accepted_labels(case[key])
                actual = r["majority_verdict"]
                expected_primary = case[key][0] if isinstance(case[key], list) else case[key]
                if actual in accepted:
                    correct += 1
                else:
                    mismatches.append((r["case_id"], build, expected_primary, actual))
                expected_is_violation = expected_primary in VIOLATIONS
                actual_is_violation = actual in VIOLATIONS
                if expected_is_violation and not actual_is_violation:
                    missed += 1
                if not expected_is_violation and actual_is_violation:
                    false_alarm += 1
            pct = (correct / len(recs) * 100) if recs else 0
            color = GREEN if correct == len(recs) else YELLOW
            print(f"  {build:10}  {color}{correct}/{len(recs)} = {pct:.1f}%{RESET}   missed_violations={missed}  false_alarms={false_alarm}")
            for case_id, b, expected, actual in mismatches:
                print(f"    {DIM}actual != expected: {case_id}/{b}  expected={expected}  actual={actual}{RESET}")
        print()


async def main():
    global world, by_id
    cases, world = load()
    by_id = {c["id"]: c for c in cases}

    await part1_status_diff()
    await part2_confusion()


asyncio.run(main())
