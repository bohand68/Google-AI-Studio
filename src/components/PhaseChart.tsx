import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, LabelList } from 'recharts';
import { PHASE_COLORS } from '../constants';

interface PhaseChartProps {
  data: { name: string; Tage: number }[];
  totalDays: number;
}

export function PhaseChart({ data, totalDays }: PhaseChartProps) {
  if (totalDays <= 0) return null;

  return (
    <div className="mt-8 border-t border-gray-100 pt-6">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm font-bold text-gray-900">Aufwandsverteilung nach Phasen (Gesamt: {totalDays.toFixed(1)} Tage)</h4>
      </div>
      <div className="h-64 w-full bg-slate-50/50 rounded-lg p-4 ring-1 ring-black/5">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 10, right: 40, left: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
            <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={{ stroke: '#e5e7eb' }} />
            <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12, fill: '#374151', fontWeight: 500 }} axisLine={false} tickLine={false} />
            <Tooltip 
              formatter={(value: number) => [`${value} Tage`, 'Aufwand']}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '13px' }}
              cursor={{ fill: '#f3f4f6' }}
            />
            <Bar dataKey="Tage" radius={[0, 4, 4, 0]} barSize={24} isAnimationActive={true}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={PHASE_COLORS[entry.name as keyof typeof PHASE_COLORS] || '#6366f1'} />
              ))}
              <LabelList dataKey="Tage" position="right" formatter={(v: number) => `${v} T`} style={{ fill: '#4b5563', fontSize: 11, fontWeight: 500 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
