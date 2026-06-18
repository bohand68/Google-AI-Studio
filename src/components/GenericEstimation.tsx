import React, { useMemo } from 'react';
import { AppState, Phase } from '../types';
import { ESTIMATION_PHASES } from '../constants';
import { useAppContext } from '../store';
import { Card, CardContent, CardHeader, Input } from './ui';
import { Plus, Trash2 } from 'lucide-react';
import { PhaseChart } from './PhaseChart';

interface Props {
  sectionKey: 'dataMigration' | 'integrations' | 'forms';
  title: string;
  icon: React.ElementType;
  description: string;
  typeLabel: string;
}

export function GenericEstimation({ sectionKey, title, icon: Icon, description, typeLabel }: Props) {
  const { state, updateState } = useAppContext();
  const data = state[sectionKey];
  const types = Object.keys(data.setup);

  const chartDataAndTotal = useMemo(() => {
    const totals: Record<string, number> = {};
    ESTIMATION_PHASES.forEach(p => totals[p] = 0);
    let totalDays = 0;

    types.forEach(t => {
      const inp = data.inputs[t] || { low: 0, medium: 0, high: 0 };
      const setup = data.setup[t] || { Low: 0, Medium: 0, High: 0 };
      const tDays = (inp.low * setup.Low) + (inp.medium * setup.Medium) + (inp.high * setup.High);
      const dist = data.distribution[t] || {};
      
      ESTIMATION_PHASES.forEach(phase => {
        const daysInPhase = tDays * ((dist[phase] || 0) / 100);
        totals[phase] += daysInPhase;
        totalDays += daysInPhase;
      });
    });

    const chartData = ESTIMATION_PHASES.map(phase => ({
      name: phase,
      Tage: parseFloat(totals[phase].toFixed(1))
    })).filter(x => x.Tage > 0);

    return { data: chartData, totalDays };
  }, [data, types]);

  const handleSetupUpdate = (type: string, complexity: string, value: number) => {
    updateState(sectionKey, (prev: any) => ({
      ...prev,
      setup: {
        ...prev.setup,
        [type]: { ...prev.setup[type], [complexity]: value }
      }
    }));
  };

  const handleInputUpdate = (type: string, field: string, value: number) => {
    updateState(sectionKey, (prev: any) => ({
      ...prev,
      inputs: {
        ...prev.inputs,
        [type]: { ...prev.inputs[type], [field]: value }
      }
    }));
  };

  const handleDistributionUpdate = (type: string, phase: Phase, value: number) => {
    updateState(sectionKey, (prev: any) => ({
      ...prev,
      distribution: {
        ...prev.distribution,
        [type]: { ...prev.distribution[type], [phase]: value }
      }
    }));
  };

  const addType = () => {
    const newName = `Neuer Typ ${Object.keys(data.setup).length + 1}`;
    updateState(sectionKey, (prev: any) => ({
      ...prev,
      setup: { ...prev.setup, [newName]: { Low: 1, Medium: 2, High: 3 } },
      inputs: { ...prev.inputs, [newName]: { total: 0, low: 0, medium: 0, high: 0 } },
      distribution: { ...prev.distribution, [newName]: { Prepare: 0, Explore: 10, Realize: 80, Deploy: 10 } }
    }));
  };

  const removeType = (name: string) => {
    const removeKey = (obj: any, key: string) => {
      const { [key]: _, ...rest } = obj;
      return rest;
    };
    updateState(sectionKey, (prev: any) => ({
      ...prev,
      setup: removeKey(prev.setup, name),
      inputs: removeKey(prev.inputs, name),
      distribution: removeKey(prev.distribution, name)
    }));
  };

  return (
    <Card>
      <CardHeader title={title} description={description} icon={Icon} />
      <CardContent className="space-y-10">
        
        {/* Inputs */}
        <div>
           <h4 className="text-sm font-medium text-gray-900 mb-4 border-b pb-2">Mengenangaben</h4>
           <div className="overflow-x-auto">
             <table className="min-w-full divide-y divide-gray-200">
               <thead>
                 <tr>
                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-48">{typeLabel}</th>
                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Gesamt</th>
                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Anzahl Low</th>
                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Anzahl Medium</th>
                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Anzahl High</th>
                   <th className="px-3 py-2 text-left text-xs font-medium text-indigo-600 uppercase">Aufwand in Tagen</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-200">
                 {types.map(t => {
                   const inp = data.inputs[t] || { total: 0, low: 0, medium: 0, high: 0 };
                   const setup = data.setup[t] || { Low: 0, Medium: 0, High: 0 };
                   const totalDays = (inp.low * setup.Low) + (inp.medium * setup.Medium) + (inp.high * setup.High);
                   
                   return (
                   <tr key={t}>
                     <td className="px-3 py-2 text-sm text-gray-900 font-medium">{t}</td>
                     <td className="px-3 py-2">
                       <Input type="number" className="w-20" value={inp.total || ''} onChange={e => handleInputUpdate(t, 'total', parseInt(e.target.value) || 0)} />
                     </td>
                     <td className="px-3 py-2">
                       <Input type="number" className="w-20" value={inp.low || ''} onChange={e => handleInputUpdate(t, 'low', parseInt(e.target.value) || 0)} />
                     </td>
                     <td className="px-3 py-2">
                       <Input type="number" className="w-20" value={inp.medium || ''} onChange={e => handleInputUpdate(t, 'medium', parseInt(e.target.value) || 0)} />
                     </td>
                     <td className="px-3 py-2">
                       <Input type="number" className="w-20" value={inp.high || ''} onChange={e => handleInputUpdate(t, 'high', parseInt(e.target.value) || 0)} />
                     </td>
                     <td className="px-3 py-2 text-sm font-semibold text-indigo-700 bg-indigo-50/30">
                       {totalDays.toFixed(1)} Tage
                     </td>
                   </tr>
                 )})}
               </tbody>
             </table>
           </div>
        </div>

        {/* Setup Matrix */}
        <div>
           <div className="flex items-center justify-between mb-4 border-b pb-2">
            <h4 className="text-sm font-medium text-gray-900">Anzahl Tage je Komplexität</h4>
            <button onClick={addType} className="text-xs flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100 font-medium">
              <Plus className="w-3 h-3" /> Typ hinzufügen
            </button>
          </div>
           <div className="overflow-x-auto">
             <table className="min-w-full divide-y divide-gray-200">
               <thead>
                 <tr>
                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-48">{typeLabel}</th>
                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Low</th>
                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Medium</th>
                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">High</th>
                   <th className="px-3 py-2"></th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-200">
                 {types.map(t => (
                   <tr key={t}>
                     <td className="px-3 py-2 text-sm text-gray-900 font-medium">{t}</td>
                     {['Low', 'Medium', 'High'].map(comp => (
                       <td className="px-3 py-2" key={comp}>
                         <Input 
                           type="number" 
                           step="0.1" 
                           className="w-20"
                           value={data.setup[t][comp] || 0}
                           onChange={e => handleSetupUpdate(t, comp, parseFloat(e.target.value) || 0)}
                          />
                       </td>
                     ))}
                     <td className="px-3 py-2">
                        <button onClick={() => removeType(t)} className="text-red-500 hover:text-red-700 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>

        {/* Phase Distribution */}
        <div>
           <h4 className="text-sm font-medium text-gray-900 mb-4 border-b pb-2">Aufteilung der Tage auf Projektphasen (%)</h4>
           <div className="overflow-x-auto">
             <table className="min-w-full divide-y divide-gray-200">
               <thead>
                 <tr>
                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-48">{typeLabel}</th>
                   {ESTIMATION_PHASES.map(p => (
                      <th key={p} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{p}</th>
                   ))}
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-200">
                 {types.map(t => {
                   const dist = data.distribution[t] || {};
                   const sum = ESTIMATION_PHASES.reduce((acc, phase) => acc + (dist[phase] || 0), 0);
                   const isValid = sum === 100;
                   
                   return (
                   <tr key={t} className={!isValid ? 'bg-red-50/50' : ''}>
                     <td className="px-3 py-2 text-sm text-gray-900 font-medium">
                       {t}
                       {!isValid && <div className="text-xs text-red-500 mt-1 font-normal">Summe: {sum}%</div>}
                     </td>
                     {ESTIMATION_PHASES.map(phase => (
                       <td className="px-3 py-2" key={phase}>
                          <div className="flex items-center gap-1">
                            <Input 
                              type="number" 
                              className={`w-16 ${!isValid ? 'ring-red-300 focus:ring-red-500' : ''}`} 
                              value={dist[phase] || 0} 
                              onChange={e => handleDistributionUpdate(t, phase, parseFloat(e.target.value) || 0)}
                            />
                            <span className={`text-xs ${!isValid ? 'text-red-500' : 'text-gray-400'}`}>%</span>
                          </div>
                       </td>
                     ))}
                   </tr>
                 )})}
               </tbody>
             </table>
           </div>
        </div>

        <PhaseChart data={chartDataAndTotal.data} totalDays={chartDataAndTotal.totalDays} />

      </CardContent>
    </Card>
  )
}
