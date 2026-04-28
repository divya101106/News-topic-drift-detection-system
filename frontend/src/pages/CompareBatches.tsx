import { useState } from 'react';
import { UploadCloud, FileText, ArrowRightLeft, Loader2, Activity, Info, CheckCircle2 } from 'lucide-react';
import { compareBatches } from '../services/api';
import SimilarityGauge from '../components/SimilarityGauge';
import { motion, AnimatePresence } from 'framer-motion';

export default function CompareBatches() {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!fileA || !fileB) return;
    
    try {
      setIsUploading(true);
      setError(null);
      const data = await compareBatches(fileA, fileB);
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to compare batches. Ensure both files are valid.');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFileA(null);
    setFileB(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-main tracking-tight">Batch-to-Batch Comparison</h1>
        <p className="text-text-muted mt-1">Directly compare two different news batches without using the baseline</p>
      </div>

      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div 
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Batch A Slot */}
              <div className="glass-card p-6 flex flex-col items-center">
                <div className="w-12 h-12 bg-brand-primary/10 rounded-full flex items-center justify-center mb-4">
                  <span className="text-brand-primary font-bold">A</span>
                </div>
                <h3 className="text-white font-medium mb-4">Select First Batch</h3>
                <input 
                  type="file" 
                  id="file-a" 
                  className="hidden" 
                  onChange={(e) => setFileA(e.target.files?.[0] || null)}
                />
                <label 
                  htmlFor="file-a" 
                  className={`w-full py-10 border-2 border-dashed rounded-xl flex flex-col items-center cursor-pointer transition-all ${
                    fileA ? 'border-brand-primary bg-brand-primary/5' : 'border-border-strong hover:border-slate-500'
                  }`}
                >
                  {fileA ? (
                    <div className="flex flex-col items-center">
                      <FileText className="w-8 h-8 text-brand-primary mb-2" />
                      <p className="text-sm font-medium text-white">{fileA.name}</p>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-8 h-8 text-text-muted mb-2" />
                      <p className="text-sm text-text-muted">Click to browse</p>
                    </>
                  )}
                </label>
              </div>

              {/* Batch B Slot */}
              <div className="glass-card p-6 flex flex-col items-center">
                <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                  <span className="text-blue-400 font-bold">B</span>
                </div>
                <h3 className="text-white font-medium mb-4">Select Second Batch</h3>
                <input 
                  type="file" 
                  id="file-b" 
                  className="hidden" 
                  onChange={(e) => setFileB(e.target.files?.[0] || null)}
                />
                <label 
                  htmlFor="file-b" 
                  className={`w-full py-10 border-2 border-dashed rounded-xl flex flex-col items-center cursor-pointer transition-all ${
                    fileB ? 'border-blue-400 bg-blue-400/5' : 'border-border-strong hover:border-slate-500'
                  }`}
                >
                  {fileB ? (
                    <div className="flex flex-col items-center">
                      <FileText className="w-8 h-8 text-blue-400 mb-2" />
                      <p className="text-sm font-medium text-white">{fileB.name}</p>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-8 h-8 text-text-muted mb-2" />
                      <p className="text-sm text-text-muted">Click to browse</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4">
              <button 
                onClick={handleUpload}
                disabled={!fileA || !fileB || isUploading}
                className="btn-primary w-full max-w-xs flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Comparing...</>
                ) : (
                  <><ArrowRightLeft className="w-4 h-4" /> Compare Batches</>
                )}
              </button>
              {error && <p className="text-red-400 text-sm">{error}</p>}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="results"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-text-main">Cross-Batch Similarity</h2>
              <button onClick={resetForm} className="btn-secondary text-sm">New Comparison</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="glass-card p-6 flex flex-col items-center justify-center space-y-6">
                <SimilarityGauge score={result.similarity_score} />
                <div className="text-center">
                  <p className="text-text-muted text-sm uppercase tracking-wider mb-1">Status</p>
                  <p className={`text-lg font-bold ${result.similarity_score > 0.7 ? 'text-brand-primary' : 'text-orange-400'}`}>
                    {result.similarity_score > 0.7 ? 'High Correlation' : 'Low Correlation'}
                  </p>
                </div>
              </div>

              <div className="lg:col-span-2 glass-card p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary font-bold">A</div>
                    <p className="text-xs text-text-muted">{result.batch_a_size} articles</p>
                  </div>
                  <div className="flex-1 px-8 flex flex-col items-center gap-2">
                    <div className="w-full h-1 bg-gradient-to-r from-brand-primary via-slate-700 to-blue-400 rounded-full relative">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0b0c0e] px-3 py-1 border border-border-strong rounded-full text-[10px] text-white">
                        {Math.round(result.similarity_score * 100)}% Match
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400 font-bold">B</div>
                    <p className="text-xs text-text-muted">{result.batch_b_size} articles</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-text-muted uppercase tracking-widest">Batch A Distinctive</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.batch_a_top_terms.slice(0, 8).map((term: string) => (
                        <span key={term} className="px-2 py-1 bg-brand-primary/5 border border-brand-primary/20 rounded text-xs text-brand-primary">
                          {term}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-text-muted uppercase tracking-widest">Batch B Distinctive</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.batch_b_top_terms.slice(0, 8).map((term: string) => (
                        <span key={term} className="px-2 py-1 bg-blue-500/5 border border-blue-500/20 rounded text-xs text-blue-400">
                          {term}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {result.common_terms.length > 0 && (
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <h4 className="text-xs font-medium text-text-muted uppercase mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-brand-primary" />
                      Shared Vocabulary
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {result.common_terms.map((term: string) => (
                        <span key={term} className="text-xs text-text-main bg-slate-800 px-2 py-1 rounded">
                          {term}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
