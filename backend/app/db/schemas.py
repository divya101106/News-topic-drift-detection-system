from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Any
from datetime import datetime

class DriftLogBase(BaseModel):
    batch_size: int
    similarity_score: float
    is_drifted: bool
    top_terms: List[str]

class DriftLogCreate(DriftLogBase):
    pass

class DriftLogResponse(DriftLogBase):
    id: str
    timestamp: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UploadResponse(BaseModel):
    similarity_score: float
    drift_detected: bool
    batch_size: int
    top_terms: List[str]
    timestamp: datetime
    pca_points: List[List[float]]

class DashboardStats(BaseModel):
    latest_similarity: float
    total_articles_processed: int
    total_batches: int
    drift_count: int
    last_updated: Optional[datetime]
