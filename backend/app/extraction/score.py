import argparse
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
GROUND_TRUTH_FILE = HERE / "extraction_ground_truth.json"
DEFAULT_EXTRACTED = HERE / "tier1_baseline.json"
VERDICTS_FILE = HERE / "required_state_verdicts.json"

VERDICTS = ("CORRECT", "PARTIAL", "WRONG")

def load(extracted_path: Path):
    ground_truth = json.loads(GROUND_TRUTH_FILE.read_text(encoding="utf-8"))
    extracted = json.loads(extracted_path.read_text(encoding="utf-8"))
    return ground_truth, extracted

def load_verdicts() -> dict:
    if not VERDICTS_FILE.exists():
        return {}
    return json.loads(VERDICTS_FILE.read_text(encoding="utf-8"))

def policies(constraint) -> set:
    return set(constraint.get("source_policy") or [])

def match(expected_list, extracted_list):
    pairs = []
    matched_indices = set()

    for expected in expected_list:
        wanted = policies(expected)
        found = []
        for i, candidate in enumerate(extracted_list):
            if policies(candidate) & wanted:
                found.append(candidate)
                matched_indices.add(i)
        pairs.append((expected, found))

    orphans = [c for i, c in enumerate(extracted_list) if i not in matched_indices]
    return pairs, orphans

def tool_name(value, aliases: dict):
    if value is None:
        return None
    name = str(value).split("(")[0].strip()
    for canonical, variants in aliases.items():
        if name == canonical or name in variants:
            return canonical
    return name

def score_protected_action(expected, candidates, aliases):
    want = tool_name(expected.get("protected_action"), aliases)
    got = [tool_name(c.get("protected_action"), aliases) for c in candidates]
    return (want in got), want, got


def score_exact(expected, candidates, field):
    want = expected.get(field)
    allowed = set(want) if isinstance(want, list) else {want}
    got = [c.get(field) for c in candidates]
    return bool(allowed & set(got)), want, got


def score_must_mention(expected, candidates):
    parts = []
    for c in candidates:
        parts.append(str(c.get("protected_action") or ""))
        parts.append(str(c.get("required_state") or ""))
        parts.extend(str(k) for k in (c.get("must_mention") or []))
    haystack = " ".join(parts).lower()

    wanted = expected.get("must_mention") or []
    hits = [w for w in wanted if w.lower() in haystack]
    misses = [w for w in wanted if w.lower() not in haystack]
    return hits, misses

def report(pairs, orphans, aliases):
    totals = {"protected_action": 0, "evaluation_type": 0, "violation_outcome": 0}
    mention_hits = mention_total = 0
    scored = 0
    hand_judge = []

    print(f"{'':<8}{'action':<9}{'eval':<7}{'outcome':<9}{'must_mention':<14}note")
    print("-" * 62)

    for expected, candidates in pairs:
        name = expected["maps_to"]

        if not candidates:
            print(f"{name:<8}{'MISSED':<9}{'-':<7}{'-':<9}{'-':<14}no match found")
            scored += 1
            continue

        scored += 1
        split = len(candidates) > 1

        ok_action, want_action, got_action = score_protected_action(
            expected, candidates, aliases
        )
        ok_eval, _, got_eval = score_exact(expected, candidates, "evaluation_type")
        ok_outcome, _, got_outcome = score_exact(
            expected, candidates, "violation_outcome"
        )
        hits, misses = score_must_mention(expected, candidates)

        totals["protected_action"] += ok_action
        totals["evaluation_type"] += ok_eval
        totals["violation_outcome"] += ok_outcome
        mention_hits += len(hits)
        mention_total += len(hits) + len(misses)

        note = ""
        if split:
            srcs = sorted(p for c in candidates for p in policies(c))
            note = f"SPLIT across {', '.join(srcs)}"

        mention_cell = f"{len(hits)}/{len(hits) + len(misses)}"
        print(
            f"{name:<8}"
            f"{('ok' if ok_action else 'X'):<9}"
            f"{('ok' if ok_eval else 'X'):<7}"
            f"{('ok' if ok_outcome else 'X'):<9}"
            f"{mention_cell:<14}{note}"
        )

        if not ok_action:
            print(f"{'':<8}  action:  wanted {want_action}, got {got_action}")
        if not ok_eval:
            print(f"{'':<8}  eval:    wanted {expected.get('evaluation_type')}, got {got_eval}")
        if not ok_outcome:
            print(f"{'':<8}  outcome: wanted {expected.get('violation_outcome')}, got {got_outcome}")
        if misses:
            print(f"{'':<8}  missing keywords: {misses}")

        hand_judge.append((name, expected, candidates))

    for c in orphans:
        print(f"{'--':<8}{'ORPHAN':<9}extracted {sorted(policies(c))} matched nothing")

    print()
    print(f"protected_action   {totals['protected_action']}/{scored}")
    print(f"evaluation_type    {totals['evaluation_type']}/{scored}")
    print(f"violation_outcome  {totals['violation_outcome']}/{scored}")
    print(f"must_mention       {mention_hits}/{mention_total} keywords")
    print(f"orphans            {len(orphans)}")

    return hand_judge

def print_hand_judgement(hand_judge, verdicts):
    print("\n" + "=" * 62)
    print("required_state -- judged by hand")
    print("=" * 62)

    counts = {v: 0 for v in VERDICTS}
    missing = []

    for name, expected, candidates in hand_judge:
        recorded = verdicts.get(name)
        print(f"\n{name}")
        print(f"  expected:  {expected.get('required_state')}")
        for c in candidates:
            src = ",".join(sorted(policies(c)))
            print(f"  extracted [{src}]: {c.get('required_state')}")

        if recorded in VERDICTS:
            counts[recorded] += 1
            print(f"  verdict:   {recorded}")
        else:
            missing.append(name)
            print("  verdict:   -- not recorded --")

    print()
    if missing:
        print(f"no verdict recorded for: {', '.join(missing)}")
        print(f"add them to {VERDICTS_FILE.name}, e.g.")
        print(json.dumps({m: "CORRECT" for m in missing}, indent=2))
    else:
        summary = "  ".join(f"{v} {counts[v]}" for v in VERDICTS)
        print(f"required_state     {summary}")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--extracted",
        type=Path,
        default=DEFAULT_EXTRACTED,
        help="extractor output to score (default: tier1_baseline.json)",
    )
    args = ap.parse_args()

    ground_truth, extracted = load(args.extracted)
    expected_list = ground_truth["expected_constraints"]
    aliases = ground_truth.get("tool_name_aliases", {})
    verdicts = load_verdicts()

    print(f"scoring {args.extracted.name}")
    print(f"{len(expected_list)} expected, {len(extracted)} extracted\n")

    pairs, orphans = match(expected_list, extracted)
    hand_judge = report(pairs, orphans, aliases)
    print_hand_judgement(hand_judge, verdicts)

if __name__ == "__main__":
    main()