from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./ergonomic.db"
    cors_origins: str = "http://localhost:5173"
    sample_interval_seconds: float = 1.0
    warning_threshold_seconds: float = 5.0
    alert_cooldown_seconds: float = 15.0
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]


settings = Settings()
