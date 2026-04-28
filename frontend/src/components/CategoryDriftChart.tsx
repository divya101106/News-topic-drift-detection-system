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

interface CategoryDrift {
  category: string;
  match_score: number;
}

interface CategoryDriftChartProps {
  data: CategoryDrift[];
}

const CategoryDriftChart: React.FC<CategoryDriftChartProps> = ({ data }) => {
  if (!data || data.length === 0) return null;

  const chartData = data.map(item => ({
    name: item.category,
    value: item.match_score * 100,
    color: item.category.includes('Politics') ? '#10b981' : '#3b82f6'
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1a1d21] border border-[#2d3139] p-3 rounded-lg shadow-xl">
          <p className="text-white font-medium mb-1">{payload[0].payload.name}</p>
          <p className="text-brand-primary text-sm">
            Alignment: {payload[0].value.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card p-6 h-[350px]">
      <h3 className="text-white text-lg font-medium mb-6 flex items-center gap-2">
        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
        Category Alignment
      </h3>
      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 0, right: 20, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3139" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#64748b" 
              fontSize={10} 
              tick={{ fill: '#9ba1b0' }}
              interval={0}
              angle={-15}
              textAnchor="end"
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={10} 
              tickFormatter={(val) => `${val}%`}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.value > 75 ? '#10b981' : entry.value > 40 ? '#3b82f6' : '#64748b'} 
                  fillOpacity={0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[#64748b] text-[10px] mt-4 text-center italic">
        High alignment (Green) indicates the batch belongs to that domain.
      </p>
    </div>
  );
};

export default CategoryDriftChart;
