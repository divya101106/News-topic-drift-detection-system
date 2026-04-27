from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import DriftLog
from app.db.schemas import UploadResponse, DashboardStats, DriftLogResponse
from app.services.preprocessing import clean_text
from app.services.vectorization import vectorization_service
from app.services.drift import detect_drift
from app.core.config import settings
import pandas as pd
import json
from typing import List

router = APIRouter()

@router.post("/upload-batch", response_model=UploadResponse)
async def upload_batch(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(('.csv', '.json')):
        raise HTTPException(status_code=400, detail="Only CSV and JSON files are supported.")
    
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file.file)
            # Find the text column (assuming 'text', 'content', or take first string column)
            text_col = next((col for col in df.columns if col.lower() in ['text', 'content', 'article']), None)
            if not text_col:
                text_col = df.select_dtypes(include=['object']).columns[0]
            texts = df[text_col].dropna().astype(str).tolist()
        else: # JSON
            content = await file.read()
            data = json.loads(content)
            # Assuming list of strings or list of dicts with text
            if isinstance(data, list) and len(data) > 0:
                if isinstance(data[0], dict):
                    texts = [item.get('text', item.get('content', '')) for item in data]
                elif isinstance(data[0], str):
                    texts = data
                else:
                    raise ValueError("Invalid JSON format")
            else:
                raise ValueError("JSON must be a list of documents")
                
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing file: {str(e)}")

    if not texts:
        raise HTTPException(status_code=400, detail="No text data found in file")

    # Pipeline
    cleaned_texts = [clean_text(text) for text in texts]
    
    try:
        tfidf_matrix, pca_vectors, top_terms = vectorization_service.transform(cleaned_texts)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during vectorization: {str(e)}")
        
    is_drifted, similarity, batch_centroid = detect_drift(tfidf_matrix, pca_vectors, settings.SIMILARITY_THRESHOLD)
    
    # Take a sample of PCA points for frontend visualization (to avoid huge payloads)
    sample_size = min(200, len(pca_vectors))
    sample_indices = pd.Series(range(len(pca_vectors))).sample(sample_size).values
    pca_points = pca_vectors[sample_indices, :2].tolist() # only send first 2 components for 2D plot
    
    # Create DB log
    db_log = DriftLog(
        batch_size=len(texts),
        similarity_score=similarity,
        is_drifted=is_drifted,
        top_terms=top_terms
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    
    return UploadResponse(
        similarity_score=similarity,
        drift_detected=is_drifted,
        batch_size=len(texts),
        top_terms=top_terms,
        timestamp=db_log.timestamp,
        pca_points=pca_points
    )

@router.get("/history", response_model=List[DriftLogResponse])
def get_history(db: Session = Depends(get_db), limit: int = 100):
    logs = db.query(DriftLog).order_by(DriftLog.timestamp.desc()).limit(limit).all()
    return logs

@router.get("/dashboard-stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    latest_log = db.query(DriftLog).order_by(DriftLog.timestamp.desc()).first()
    
    from sqlalchemy import func
    total_articles = db.query(func.sum(DriftLog.batch_size)).scalar() or 0
    total_batches = db.query(func.count(DriftLog.id)).scalar() or 0
    drift_count = db.query(func.count(DriftLog.id)).filter(DriftLog.is_drifted == True).scalar() or 0
    
    return DashboardStats(
        latest_similarity=latest_log.similarity_score if latest_log else 1.0,
        total_articles_processed=total_articles,
        total_batches=total_batches,
        drift_count=drift_count,
        last_updated=latest_log.timestamp if latest_log else None
    )

@router.get("/health")
def health_check():
    return {"status": "ok", "models_loaded": vectorization_service.pca is not None}
