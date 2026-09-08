from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class SessionCreate(BaseModel):
    user_id: int = 1


class SessionSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    start_time: datetime
    end_time: Optional[datetime]
    duration: float
    average_rula: float
    maximum_rula: int
    overall_risk: str
    warning_count: int = 0
