import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

interface SimilarityGaugeProps {
  score: number;
  threshold?: number;
}

export default function SimilarityGauge({ score, threshold = 0.75 }: SimilarityGaugeProps) {
  const isDrifted = score < threshold;
  
  const percentage = Math.round(score * 100);
  
  // Color calculation based on score
  const getColor = () => {
    if (score >= threshold + 0.1) return 'var(--color-brand-primary)';
    if (score >= threshold) return 'var(--color-brand-warning)';
    return 'var(--color-brand-alert)';
  };
  
  const activeColor = getColor();
  const bgColor = 'var(--color-border-subtle)';
  
  const data = [
    { name: 'Score', value: score },
    { name: 'Remaining', value: 1 - score },
  ];

  return (
    <div className="glass-card p-6 flex flex-col items-center justify-center relative">
      <h3 className="text-sm font-medium text-text-muted tracking-wide uppercase self-start w-full text-left mb-2">Similarity Score</h3>
      
      <div className="relative w-48 h-48 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              startAngle={180}
              endAngle={0}
              innerRadius={70}
              outerRadius={90}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
              cornerRadius={isDrifted ? 0 : 5}
            >
              <Cell fill={activeColor} style={{ filter: `drop-shadow(0px 0px 8px ${activeColor}80)` }} />
              <Cell fill={bgColor} />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center -mt-6">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={clsx(
              "text-4xl font-bold font-mono",
              isDrifted ? "text-red-400" : "text-brand-primary"
            )}
            style={{ textShadow: `0 0 15px ${activeColor}50` }}
          >
            {percentage}%
          </motion.div>
          <span className="text-xs text-text-muted mt-1">Threshold: {(threshold * 100).toFixed(0)}%</span>
        </div>
      </div>
      
      <div className="w-full flex justify-between text-xs text-text-muted font-mono mt-[-20px] px-8">
        <span>0</span>
        <span>0.5</span>
        <span>1.0</span>
      </div>
    </div>
  );
}
