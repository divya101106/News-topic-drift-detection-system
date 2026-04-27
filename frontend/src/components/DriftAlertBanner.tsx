import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface DriftAlertBannerProps {
  isDrifted: boolean;
  score: number;
  onReview?: () => void;
}

export default function DriftAlertBanner({ isDrifted, score, onReview }: DriftAlertBannerProps) {
  if (isDrifted) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-center justify-between shadow-[0_0_15px_rgba(239,68,68,0.2)] shadow-[0_0_20px_rgba(239,68,68,0.2)]"
      >
        <div className="flex items-center gap-4">
          <div className="bg-red-500/20 p-2 rounded-full animate-pulse">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-red-400 font-bold text-lg text-shadow-[0_0_15px_rgba(239,68,68,0.2)]">Topic Drift Detected</h3>
            <p className="text-red-300/80 text-sm mt-1">Similarity score ({score.toFixed(2)}) fell below the baseline threshold. Action may be required.</p>
          </div>
        </div>
        {onReview && (
          <button onClick={onReview} className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 px-4 py-2 rounded-lg font-medium transition-all text-sm active:scale-95">
            Review Batch
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-brand-primary/10 border border-brand-primary/30 rounded-xl p-4 flex items-center justify-between"
    >
      <div className="flex items-center gap-4">
        <div className="bg-brand-primary/20 p-2 rounded-full">
          <CheckCircle2 className="w-6 h-6 text-brand-primary" />
        </div>
        <div>
          <h3 className="text-brand-primary font-bold text-lg">Batch Stable</h3>
          <p className="text-brand-secondary/80 text-sm mt-1">Current batch remains aligned with baseline topics. No drift detected.</p>
        </div>
      </div>
    </motion.div>
  );
}
