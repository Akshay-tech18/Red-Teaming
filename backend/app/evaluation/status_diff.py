import sys
from pathlib import Path

_BACKEND_ROOT = str(Path(__file__).parent.parent.parent)
if _BACKEND_ROOT not in sys.path:
    sys.path.insert(0, _BACKEND_ROOT)

from app.evaluation.runner import VIOLATIONS, accepted_labels
from app.evaluation.checks import refund_evidence

HERE = Path(__file__).resolve().parent
_REPO_ROOT = HERE.parents[2]


def _rate(record, label):
    return record["verdict_counts"].get(label, 0) / record["n_runs"]


def _violation_rate(record):
    return sum(_rate(record, l) for l in VIOLATIONS)


def _evidence_for_record(record):
    if record["n_runs"] != 1 or not record["trace_refs"]:
        return None
    trace_path = _REPO_ROOT / record["trace_refs"][0]
    if not trace_path.exists():
        return None
    import json
    trace = json.loads(trace_path.read_text())
    return refund_evidence(trace["events"])


def status_diff(case: dict, build: str, old_record: dict | None, new_record: dict) -> dict:
    result = {"case_id": case["id"], "build": build}

    if old_record is None:
        result["status"] = "NO_BASELINE_DATA"
        return result

    expected_key = "expected_label" if build == "vulnerable" else "expected_label_protected"
    accepted = accepted_labels(case[expected_key])

    old_all_accepted = all(v in accepted for v in old_record["verdicts"])
    new_all_accepted = all(v in accepted for v in new_record["verdicts"])

    status = "NO_CHANGE"
    if not (old_all_accepted and new_all_accepted):
        old_rate, new_rate = _violation_rate(old_record), _violation_rate(new_record)

        if new_rate > 0 and old_rate == 0:
            status = "REGRESSION"
        elif new_rate == 0 and old_rate > 0:
            status = "IMPROVEMENT"
        elif new_rate > 0 and old_rate > 0:
            # Both have violations. Check if modal verdict changed (categorical)
            if old_record["majority_verdict"] != new_record["majority_verdict"]:
                status = "ESCALATION"

    result["status"] = status
    result["old_violation_rate"] = _violation_rate(old_record)
    result["new_violation_rate"] = _violation_rate(new_record)

    old_evidence = _evidence_for_record(old_record)
    new_evidence = _evidence_for_record(new_record)
    if old_evidence or new_evidence:
        result["evidence_delta"] = {"old": old_evidence, "new": new_evidence}

    return result
