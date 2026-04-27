from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "News Topic Drift Detection API"
    DATABASE_URL: str = "sqlite:///./drift.db"
    SIMILARITY_THRESHOLD: float = 0.75

settings = Settings()
