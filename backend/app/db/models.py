from sqlalchemy import Column, String, Float, Boolean, Integer, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from app.db.database import Base

class DriftLog(Base):
    __tablename__ = "drift_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    batch_size = Column(Integer)
    similarity_score = Column(Float)
    is_drifted = Column(Boolean)
    top_terms = Column(JSON)
    pca_points = Column(JSON, nullable=True)
    topic_drift = Column(JSON, nullable=True)
    category_drift = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
