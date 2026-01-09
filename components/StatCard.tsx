import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: 'amber' | 'blue' | 'red' | 'green';
}

// Tarjeta reutilizable para mostrar indicadores resumidos con icono y tendencia opcional.
const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, trendUp, color = 'blue' }) => {
    
  const colorClasses = {
      amber: 'bg-amber-50 text-amber-600',
      blue: 'bg-blue-50 text-blue-600',
      red: 'bg-red-50 text-red-600',
      green: 'bg-emerald-50 text-emerald-600'
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-3xl font-bold text-slate-800 mt-2">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-2 text-xs font-medium">
          <span className={trendUp ? 'text-emerald-600' : 'text-red-600'}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
          <span className="text-slate-400">vs mes pasado</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
