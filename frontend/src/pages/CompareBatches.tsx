import { useState } from 'react';
import { UploadCloud, FileText, ArrowRightLeft, Loader2, Activity, Info, CheckCircle2, ListFilter } from 'lucide-react';
import { compareBatches, extractArticles, analyzeTexts, compareTexts } from '../services/api';
import SimilarityGauge from '../components/SimilarityGauge';
import ArticleSelector from '../components/ArticleSelector';
import { motion, AnimatePresence } from 'framer-motion';

export default function CompareBatches() {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [articlesA, setArticlesA] = useState<string[] | null>(null);
  const [articlesB, setArticlesB] = useState<string[] | null>(null);
  const [selectedA, setSelectedA] = useState<string[] | null>(null);
  const [selectedB, setSelectedB] = useState<string[] | null>(null);
  
  const [isExtractingA, setIsExtractingA] = useState(false);
  const [isExtractingB, setIsExtractingB] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExtractA = async () => {
    if (!fileA) return;
    try { setIsExtractingA(true); const texts = await extractArticles(fileA); setArticlesA(texts); }
    catch { setError('Failed to read Batch A'); }
    finally { setIsExtractingA(false); }
  };

  const handleExtractB = async () => {
    if (!fileB) return;
    try { setIsExtractingB(true); const texts = await extractArticles(fileB); setArticlesB(texts); }
    catch { setError('Failed to read Batch B'); }
    finally { setIsExtractingB(false); }
  };

  const handleCompare = async () => {
    const finalA = selectedA || (fileA ? await extractArticles(fileA) : null);
    const finalB = selectedB || (fileB ? await extractArticles(fileB) : null);
    
    if (!finalA || !finalB) return;

    try {
      setIsUploading(true);
      setError(null);
      const data = await compareTexts(finalA, finalB);
      setResult(data);
    } catch (err: any) {
      setError('Comparison failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFileA(null); setFileB(null);
    setArticlesA(null); setArticlesB(null);
    setSelectedA(null); setSelectedB(null);
    setResult(null); setError(null);
  };

  if (articlesA) {
    return <ArticleSelector 
      articles={articlesA} 
      onAnalyze={(selected) => { setSelectedA(selected); setArticlesA(null); }} 
      onCancel={() => setArticlesA(null)} 
    />;
  }

  if (articlesB) {
    return <ArticleSelector 
      articles={articlesB} 
      onAnalyze={(selected) => { setSelectedB(selected); setArticlesB(null); }} 
      onCancel={() => setArticlesB(null)} 
    />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-main tracking-tight">Batch-to-Batch Comparison</h1>
        <p className="text-text-muted mt-1">Directly compare two different news batches</p>
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
                <h3 className="text-white font-medium mb-4">Batch A</h3>
                <input type="file" id="file-a" className="hidden" accept=".csv,.json,.txt,.pdf" onChange={(e) => { setFileA(e.target.files?.[0] || null); setSelectedA(null); }} />
                <label htmlFor="file-a" className={`w-full py-8 border-2 border-dashed rounded-xl flex flex-col items-center cursor-pointer transition-all ${
                  fileA ? 'border-brand-primary bg-brand-primary/5' : 'border-border-strong hover:border-slate-500'
                }`}>
                  {fileA ? (
                    <div className="flex flex-col items-center px-4">
                      <FileText className="w-6 h-6 text-brand-primary mb-2" />
                      <p className="text-xs font-medium text-white text-center break-all">{fileA.name}</p>
                      {selectedA && <p className="text-[10px] text-brand-primary mt-1 font-bold">{selectedA.length} articles selected</p>}
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-6 h-6 text-text-muted mb-2" />
                      <p className="text-xs text-text-muted">Click to browse</p>
                    </>
                  )}
                </label>
                {fileA && !selectedA && (
                  <button onClick={handleExtractA} className="mt-4 text-xs flex items-center gap-1 text-brand-primary hover:underline">
                    {isExtractingA ? <Loader2 className="w-3 h-3 animate-spin" /> : <ListFilter className="w-3 h-3" />}
                    Pick Specific Articles
                  </button>
                )}
              </div>

              {/* Batch B Slot */}
              <div className="glass-card p-6 flex flex-col items-center">
                <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                  <span className="text-blue-400 font-bold">B</span>
                </div>
                <h3 className="text-white font-medium mb-4">Batch B</h3>
                <input type="file" id="file-b" className="hidden" accept=".csv,.json,.txt,.pdf" onChange={(e) => { setFileB(e.target.files?.[0] || null); setSelectedB(null); }} />
                <label htmlFor="file-b" className={`w-full py-8 border-2 border-dashed rounded-xl flex flex-col items-center cursor-pointer transition-all ${
                  fileB ? 'border-blue-400 bg-blue-400/5' : 'border-border-strong hover:border-slate-500'
                }`}>
                  {fileB ? (
                    <div className="flex flex-col items-center px-4">
                      <FileText className="w-6 h-6 text-blue-400 mb-2" />
                      <p className="text-xs font-medium text-white text-center break-all">{fileB.name}</p>
                      {selectedB && <p className="text-[10px] text-blue-400 mt-1 font-bold">{selectedB.length} articles selected</p>}
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-6 h-6 text-text-muted mb-2" />
                      <p className="text-xs text-text-muted">Click to browse</p>
                    </>
                  )}
                </label>
                {fileB && !selectedB && (
                  <button onClick={handleExtractB} className="mt-4 text-xs flex items-center gap-1 text-blue-400 hover:underline">
                    {isExtractingB ? <Loader2 className="w-3 h-3 animate-spin" /> : <ListFilter className="w-3 h-3" />}
                    Pick Specific Articles
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center gap-4">
              <button 
                onClick={handleCompare}
                disabled={!fileA || !fileB || isUploading}
                className="btn-primary w-full max-w-xs flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Comparing...</>
                ) : (
                  <><ArrowRightLeft className="w-4 h-4" /> Compare Selected</>
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
