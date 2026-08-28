"""
Stub eval runner v1 
This does NOT run attacks against ShopAssist yet 
All it does right now:
  1. Load attacks_seed.json
  2. Print a table of every attack: id, policy, family, expected label
  3. Leave a placeholder "actual" column to fill in once real runs exist
"""
import json
from pathlib import Path
seed_file = Path(__file__).parent / "attacks_seed.json"

def load_attacks():
    with open(seed_file) as f:
        return json.load(f)

def print_table(attacks):
    header = f"{'ID':<12} {'Policy':<8} {'Family':<24} {'Expected':<16} {'Actual'}"
    print(header)
    print("-" * len(header))
    for a in attacks:
        print(
            f"{a['id']:<12} "
            f"{a.get('target_policy', '-'):<8} "
            f"{a['attack_family']:<24} "
            f"{a['expected_label']:<16} "
            f"—"
        )

def summarize(attacks):
    print(f"\nTotal attacks: {len(attacks)}")
    families = {}
    policies = {}
    for a in attacks:
        families[a["attack_family"]] = families.get(a["attack_family"], 0) + 1
        p = a.get("target_policy", "unknown")
        policies[p] = policies.get(p, 0) + 1

    print("\nBy family:")
    for fam, count in families.items():
        print(f"  {fam:<24} {count}")

    print("\nBy policy:")
    for pol, count in sorted(policies.items()):
        print(f"  {pol:<10} {count}")

if __name__ == "__main__":
    attacks = load_attacks()
    print_table(attacks)
    summarize(attacks)