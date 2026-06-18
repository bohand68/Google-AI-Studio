import React, { useMemo } from 'react';
import { useAppContext } from '../store';
import { Card, CardContent, CardHeader, Input, Label } from './ui';
import { CalendarDays, Plus, Trash2 } from 'lucide-react';
import { PHASES, Phase } from '../types';

export function ProjectDuration() {
  const { state, updateState } = useAppContext();
  const { projectDuration: d } = state;

  const grossWeeks = useMemo(() => {
    if (!d.startDate || !d.endDate) return 0;
    const start = new Date(d.startDate);
    const end = new Date(d.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return (diffDays / 7).toFixed(1);
  }, [d.startDate, d.endDate]);

  const mainPhasesSum = useMemo(() => {
    return (Object.keys(d.phaseDistributions) as Phase[])
      .filter(p => p !== 'Run+Hypercare')
      .reduce((sum, p) => sum + (d.phaseDistributions[p] || 0), 0);
  }, [d.phaseDistributions]);
  const isMainPhasesValid = mainPhasesSum === 100;

  const phaseDetailSums = useMemo(() => {
    const sums: Record<string, number> = {};
    d.phaseDetails.forEach(pd => {
      sums[pd.phase] = (sums[pd.phase] || 0) + (pd.percentage || 0);
    });
    return sums;
  }, [d.phaseDetails]);

  const handleUpdate = (updates: Partial<typeof d>) => {
    updateState('projectDuration', { ...d, ...updates });
  };

  const addPhaseDetail = () => {
    const newDetail = { id: Math.random().toString(), phase: 'Prepare' as Phase, content: 'New Activity', percentage: 0 };
    handleUpdate({ phaseDetails: [...d.phaseDetails, newDetail] });
  };

  const updatePhaseDetail = (id: string, field: string, value: any) => {
    handleUpdate({
      phaseDetails: d.phaseDetails.map(pd => pd.id === id ? { ...pd, [field]: value } : pd)
    });
  };

  const removePhaseDetail = (id: string) => {
    handleUpdate({
      phaseDetails: d.phaseDetails.filter(pd => pd.id !== id)
    });
  };

  return (
    <Card>
      <CardHeader title="1. Projektlaufzeit & Phasen" icon={CalendarDays} description="Definition der Projektlaufzeit und Verteilung der Netto-Wochen auf SAP Activate Phasen." />
      <CardContent className="space-y-8">
        
        {/* Core Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <Label>Startdatum</Label>
            <Input type="date" value={d.startDate} onChange={e => handleUpdate({ startDate: e.target.value })} className="mt-2" />
          </div>
          <div>
            <Label>Enddatum</Label>
            <Input type="date" value={d.endDate} onChange={e => handleUpdate({ endDate: e.target.value })} className="mt-2" />
          </div>
          <div>
            <Label>Projektwochen brutto</Label>
            <div className="mt-2 px-3 py-1.5 bg-gray-50 text-gray-700 rounded-md ring-1 ring-inset ring-gray-200 sm:text-sm font-medium">
              {grossWeeks} Wochen
            </div>
          </div>
          <div>
            <Label>Projektwochen netto</Label>
            <Input type="number" value={d.netWeeks} onChange={e => handleUpdate({ netWeeks: parseFloat(e.target.value) || 0 })} className="mt-2" />
          </div>
        </div>

        {/* Phase Distribution */}
        <div>
          <div className="flex items-center justify-between mb-4 border-b pb-2">
            <h4 className="text-sm font-medium text-gray-900">Phasenverteilung</h4>
            {!isMainPhasesValid && (
              <span className="text-sm font-medium text-red-600">Summe: {mainPhasesSum}% (muss 100% sein)</span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phase</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Verteilung %</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dauer in Wochen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(Object.keys(d.phaseDistributions) as Phase[]).map(phase => {
                  const pct = d.phaseDistributions[phase];
                  const weeks = phase === 'Run+Hypercare' 
                    ? d.runHypercareWeeks 
                    : (d.netWeeks * (pct / 100));

                  return (
                    <tr key={phase}>
                      <td className="px-3 py-2 text-sm text-gray-900 font-medium">{phase}</td>
                      <td className="px-3 py-2">
                        {phase === 'Run+Hypercare' ? (
                           <span className="text-sm text-gray-400">Manuell</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Input 
                              type="number" 
                              className={`w-24 ${!isMainPhasesValid ? 'ring-red-300 focus:ring-red-500' : ''}`} 
                              value={pct} 
                              onChange={e => handleUpdate({ 
                                phaseDistributions: { ...d.phaseDistributions, [phase]: parseFloat(e.target.value) || 0 } 
                              })} 
                            />
                            <span className={`text-sm ${!isMainPhasesValid ? 'text-red-500' : 'text-gray-500'}`}>%</span>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 font-mono">
                        {phase === 'Run+Hypercare' ? (
                          <div className="flex items-center gap-2">
                            <Input 
                              type="number" 
                              className="w-24" 
                              value={d.runHypercareWeeks} 
                              onChange={e => handleUpdate({ runHypercareWeeks: parseFloat(e.target.value) || 0 })} 
                            />
                            <span className="text-sm text-gray-500">Wochen</span>
                          </div>
                        ) : (
                           weeks.toFixed(2)
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Phase Details (Inhalte) */}
        <div>
          <div className="flex items-center justify-between mb-4 border-b pb-2">
            <h4 className="text-sm font-medium text-gray-900">Inhalte pro Phase</h4>
            <button onClick={addPhaseDetail} className="text-xs flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100 font-medium">
              <Plus className="w-3 h-3" /> Zeile hinzufügen
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phase</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Inhalt</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Verteilung %</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dauer in Wochen</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {d.phaseDetails.map(detail => {
                  const phaseWeeks = d.netWeeks * (d.phaseDistributions[detail.phase] / 100);
                  const detailWeeks = phaseWeeks * (detail.percentage / 100);
                  const isDetailSumValid = phaseDetailSums[detail.phase] === 100;

                  return (
                    <tr key={detail.id} className={!isDetailSumValid ? 'bg-red-50/50' : ''}>
                      <td className="px-3 py-2">
                        <select 
                          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                          value={detail.phase}
                          onChange={e => updatePhaseDetail(detail.id, 'phase', e.target.value)}
                        >
                          {['Discover', 'Prepare', 'Explore', 'Realize', 'Deploy'].map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <Input value={detail.content} onChange={e => updatePhaseDetail(detail.id, 'content', e.target.value)} />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Input 
                            type="number" 
                            className={`w-24 ${!isDetailSumValid ? 'ring-red-300 focus:ring-red-500' : ''}`} 
                            value={detail.percentage} 
                            onChange={e => updatePhaseDetail(detail.id, 'percentage', parseFloat(e.target.value) || 0)} 
                          />
                          <span className={`text-sm ${!isDetailSumValid ? 'text-red-500' : 'text-gray-500'}`}>%</span>
                        </div>
                        {!isDetailSumValid && (
                          <div className="text-xs text-red-500 mt-1">Summe für {detail.phase}: {phaseDetailSums[detail.phase] || 0}%</div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 font-mono">
                        {detailWeeks.toFixed(2)}
                      </td>
                      <td className="px-3 py-2">
                        <button onClick={() => removePhaseDetail(detail.id)} className="text-red-500 hover:text-red-700 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
