import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: { value: number; isPositive: boolean };
  glowColor?: 'cyan' | 'red' | 'none';
  delay?: number;
}

export default function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  glowColor = 'none',
  delay = 0
}: MetricCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={clsx(
        "glass-card p-5 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300",
        glowColor === 'cyan' && "hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] border-brand-primary/30",
        glowColor === 'red' && "hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] border-red-500/30"
      )}
    >
      {/* Background glow effect based on color */}
      {glowColor === 'cyan' && (
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-brand-primary/10 rounded-full blur-2xl group-hover:bg-brand-primary/20 transition-all duration-500"></div>
      )}
      {glowColor === 'red' && (
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all duration-500"></div>
      )}

      <div className="flex justify-between items-start mb-2 relative z-10">
        <h3 className="text-sm font-medium text-text-muted tracking-wide uppercase">{title}</h3>
        {icon && <div className={clsx(
          "p-2 rounded-lg",
          glowColor === 'cyan' ? "bg-brand-primary/10 text-brand-primary" : 
          glowColor === 'red' ? "bg-red-500/10 text-red-400" : "bg-bg-surface-hover text-text-muted"
        )}>{icon}</div>}
      </div>
      
      <div className="mt-4 relative z-10">
        <div className="flex items-end gap-3">
          <span className={clsx(
            "text-3xl font-bold font-mono tracking-tight",
            glowColor === 'cyan' ? "text-text-main" :
            glowColor === 'red' ? "text-red-400" : "text-text-main"
          )}>
            {value}
          </span>
          
          {trend && (
            <span className={clsx(
              "text-xs font-medium mb-1 px-1.5 py-0.5 rounded-md",
              trend.isPositive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
            )}>
              {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
            </span>
          )}
        </div>
        
        {subtitle && (
          <p className="text-xs text-text-muted mt-2 font-medium">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
}
