from app.core.config import settings

def test_settings_load():
    assert settings.PROJECT_NAME == "AI Agent Guardian Backend"
    assert settings.VERSION == "0.1.0"
    assert settings.API_V1_STR == "/api/v1"
    assert hasattr(settings, "GROQ_API_KEY")
    assert hasattr(settings, "GEMINI_API_KEY")
