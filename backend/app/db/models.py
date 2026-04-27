from sqlalchemy import Column, String, Float, Boolean, Integer, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from app.db.database import Base

class DriftLog(Base):
    __tablename__ = "drift_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime, default=datetime.utcnow)
    batch_size = Column(Integer)
    similarity_score = Column(Float)
    is_drifted = Column(Boolean)
    top_terms = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
