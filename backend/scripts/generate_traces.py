import asyncio
import json
import os
from pathlib import Path

# Fix sys.path for absolute imports to work correctly
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.evaluation.runner import load, run_case

async def main():
    cases, world = load()
    traces_dir = Path("backend/app/evaluation/traces")
    traces_dir.mkdir(parents=True, exist_ok=True)
    
    generated = 0
    skipped = 0
    
    for case in cases:
        if case["id"] == "A-006":
            print(f"Skipping {case['id']} (on hold)")
            skipped += 1
            continue
            
        for build in ["vulnerable", "protected"]:
            # Protected build evaluation checks generally only apply if the case explicitly defines them, 
            # but standard practice in this repo is to generate both traces for all cases except
            # where explicitly unsupported. We will generate both unless we know it's unneeded, 
            # but the teammate specifically said "Missing both builds - 19 cases, 38 files... Missing protected only - 3 cases, 3 files".
            # The easiest way is to just generate whichever file is missing.
            
            trace_path = traces_dir / f"{case['id']}_{build}.json"
            if trace_path.exists():
                skipped += 1
                continue
                
            print(f"Generating trace for {case['id']} ({build})...")
            
            # Simple retry logic for rate limits / non-determinism
            max_retries = 5
            for attempt in range(max_retries):
                try:
                    result = await run_case(case, world, build, use_fixtures=False)
                    
                    # Validation Gate
                    final_resp = result.get("final_response", "")
                    if final_resp.startswith("ERROR:"):
                        raise RuntimeError(f"API/Execution Error captured in final_response: {final_resp}")
                    
                    has_valid_event = any(e.get("type") in ("AGENT_MESSAGE", "TOOL_CALL") for e in result.get("events", []))
                    if not has_valid_event:
                        raise RuntimeError("Trace is empty of agent activity (possible crash before execution).")
                    
                    # Save to file
                    with open(trace_path, "w") as f:
                        json.dump(result, f, indent=2)
                        
                    print(f"  -> Saved {trace_path.name}")
                    generated += 1
                    break
                except Exception as e:
                    print(f"  -> Attempt {attempt+1} failed: {str(e)}")
                    if attempt < max_retries - 1:
                        wait = 5 * (2 ** attempt)
                        print(f"  -> Retrying in {wait} seconds...")
                        await asyncio.sleep(wait)
                    else:
                        print(f"  -> Failed to generate trace for {case['id']} ({build}) after {max_retries} attempts.")
                        
    print(f"\nDone! Generated: {generated}, Skipped: {skipped}")

if __name__ == "__main__":
    asyncio.run(main())
