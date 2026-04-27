import { useState, useCallback } from 'react';
import { UploadCloud, FileJson, FileText, CheckCircle, AlertTriangle, Loader2, Activity } from 'lucide-react';
import { uploadBatch } from '../services/api';
import PCAScatterChart from '../components/PCAScatterChart';
import SimilarityGauge from '../components/SimilarityGauge';
import TopTermsChips from '../components/TopTermsChips';
import { motion, AnimatePresence } from 'framer-motion';

export default function ScanBatch() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.json')) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError('Only CSV or JSON files are supported');
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    try {
      setIsUploading(true);
      setError(null);
      
      const data = await uploadBatch(file);
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to process batch. Ensure backend is running.');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-main tracking-tight">Scan New Batch</h1>
        <p className="text-text-muted mt-1">Upload a CSV or JSON file containing news articles to detect topic drift</p>
      </div>

      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div 
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card p-8"
          >
            <div 
              className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center transition-all duration-300 ${
                isDragging 
                  ? 'border-brand-primary bg-brand-primary/10 scale-[1.02]' 
                  : 'border-border-strong hover:border-slate-500 hover:bg-bg-surface-hover/30'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <UploadCloud className={`w-16 h-16 mb-4 ${isDragging ? 'text-brand-primary' : 'text-text-muted'}`} />
              <h3 className="text-lg font-medium text-text-main mb-2">
                Drag and drop your file here
              </h3>
              <p className="text-sm text-text-muted mb-6">
                Supports .csv or .json files containing text data
              </p>
              
              <div className="flex gap-4">
                <input 
                  type="file" 
                  id="file-upload" 
                  className="hidden" 
                  accept=".csv,.json"
                  onChange={handleFileChange}
                />
                <label 
                  htmlFor="file-upload" 
                  className="btn-secondary cursor-pointer"
                >
                  Browse Files
                </label>
              </div>
            </div>

            {file && (
              <div className="mt-6 p-4 bg-bg-surface-hover/50 rounded-lg flex items-center justify-between border border-border-subtle">
                <div className="flex items-center gap-3">
                  {file.name.endsWith('.json') ? (
                    <FileJson className="w-8 h-8 text-brand-primary" />
                  ) : (
                    <FileText className="w-8 h-8 text-blue-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-text-main">{file.name}</p>
                    <p className="text-xs text-text-muted">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
                
                <button 
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="btn-primary flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Activity className="w-4 h-4" />
                      Run Analysis
                    </>
                  )}
                </button>
              </div>
            )}
            
            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-text-main">Analysis Results</h2>
              <button onClick={resetForm} className="btn-secondary text-sm">
                Scan Another Batch
              </button>
            </div>
            
            <div className={`p-4 rounded-xl border flex items-start gap-4 ${
              result.drift_detected 
                ? 'bg-red-500/10 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                : 'bg-brand-primary/10 border-brand-primary/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
            }`}>
              {result.drift_detected ? (
                <AlertTriangle className="w-8 h-8 text-red-400 flex-shrink-0" />
              ) : (
                <CheckCircle className="w-8 h-8 text-brand-primary flex-shrink-0" />
              )}
              <div>
                <h3 className={`text-lg font-bold ${result.drift_detected ? 'text-red-400' : 'text-brand-primary'}`}>
                  {result.drift_detected ? 'Topic Drift Detected!' : 'Batch is Stable'}
                </h3>
                <p className="text-sm text-text-main mt-1">
                  Processed {result.batch_size} articles. 
                  {result.drift_detected 
                    ? ` The similarity score of ${result.similarity_score.toFixed(3)} is below the acceptable threshold.` 
                    : ` The similarity score of ${result.similarity_score.toFixed(3)} indicates alignment with the baseline.`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-6">
                <SimilarityGauge score={result.similarity_score} />
                <TopTermsChips terms={result.top_terms} />
              </div>
              <div className="lg:col-span-2">
                <PCAScatterChart 
                  pcaPoints={result.pca_points || []} 
                  isDrifted={result.drift_detected} 
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
