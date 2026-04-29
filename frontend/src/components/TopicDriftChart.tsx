import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface TopicDriftDetail {
  term: string;
  baseline_score: number;
  batch_score: number;
  diff: number;
}

interface TopicDriftChartProps {
  data: TopicDriftDetail[];
}

const TopicDriftChart: React.FC<TopicDriftChartProps> = ({ data }) => {
  if (!data || data.length === 0) return null;

  // Prepare data for Recharts - only show top 10 by absolute difference
  const chartData = data
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
    .slice(0, 10)
    .map(item => ({
      name: item.term,
      value: item.diff * 100, // Show as percentage points change
      baseline: item.baseline_score * 100,
      batch: item.batch_score * 100
    }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#1a1d21] border border-[#2d3139] p-3 rounded-lg shadow-xl">
          <p className="text-white font-medium mb-1">{data.name}</p>
          <p className="text-[#9ba1b0] text-sm">
            Change: <span className={data.value >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}>
              {data.value >= 0 ? '+' : ''}{data.value.toFixed(2)}%
            </span>
          </p>
          <p className="text-[#64748b] text-xs mt-1">
            Baseline: {data.baseline.toFixed(2)}%
          </p>
          <p className="text-[#64748b] text-xs">
            Batch: {data.batch.toFixed(2)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[400px] w-full mt-6">
      <h3 className="text-white text-lg font-medium mb-4 flex items-center gap-2">
        <span className="w-2 h-2 bg-[#10b981] rounded-full"></span>
        Topic Drift Breakdown
      </h3>
      <div className="bg-[#131517] border border-[#1e2124] rounded-xl p-6 h-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3139" horizontal={false} />
            <XAxis 
              type="number" 
              stroke="#64748b" 
              fontSize={12}
              tickFormatter={(val) => `${val}%`}
            />
            <YAxis 
              dataKey="name" 
              type="category" 
              stroke="#9ba1b0" 
              fontSize={12}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05' }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.value >= 0 ? '#10b981' : '#ef4444'} 
                  fillOpacity={0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[#64748b] text-xs mt-3 italic">
        * Positive values indicate terms becoming MORE prevalent in the current batch.
      </p>
    </div>
  );
};

export default TopicDriftChart;
