import os
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types

ROOT = Path(__file__).resolve().parents[2]
load_dotenv(ROOT / ".env")

PROVIDER="google"
MODEL = "gemini-3.5-flash"
TEMPERATURE=0
TIMEOUT_MS=30_000

client = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])

CONFIG=types.GenerateContentConfig(
    temperature=TEMPERATURE,
    http_options=types.HttpOptions(timeout=TIMEOUT_MS),
)
def call(prompt:str)->str:
    response = client.models.generate_content(
        model=MODEL,
        contents=prompt,
        config=CONFIG,
    )
    return response.text

if __name__=="__main__":
    print(call("Say hello in Spanish"))