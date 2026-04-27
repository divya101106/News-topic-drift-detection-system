import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface PCAScatterChartProps {
  pcaPoints: number[][]; // [x, y] coordinates
  isDrifted: boolean;
}

export default function PCAScatterChart({ pcaPoints, isDrifted }: PCAScatterChartProps) {
  // Mock baseline points for visual comparison
  const generateBaseline = () => {
    return Array.from({ length: 50 }, () => ({
      x: (Math.random() - 0.5) * 4,
      y: (Math.random() - 0.5) * 4,
    }));
  };

  const baselineData = generateBaseline();
  
  const batchData = pcaPoints.map((point) => ({
    x: point[0],
    y: point[1],
  }));

  const activeColor = isDrifted ? 'var(--color-brand-alert)' : 'var(--color-brand-primary)';

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bg-surface border border-border-subtle p-3 rounded-lg shadow-xl backdrop-blur-md">
          <p className="text-text-main text-sm font-medium">{payload[0].name === 'Baseline' ? 'Baseline Point' : 'Batch Point'}</p>
          <p className="text-brand-primary font-mono text-xs mt-1">
            PC1: {payload[0].value.toFixed(2)}
          </p>
          <p className="text-brand-primary font-mono text-xs">
            PC2: {payload[1].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={clsx(
        "glass-card p-6 h-[400px] flex flex-col relative overflow-hidden",
        isDrifted && "border-brand-alert/30"
      )}
    >
      {isDrifted && (
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-alert/5 rounded-full blur-3xl pointer-events-none"></div>
      )}
      
      <div className="flex justify-between items-center mb-4 relative z-10">
        <div>
          <h3 className="text-lg font-bold text-text-main tracking-wide">PCA Topic Distribution</h3>
          <p className="text-xs text-text-muted mt-1">2D projection of article embeddings</p>
        </div>
        
        {isDrifted && (
          <div className="px-3 py-1 bg-brand-alert/10 border border-brand-alert/30 rounded-full text-xs font-bold text-brand-alert uppercase tracking-wider shadow-[0_0_15px_rgba(239,68,68,0.2)]">
            Separation Detected
          </div>
        )}
      </div>

      <div className="flex-1 w-full min-h-0 relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-strong)" opacity={0.5} />
            <XAxis 
              type="number" 
              dataKey="x" 
              name="PC1" 
              stroke="var(--color-text-muted)" 
              tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} 
              axisLine={{ stroke: 'var(--color-border-strong)' }}
              tickLine={{ stroke: 'var(--color-border-strong)' }}
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name="PC2" 
              stroke="var(--color-text-muted)" 
              tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
              axisLine={{ stroke: 'var(--color-border-strong)' }}
              tickLine={{ stroke: 'var(--color-border-strong)' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--color-text-muted)' }} />
            
            <Scatter 
              name="Baseline" 
              data={baselineData} 
              fill="var(--color-text-muted)" 
              opacity={0.4} 
            />
            <Scatter 
              name="Current Batch" 
              data={batchData} 
              fill={activeColor}
              opacity={0.8}
              shape="circle"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
