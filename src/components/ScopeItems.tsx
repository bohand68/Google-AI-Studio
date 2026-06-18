import React, { useMemo } from 'react';
import { useAppContext } from '../store';
import { Card, CardContent, CardHeader, Input } from './ui';
import { Layers } from 'lucide-react';
import { Complexity } from '../types';
import { CATEGORIES, PHASES } from '../constants';
import { PhaseChart } from './PhaseChart';

export function ScopeItems() {
  const { state, updateState } = useAppContext();
  const { scopeItems: s } = state;

  const sums = useMemo(() => {
    let total = 0, low = 0, medium = 0, high = 0, veryHigh = 0;
    Object.values(s.items).forEach(item => {
      total += item.total || 0;
      low += item.low || 0;
      medium += item.medium || 0;
      high += item.high || 0;
      veryHigh += item.veryHigh || 0;
    });
    return { total, low, medium, high, veryHigh };
  }, [s.items]);

  const { chartDataAndTotal, phaseTotals } = useMemo(() => {
    const pTotals: Record<string, number> = {};
    PHASES.forEach(p => pTotals[p] = 0);
    let totalDays = 0;

    PHASES.forEach(phase => {
      const matrix = s.complexityMatrix[phase as any];
      if (matrix) {
        const days = (sums.low * matrix.Low) + 
                     (sums.medium * matrix.Medium) + 
                     (sums.high * matrix.High) + 
                     (sums.veryHigh * matrix['Very High']);
        pTotals[phase] = days;
        totalDays += days;
      }
    });

    const data = PHASES.map(phase => ({
      name: phase,
      Tage: parseFloat(pTotals[phase].toFixed(1))
    })).filter(x => x.Tage > 0);

    return { chartDataAndTotal: { data, totalDays }, phaseTotals: pTotals };
  }, [s.complexityMatrix, sums]);

  const handleItemUpdate = (category: string, field: string, value: number) => {
    updateState('scopeItems', (prev: typeof s) => ({
      ...prev,
      items: {
        ...prev.items,
        [category]: {
          ...prev.items[category],
          [field]: value
        }
      }
    }));
  };

  const handleMatrixUpdate = (phase: string, complexity: string, value: number) => {
    updateState('scopeItems', (prev: typeof s) => ({
      ...prev,
      complexityMatrix: {
        ...prev.complexityMatrix,
        [phase]: {
          ...prev.complexityMatrix[phase as any],
          [complexity]: value
        }
      }
    }));
  };

  // Helper to check if sum matches total
  const isRowValid = (category: string) => {
    const item = s.items[category];
    if (item.total === 0 && item.low === 0 && item.medium === 0 && item.high === 0 && item.veryHigh === 0) return true;
    return item.total === (item.low + item.medium + item.high + item.veryHigh);
  };

  return (
    <Card>
      <CardHeader title="2. SAP Best Practice Prozesse" icon={Layers} description="Anzahl der einzuführenden Prozesse nach Kategorie und Komplexität definieren." />
      <CardContent className="space-y-8">
        
        {/* Category Inputs */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Kategorie</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Anzahl Scope-Items</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Low</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Medium</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">High</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Very High</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Object.keys(s.items).map(category => {
                const item = s.items[category];
                const valid = isRowValid(category);
                
                return (
                  <tr key={category} className={!valid ? 'bg-red-50/50' : ''}>
                    <td className="px-3 py-2 text-sm text-gray-900 font-medium">{category}</td>
                    <td className="px-3 py-2">
                      <Input type="number" className={`w-20 ${!valid ? 'ring-red-300' : ''}`} value={item.total || ''} onChange={e => handleItemUpdate(category, 'total', parseInt(e.target.value) || 0)} />
                    </td>
                    <td className="px-3 py-2">
                      <Input type="number" className="w-16" value={item.low || ''} onChange={e => handleItemUpdate(category, 'low', parseInt(e.target.value) || 0)} />
                    </td>
                    <td className="px-3 py-2">
                      <Input type="number" className="w-16" value={item.medium || ''} onChange={e => handleItemUpdate(category, 'medium', parseInt(e.target.value) || 0)} />
                    </td>
                    <td className="px-3 py-2">
                      <Input type="number" className="w-16" value={item.high || ''} onChange={e => handleItemUpdate(category, 'high', parseInt(e.target.value) || 0)} />
                    </td>
                    <td className="px-3 py-2">
                      <Input type="number" className="w-16" value={item.veryHigh || ''} onChange={e => handleItemUpdate(category, 'veryHigh', parseInt(e.target.value) || 0)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
              <tr>
                <td className="px-3 py-2 text-sm text-gray-900 font-bold text-right">Summe über alle Kategorien</td>
                <td className="px-3 py-2 text-sm font-bold text-indigo-700">{sums.total}</td>
                <td className="px-3 py-2 text-sm font-bold text-gray-900">{sums.low}</td>
                <td className="px-3 py-2 text-sm font-bold text-gray-900">{sums.medium}</td>
                <td className="px-3 py-2 text-sm font-bold text-gray-900">{sums.high}</td>
                <td className="px-3 py-2 text-sm font-bold text-gray-900">{sums.veryHigh}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Matrix Settings */}
        <div>
           <h4 className="text-sm font-medium text-gray-900 mb-4 border-b pb-2">Komplexitätsgrade Aufwand in Tagen pro Phase</h4>
           <div className="overflow-x-auto">
             <table className="min-w-full divide-y divide-gray-200">
               <thead>
                 <tr>
                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phase</th>
                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Low</th>
                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Medium</th>
                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">High</th>
                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Very High</th>
                   <th className="px-3 py-2 text-left text-xs font-bold text-indigo-600 uppercase">Berechnete Tage</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-200">
                 {Object.keys(s.complexityMatrix).map(phase => {
                    const row = s.complexityMatrix[phase as any];
                    return (
                      <tr key={phase}>
                        <td className="px-3 py-2 text-sm text-gray-900 font-medium">{phase}</td>
                        {['Low', 'Medium', 'High', 'Very High'].map(comp => (
                          <td key={comp} className="px-3 py-2">
                            <Input 
                               type="number" 
                               step="0.01"
                               className="w-20" 
                               value={row[comp] || 0} 
                               onChange={e => handleMatrixUpdate(phase, comp, parseFloat(e.target.value) || 0)} 
                             />
                          </td>
                        ))}
                        <td className="px-3 py-2 text-sm font-semibold text-indigo-700 bg-indigo-50/30">
                          {phaseTotals[phase] ? phaseTotals[phase].toFixed(1) + ' Tage' : '0.0 Tage'}
                        </td>
                      </tr>
                    )
                 })}
               </tbody>
               <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                 <tr>
                   <td colSpan={5} className="px-3 py-2 text-sm text-gray-900 font-bold text-right">Scope-Items Gesamtaufwand</td>
                   <td className="px-3 py-2 text-sm font-bold text-indigo-700">{chartDataAndTotal.totalDays.toFixed(1)} Tage</td>
                 </tr>
               </tfoot>
             </table>
           </div>
        </div>

        <PhaseChart data={chartDataAndTotal.data} totalDays={chartDataAndTotal.totalDays} />

      </CardContent>
    </Card>
  );
}
