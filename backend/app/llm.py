"""
Shared LLM client for extract.py (extraction) and semantic.py (C-009 judge).

One provider and one model per run, recorded by the caller. This module never
mixes providers within a run on its own initiative: PROVIDER/MODEL are locked
in as soon as the first call succeeds, and any later call that would need a
different provider aborts loudly instead of quietly switching (see
_locked_provider below). The two supported keys are for failover (primary
down/out of quota) and deliberate cross-provider checks run separately - never
for spreading load within one run. See CONTEXT.md, "Model and API notes".
"""

import os
import time
from pathlib import Path

import httpx
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]  # backend/app/llm.py -> backend/
load_dotenv(ROOT / ".env")

PROVIDER = os.environ.get("JUDGE_PROVIDER", "google")
MODEL = os.environ.get("JUDGE_MODEL", "gemini-3.5-flash")

# Only used if PROVIDER's first call this run fails outright (see call()).
FALLBACK_PROVIDER = os.environ.get("JUDGE_FALLBACK_PROVIDER", "groq")
FALLBACK_MODEL = os.environ.get("JUDGE_FALLBACK_MODEL", "openai/gpt-oss-120b")

TEMPERATURE = 0
TIMEOUT_S = 120
_RETRYABLE_STATUS = {429, 503}

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


class MidRunProviderChangeError(RuntimeError):
    """Raised instead of silently failing over once a provider has already
    produced a result earlier in this run. A run must use one provider
    throughout; if the primary stops working partway through, the run is
    mixed evidence and must be aborted, not patched over."""


def _quota_details(e) -> list:
    try:
        return (e.details or {}).get("error", {}).get("details", [])
    except AttributeError:
        return []


def _retry_delay_seconds(e) -> float | None:
    """Google's own retryDelay hint (RetryInfo), when present. A per-minute
    quota can need ~60s to clear - far longer than a fixed short backoff."""
    for d in _quota_details(e):
        delay = d.get("retryDelay", "")
        if delay.endswith("s"):
            try:
                return float(delay[:-1])
            except ValueError:
                continue
    return None


def _is_daily_quota_exhausted(e) -> bool:
    """Distinguishes a per-day quota (retrying later today will not help)
    from a per-minute one (waiting the RetryInfo delay will)."""
    for d in _quota_details(e):
        for v in d.get("violations", []):
            if "PerDay" in v.get("quotaId", ""):
                return True
    return False


def _google_call(prompt: str, model: str) -> str:
    from google import genai
    from google.genai import types, errors

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not set")

    client = genai.Client(api_key=api_key)
    config = types.GenerateContentConfig(
        temperature=TEMPERATURE,
        http_options=types.HttpOptions(timeout=TIMEOUT_S * 1000),
    )
    for attempt in range(3):
        try:
            response = client.models.generate_content(model=model, contents=prompt, config=config)
            return response.text
        except errors.APIError as e:
            if e.code not in _RETRYABLE_STATUS:
                raise
            if _is_daily_quota_exhausted(e):
                raise RuntimeError(
                    f"Gemini daily free-tier quota exhausted for {model} - "
                    f"retrying within this run cannot help, it resets on Google's clock, "
                    f"not ours. ({e})"
                ) from e
            if attempt == 2:
                raise
            wait = _retry_delay_seconds(e)
            wait = (wait + 2) if wait is not None else 5 * (2 ** attempt)
            print(f"[llm] google attempt {attempt} failed ({e.code}), retrying in {wait:.0f}s")
            time.sleep(wait)


def _groq_call(prompt: str, model: str) -> str:
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not set")

    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": TEMPERATURE,
    }
    for attempt in range(3):
        try:
            with httpx.Client(timeout=TIMEOUT_S) as client:
                response = client.post(GROQ_URL, headers=headers, json=payload)
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]
        except (httpx.HTTPStatusError, httpx.TimeoutException) as e:
            status = getattr(getattr(e, "response", None), "status_code", None)
            retryable = isinstance(e, httpx.TimeoutException) or status in _RETRYABLE_STATUS
            if not retryable or attempt == 2:
                raise
            wait = 5 * (2 ** attempt)
            print(f"[llm] groq attempt {attempt} failed ({status}), retrying in {wait}s")
            time.sleep(wait)


_PROVIDERS = {"google": _google_call, "groq": _groq_call}

# Locked in by the first successful call() this process makes. A fresh
# `python runner.py` invocation is a fresh process, so this naturally resets
# per run without any explicit run-boundary bookkeeping.
_locked_provider = None
_locked_model = None
_fell_back = False


def call(prompt: str) -> str:
    """Call the configured judge/extraction LLM. Locks provider+model to
    whichever one first succeeds this run; refuses to switch after that."""
    global _locked_provider, _locked_model, _fell_back

    provider = _locked_provider or PROVIDER
    model = _locked_model or MODEL

    if provider not in _PROVIDERS:
        raise ValueError(f"Unknown provider: {provider!r} (expected one of {sorted(_PROVIDERS)})")

    try:
        text = _PROVIDERS[provider](prompt, model)
        _locked_provider, _locked_model = provider, model
        return text
    except Exception as primary_err:
        if _locked_provider is not None:
            # Something already succeeded on this provider earlier in the
            # run. Do not fail over now - that would silently mix providers
            # within one run's numbers. Abort instead.
            raise MidRunProviderChangeError(
                f"{provider}/{model} failed after earlier calls in this run already "
                f"succeeded on it ({primary_err!r}). This run is now mixed evidence if "
                f"continued - aborting rather than failing over mid-run."
            ) from primary_err

        if provider == FALLBACK_PROVIDER or FALLBACK_PROVIDER not in _PROVIDERS:
            raise  # no further fallback defined

        print(
            f"[llm] WARNING: {provider}/{model} failed before any call succeeded this run "
            f"({primary_err!r}). Falling over to {FALLBACK_PROVIDER}/{FALLBACK_MODEL} for the "
            f"rest of this run. This run is fallback-flagged - do not average its numbers "
            f"with non-fallback runs."
        )
        text = _PROVIDERS[FALLBACK_PROVIDER](prompt, FALLBACK_MODEL)
        _locked_provider, _locked_model, _fell_back = FALLBACK_PROVIDER, FALLBACK_MODEL, True
        return text


def run_provider_info() -> dict:
    """What actually answered calls so far this run - for run logs, not for
    deciding what to call next. Reflects config defaults if call() has not
    been made yet (e.g. an all-deterministic run makes no LLM calls at all)."""
    return {
        "provider": _locked_provider or PROVIDER,
        "model": _locked_model or MODEL,
        "fallback": _fell_back,
    }
