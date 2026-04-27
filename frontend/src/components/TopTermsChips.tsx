import { Hash } from 'lucide-react';
import { motion } from 'framer-motion';

interface TopTermsChipsProps {
  terms: string[];
}

export default function TopTermsChips({ terms }: TopTermsChipsProps) {
  if (!terms || terms.length === 0) return null;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Hash className="w-5 h-5 text-brand-primary" />
        <h3 className="text-lg font-bold text-text-main tracking-wide">Dominant Batch Topics</h3>
      </div>
      
      <p className="text-xs text-text-muted mb-4">Top TF-IDF terms extracted from the current news batch</p>
      
      <div className="flex flex-wrap gap-2">
        {terms.map((term, index) => (
          <motion.div
            key={`${term}-${index}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="px-3 py-1.5 bg-bg-surface-hover/80 border border-border-subtle rounded-lg text-sm text-brand-secondary font-mono hover:bg-brand-primary/10 hover:border-brand-primary/30 transition-colors cursor-default"
          >
            {term}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
