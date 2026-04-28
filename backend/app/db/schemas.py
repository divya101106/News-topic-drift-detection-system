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
    id: int
    timestamp: datetime
    pca_points: Optional[List[List[float]]] = None
    topic_drift: Optional[List[TopicDriftDetail]] = None
    category_drift: Optional[List[CategoryDrift]] = None

    model_config = ConfigDict(from_attributes=True)

class CategoryDrift(BaseModel):
    category: str
    match_score: float

class TopicDriftDetail(BaseModel):
    term: str
    baseline_score: float
    batch_score: float
    diff: float

class UploadResponse(BaseModel):
    similarity_score: float
    drift_detected: bool
    batch_size: int
    top_terms: List[str]
    timestamp: datetime
    pca_points: List[List[float]]
    topic_drift: Optional[List[TopicDriftDetail]] = None
    category_drift: Optional[List[CategoryDrift]] = None

class CompareResponse(BaseModel):
    similarity_score: float
    batch_a_size: int
    batch_b_size: int
    batch_a_top_terms: List[str]
    batch_b_top_terms: List[str]
    common_terms: List[str]

class DashboardStats(BaseModel):
    latest_similarity: float
    total_articles_processed: int
    total_batches: int
    drift_count: int
    last_updated: Optional[datetime]
