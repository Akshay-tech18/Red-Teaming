## Built
 
### `app/extraction/extract.py` — Tier 1 extraction working
 
Reads `policies.md`, sends it to Gemini, returns structured constraints as JSON. Separate
pipeline from `runner.py` — different input, different ground truth, different failure
modes. Kept as a sibling directory so neither imports the other.
 
- `PROVIDER`, `MODEL`, `TEMPERATURE` pinned as constants and written into every log entry
- temperature 0 and a 30s timeout, both applied in one `call()` wrapper so nothing can
  accidentally use different settings
- `tier1_baseline.json` — write-once reference output (committed)
- `extraction_runs.jsonl` — raw responses per run (local only, gitignored)
### Tier 1 result
 
Five constraints returned, valid JSON, no fences. All four `protected_action` values
correct including `null` for the two response-level policies. `evaluation_type` correct
on all four scored constraints. `violation_outcome` correct throughout.
 
**Two findings worth reporting rather than tuning away:**
 
1. **The model did not merge P-003 and P-004.** The ground truth accepts either. Treating
   them as separate rules is defensible — merging requires noticing they share a tool.
2. **P-003's `evaluation_type` came back `SEMANTIC`** where ground truth says
   `DETERMINISTIC`. But P-003 names no tool, only "Protected Information", so a
   response-level check is the sensible reading. It is only deterministic *because* it
   shares a mechanism with P-004. So the split answer and the wrong `evaluation_type`
   are the same mistake, not two.
Tuning the prompt until it reproduces the ground truth would stop being extraction and
become fitting. Fix genuinely underspecified things (e.g. the bare-number rule for
`must_mention`, which was never stated); leave the P-003 reading alone.
 
**What was deliberately not given to the extractor:** `constraint_mapping.md` (the answer
key), and `labels.md` (its near-miss examples name the tools and states outright, which
would hand over three of the four constraints). The five label names and neutral one-line
descriptions are supplied inline in the prompt — vocabulary, not mappings. A real
deployment would ship the label vocabulary and receive only the customer's policies, so
this stays honest.
 
---
 
## Model choice
 
`gemini-3.5-flash`, pinned. 

## Limitation
Extraction is not fully deterministic even at temperature 0