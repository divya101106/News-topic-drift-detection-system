from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "News Topic Drift Detection API"
    DATABASE_URL: str = "sqlite:///./drift.db"
    SIMILARITY_THRESHOLD: float = 0.75
    NEWS_API_KEY: str = "pub_d8ede7bbda494f5fa882230aa626cbc4"

settings = Settings()
