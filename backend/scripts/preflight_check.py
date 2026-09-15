"""
One-command pre-flight check for the demo. Run immediately before recording:

    JUDGE_PROVIDER=groq .venv/bin/python3 scripts/preflight_check.py

Checks Postgres, seed data, JUDGE_PROVIDER, the backend's /health, and the
frontend build - each independently, so one failure doesn't hide the rest.
Does not start anything (backend/frontend must already be running for their
checks to pass) and does not touch the evaluation corpus, baseline, or traces.
"""
import json
import os
import sys
from pathlib import Path

_BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))

RESET = "\033[0m"
GREEN = "\033[32m"
RED = "\033[31m"
YELLOW = "\033[33m"

results = []  # (label, ok: bool, detail: str)


def check(label, fn):
    try:
        ok, detail = fn()
    except Exception as e:
        ok, detail = False, f"{type(e).__name__}: {e}"
    results.append((label, ok, detail))


def check_judge_provider():
    v = os.environ.get("JUDGE_PROVIDER")
    if v == "groq":
        return True, "JUDGE_PROVIDER=groq"
    if v:
        return False, f"JUDGE_PROVIDER={v!r}, expected 'groq' for tonight's demo"
    return False, "unset - app.llm defaults to 'google' silently (results.md §1.3). Run with JUDGE_PROVIDER=groq set."


def check_postgres():
    import asyncio
    import asyncpg
    from app.core.config import settings

    url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")

    async def _try():
        conn = await asyncio.wait_for(asyncpg.connect(url), timeout=3)
        await conn.close()

    asyncio.run(_try())
    return True, f"reachable at {url.split('@')[-1] if '@' in url else url}"


def check_attacks_seeded():
    import asyncio
    import asyncpg
    from app.core.config import settings

    url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
    seed_file = _BACKEND_ROOT / "app" / "evaluation" / "attacks_seed.json"
    seed_ids = sorted(c["id"] for c in json.loads(seed_file.read_text()))

    async def _fetch():
        conn = await asyncio.wait_for(asyncpg.connect(url), timeout=3)
        try:
            rows = await conn.fetch("SELECT id FROM attacks")
            return sorted(r["id"] for r in rows)
        finally:
            await conn.close()

    db_ids = asyncio.run(_fetch())
    if len(db_ids) != 28:
        return False, f"{len(db_ids)} attacks in DB, expected 28. Run scripts/seed_db.py."
    if db_ids != seed_ids:
        missing = set(seed_ids) - set(db_ids)
        extra = set(db_ids) - set(seed_ids)
        return False, f"28 rows but IDs don't match attacks_seed.json - missing={sorted(missing)} extra={sorted(extra)}"
    return True, f"28/28, IDs match {seed_file.name} exactly"


def check_backend_health():
    import httpx
    r = httpx.get("http://127.0.0.1:8000/api/v1/health", timeout=3)
    if r.status_code != 200:
        return False, f"HTTP {r.status_code} - is uvicorn running? (JUDGE_PROVIDER=groq uvicorn app.main:app --port 8000)"
    return True, f"HTTP 200 from http://127.0.0.1:8000/api/v1/health"


def check_frontend_build():
    dist = _BACKEND_ROOT.parent / "frontend" / "dist" / "index.html"
    if not dist.exists():
        return False, f"{dist} missing - run `npm run build` in frontend/"
    return True, f"{dist.relative_to(_BACKEND_ROOT.parent)} present"


def main():
    check("Postgres reachable", check_postgres)
    check("28 attacks seeded, IDs match attacks_seed.json", check_attacks_seeded)
    check("JUDGE_PROVIDER=groq", check_judge_provider)
    check("Backend responds on /health", check_backend_health)
    check("Frontend build present", check_frontend_build)

    print()
    width = max(len(label) for label, _, _ in results)
    all_ok = True
    for label, ok, detail in results:
        all_ok = all_ok and ok
        color = GREEN if ok else RED
        status = "PASS" if ok else "FAIL"
        print(f"  {color}[{status}]{RESET} {label.ljust(width)}  {detail}")

    print()
    if all_ok:
        print(f"{GREEN}All checks passed. Ready to record.{RESET}\n")
    else:
        print(f"{RED}Not ready - fix the FAIL rows above before recording.{RESET}\n")
    sys.exit(0 if all_ok else 1)


if __name__ == "__main__":
    main()
