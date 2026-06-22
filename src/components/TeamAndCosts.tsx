import React from 'react';
import { useAppContext } from '../store';
import { Card, CardContent, CardHeader, Input, Label } from './ui';
import { Users } from 'lucide-react';

export function TeamAndCosts() {
  const { state, updateState } = useAppContext();
  const { teamAndCosts: t, scopeItems: s, dataMigration: dm, integrations: int, forms: fm } = state;

  const handleUpdate = (updates: Partial<typeof t>) => {
    updateState('teamAndCosts', { ...t, ...updates });
  };

  const handleRateUpdate = (code: string, val: number) => {
    handleUpdate({ dailyRates: { ...t.dailyRates, [code]: val } });
  };

  const handlePercentUpdate = (code: string, val: number) => {
    handleUpdate({ rolePercent: { ...(t.rolePercent || {}), [code]: val } });
  };

  const handleDaysOverrideUpdate = (code: string, val: string) => {
    const override = val === '' ? null : parseFloat(val);
    handleUpdate({ roleDaysOverride: { ...(t.roleDaysOverride || {}), [code]: override } });
  };


  // Auto Cost calculation logic.
  // Note: True total days calculation across ALL phases and components goes here.
  // We'll calculate a unified "Total Project Days" purely for structural reference,
  // then multiply by blended rates or specific FTE assignments to demonstrate total costs.
  // For a rough estimate based on average rate:
  
  const avgRate = Object.values(t.dailyRates).reduce((sum, r) => sum + r, 0) / Object.values(t.dailyRates).length;
  
  // Calculate total days from functional modules (Data migration + Integrations + Forms)
  const calculateModuleDays = (mod: any) => {
    return Object.keys(mod.inputs).reduce((sum, type) => {
      const inp = mod.inputs[type];
      const setup = mod.setup[type];
      if (!setup) return sum;
      return sum + (inp.low * setup.Low) + (inp.medium * setup.Medium) + (inp.high * setup.High);
    }, 0);
  };

  const moduleDays = calculateModuleDays(dm) + calculateModuleDays(int) + calculateModuleDays(fm);

  // Calculate scope items days
  let scopeDays = 0;
  Object.keys(s.items).forEach(cat => {
    const item = s.items[cat];
    Object.keys(s.complexityMatrix).forEach(phase => {
        const matrix = s.complexityMatrix[phase as any];
        scopeDays += (item.low * matrix.Low) + (item.medium * matrix.Medium) + (item.high * matrix.High) + (item.veryHigh * matrix['Very High']);
    });
  });

  const baseDays = moduleDays + scopeDays;
  
  const netWeeks = state.projectDuration.netWeeks;

  const pmPersons = t.pmPersons ?? 1;
  const pmDaysPerWeek = t.pmDaysPerWeek ?? 0.125;
  const meetingPersons = t.meetingPersons ?? 1;
  const meetingDaysPerWeek = t.meetingDaysPerWeek ?? 0.125;

  const pmDays = pmPersons * netWeeks * pmDaysPerWeek;
  const meetingsDays = meetingPersons * netWeeks * meetingDaysPerWeek;
  const totalCalculatedDays = baseDays + pmDays + meetingsDays;

  const rolePercent = t.rolePercent || {};
  const roleDaysOverride = t.roleDaysOverride || {};
  
  const complexityFactor = t.complexityFactor || 0;
  const steeringFactor = t.steeringFactor || 0;
  const multiplier = 1 + ((complexityFactor + steeringFactor) / 100);

  const selectedCurrency = t.currency || 'EUR';
  const exchangeRates = t.exchangeRates || { USD: 1.05, CNY: 7.7, GBP: 0.85 };

  const getExchangeRate = () => {
    if (selectedCurrency === 'EUR') return 1;
    return exchangeRates[selectedCurrency] || 1;
  };

  const formatCurrency = (val: number) => {
    const rate = getExchangeRate();
    const converted = val * rate;
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: selectedCurrency }).format(converted);
  };

  const getRoleCalculatedDays = (code: string) => {
    let days = baseDays * ((rolePercent[code] || 0) / 100);
    if (code === 'PL-BPC') {
      days += pmDays;
    }
    if (code === 'SC-BPC') {
      days += meetingsDays * 0.5;
    }
    if (code === 'C-BPC') {
      days += meetingsDays * 0.5;
    }
    return days * multiplier;
  };

  const getRoleFinalDays = (code: string) => {
    if (roleDaysOverride[code] !== undefined && roleDaysOverride[code] !== null) {
      return roleDaysOverride[code] as number;
    }
    const base = getRoleCalculatedDays(code);
    const rhDays = t.runHypercareDays?.[code] || 0;
    return base + rhDays;
  };

  // Always recalculate overrides if the baseline changes
  const calculatedSums = React.useMemo(() => {
    const sums: Record<string, number> = {};
    Object.keys(t.dailyRates).forEach(code => {
      sums[code] = getRoleCalculatedDays(code) + (t.runHypercareDays?.[code] || 0);
    });
    return sums;
  }, [t.dailyRates, rolePercent, baseDays, pmDays, meetingsDays, multiplier, t.runHypercareDays]);

  const [prevSums, setPrevSums] = React.useState(calculatedSums);

  React.useEffect(() => {
    let changed = false;
    const newOverrides = { ...roleDaysOverride };
    Object.keys(t.dailyRates).forEach(code => {
      if (prevSums[code] !== undefined && prevSums[code] !== calculatedSums[code]) {
        if (newOverrides[code] !== undefined && newOverrides[code] !== null) {
           newOverrides[code] = undefined;
           changed = true;
        }
      }
    });
    if (changed) {
      handleUpdate({ roleDaysOverride: newOverrides });
    }
    setPrevSums(calculatedSums);
  }, [calculatedSums, prevSums, roleDaysOverride, t.dailyRates]);

  const totalAssignedPercent = Object.values(rolePercent).reduce((sum, p) => sum + (p || 0), 0);
  const totalAssignedDays = Object.keys(t.dailyRates).reduce((sum, code) => sum + getRoleFinalDays(code), 0);
  const totalProjectCost = Object.keys(t.dailyRates).reduce((sum, code) => {
    return sum + (getRoleFinalDays(code) * (t.dailyRates[code] || 0));
  }, 0);

  return (
    <Card>
      <CardHeader title="7. Beraterteam und Tagessätze" icon={Users} description="Definition des Beraterteams, FTE (Vollzeitäquivalente) und Kalkulation der Gesamtkosten." />
      <CardContent className="space-y-8">
        
        {/* Overheads */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ring-1 ring-gray-200 rounded-lg p-5">
              <div className="space-y-4">
                <h5 className="font-medium text-gray-900 border-b border-gray-100 pb-2">Projektmanagement</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Anzahl Personen</Label>
                    <Input 
                      type="number" 
                      value={pmPersons} 
                      onChange={e => handleUpdate({ pmPersons: parseFloat(e.target.value) || 0 })} 
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Tage pro Woche</Label>
                    <Input 
                      type="number" 
                      step="0.001"
                      value={pmDaysPerWeek} 
                      onChange={e => handleUpdate({ pmDaysPerWeek: parseFloat(e.target.value) || 0 })} 
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  <span className="font-semibold text-indigo-700">Ergebnis: </span> 
                  {pmPersons} x {netWeeks} Wochen x {pmDaysPerWeek} T. = <b>{pmDays.toFixed(1)} Tage</b>
                  <div className="text-xs text-gray-500 mt-1">Wird automatisch <b>PL-BPC</b> zugeordnet</div>
                </div>
              </div>

              <div className="space-y-4 md:border-l md:pl-6 border-gray-200">
                <h5 className="font-medium text-gray-900 border-b border-gray-100 pb-2">Team Meetings</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Anzahl Personen</Label>
                    <Input 
                      type="number" 
                      value={meetingPersons} 
                      onChange={e => handleUpdate({ meetingPersons: parseFloat(e.target.value) || 0 })} 
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Tage pro Woche</Label>
                    <Input 
                      type="number" 
                      step="0.001"
                      value={meetingDaysPerWeek} 
                      onChange={e => handleUpdate({ meetingDaysPerWeek: parseFloat(e.target.value) || 0 })} 
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  <span className="font-semibold text-indigo-700">Ergebnis: </span> 
                  {meetingPersons} x {netWeeks} Wochen x {meetingDaysPerWeek} T. = <b>{meetingsDays.toFixed(1)} Tage</b>
                  <div className="text-xs text-gray-500 mt-1">Wird 50% <b>SC-BPC</b> und 50% <b>C-BPC</b> zugeordnet</div>
                </div>
              </div>
            </div>

        {/* Currency Selector */}
        <div className="w-full bg-slate-50 ring-1 ring-slate-200 rounded-lg p-5">
           <h4 className="text-sm font-medium text-gray-900 mb-4 border-b border-gray-200 pb-2">Währung & Wechselkurse</h4>
           <div className="flex flex-col md:flex-row gap-6">
             <div className="w-full md:w-1/3">
                <Label>Währung auswählen</Label>
                <select 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 ring-1 ring-inset ring-gray-300"
                  value={selectedCurrency}
                  onChange={e => handleUpdate({ currency: e.target.value })}
                >
                  <option value="EUR">Euro (EUR) - Basis</option>
                  <option value="USD">US Dollar (USD)</option>
                  <option value="CNY">Chinesische Yuan (CNY)</option>
                  <option value="GBP">Britische Pfund (GBP)</option>
                </select>
             </div>
             
             {selectedCurrency !== 'EUR' && (
               <div className="w-full md:w-2/3 grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div>
                   <Label>Kurs EUR zu USD</Label>
                   <Input 
                      type="number" step="0.01" 
                      value={exchangeRates.USD || 1.05} 
                      onChange={e => handleUpdate({ exchangeRates: { ...exchangeRates, USD: parseFloat(e.target.value) || 0 } })} 
                    />
                 </div>
                 <div>
                   <Label>Kurs EUR zu CNY</Label>
                   <Input 
                      type="number" step="0.01" 
                      value={exchangeRates.CNY || 7.7} 
                      onChange={e => handleUpdate({ exchangeRates: { ...exchangeRates, CNY: parseFloat(e.target.value) || 0 } })} 
                    />
                 </div>
                 <div>
                   <Label>Kurs EUR zu GBP</Label>
                   <Input 
                      type="number" step="0.01" 
                      value={exchangeRates.GBP || 0.85} 
                      onChange={e => handleUpdate({ exchangeRates: { ...exchangeRates, GBP: parseFloat(e.target.value) || 0 } })} 
                    />
                 </div>
               </div>
             )}
           </div>
        </div>

        {/* Daily Rates & Distribution */}
        <div className="w-full">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 border-b pb-3 gap-3">
                <div className="flex items-center gap-6">
                  <h4 className="text-sm font-medium text-gray-900">Aufteilung Gesamtaufwand nach Rollen</h4>
                  <div className="flex items-center gap-3 bg-indigo-50 px-3 py-1.5 rounded-md border border-indigo-100">
                    <Label className="text-xs font-semibold text-indigo-900 whitespace-nowrap mb-0">Komplexitäts-Anpassung:</Label>
                    <input 
                      type="range" 
                      min="-20" max="20" step="5" 
                      value={t.complexityFactor || 0} 
                      onChange={e => handleUpdate({ complexityFactor: parseInt(e.target.value) })}
                      className="w-24 accent-indigo-600"
                    />
                    <span className="text-xs font-bold text-indigo-700 min-w-[3rem] text-right">
                      {(t.complexityFactor || 0) > 0 ? '+' : ''}{t.complexityFactor || 0}%
                    </span>
                  </div>
                </div>
                {totalAssignedPercent !== 100 && (
                  <span className="text-sm font-medium text-red-600">Verteilung: {totalAssignedPercent}% (muss 100% sein)</span>
                )}
              </div>
              <div className="overflow-x-auto ring-1 ring-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tagessatz (€)</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Verteilung (%)</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Berechnete Tage</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase leading-tight">Run+Hypercare<br/>(Manuell)</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase leading-tight">Rest-Tage<br/>(Manuell)</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Kosten ({selectedCurrency})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {Object.keys(t.dailyRates).map(code => {
                      const calcDays = getRoleCalculatedDays(code);
                      const finalDays = getRoleFinalDays(code);
                      const isOverridden = roleDaysOverride[code] !== undefined && roleDaysOverride[code] !== null;
                      const cost = finalDays * (t.dailyRates[code] || 0);

                      return (
                      <tr key={code}>
                        <td className="px-3 py-1.5 text-sm text-gray-900 font-mono">{code}</td>
                        <td className="px-3 py-1.5">
                          <div className="flex items-center space-x-2">
                            <Input 
                              type="number" 
                              className="w-24" 
                              value={t.dailyRates[code] || 0} 
                              onChange={e => handleRateUpdate(code, parseFloat(e.target.value) || 0)} 
                             />
                            {selectedCurrency !== 'EUR' && (
                              <span className="text-sm font-medium text-indigo-700 whitespace-nowrap bg-indigo-50 px-2 py-1 rounded">
                                {formatCurrency(t.dailyRates[code] || 0)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-1.5">
                           <Input 
                             type="number" 
                             className={`w-20 ${totalAssignedPercent !== 100 ? 'ring-red-300 focus:ring-red-500' : ''}`} 
                             value={rolePercent[code] || 0} 
                             onChange={e => handlePercentUpdate(code, parseFloat(e.target.value) || 0)} 
                            />
                        </td>
                        <td className="px-3 py-1.5 text-sm text-gray-500">
                          {calcDays.toFixed(1)}
                        </td>
                        <td className="px-3 py-1.5">
                           <Input 
                             type="number" 
                             step="0.5"
                             className="w-24 border-green-200 bg-green-50" 
                             value={t.runHypercareDays?.[code] || 0} 
                             onChange={e => handleUpdate({ runHypercareDays: { ...(t.runHypercareDays || {}), [code]: parseFloat(e.target.value) || 0 } })} 
                            />
                        </td>
                        <td className="px-3 py-1.5">
                           <Input 
                             type="number" 
                             step="0.5"
                             className={`w-24 ${isOverridden ? 'bg-yellow-50 focus:bg-yellow-50 border-yellow-300' : ''}`} 
                             value={isOverridden ? Number(roleDaysOverride[code]) : ''} 
                             placeholder={(calcDays + (t.runHypercareDays?.[code] || 0)).toFixed(1)}
                             onChange={e => {
                               if (e.target.value === '') {
                                 handleDaysOverrideUpdate(code, '');
                               } else {
                                 handleDaysOverrideUpdate(code, e.target.value);
                               }
                             }}
                            />
                        </td>
                        <td className="px-3 py-1.5 text-sm text-gray-900 font-medium whitespace-nowrap">
                          {formatCurrency(cost)}
                        </td>
                      </tr>
                    )})}
                  </tbody>
                  <tfoot className="bg-gray-50">
                     <tr>
                       <td colSpan={2} className="px-3 py-2 text-sm font-semibold text-gray-900">Summe</td>
                       <td className={`px-3 py-2 text-sm font-bold ${totalAssignedPercent === 100 ? 'text-indigo-700' : 'text-red-600'}`}>{totalAssignedPercent}%</td>
                       <td className="px-3 py-2 text-sm font-bold text-gray-600">{totalCalculatedDays.toFixed(1)}</td>
                       <td className="px-3 py-2 text-sm font-bold text-green-700">{Object.values(t.runHypercareDays || {}).reduce((a,b)=>a+(b||0),0).toFixed(1)}</td>
                       <td className="px-3 py-2 text-sm font-bold text-indigo-700">{totalAssignedDays.toFixed(1)}</td>
                       <td className="px-3 py-2 text-sm font-bold text-indigo-700">{formatCurrency(totalProjectCost)}</td>
                     </tr>
                  </tfoot>
                </table>
              </div>
            </div>

        {/* Total Cost Summary Card */}
        <div className="w-full bg-indigo-50 rounded-xl p-6 ring-1 ring-indigo-100">
               <h4 className="text-lg font-bold text-indigo-900 mb-2">Gesamtkalkulation</h4>
               <p className="text-sm text-indigo-700 mb-4">Überschlag basierend auf Funktionsbausteinen (Scope Items, Daten, Integration, Formulare) zzgl. Administrationsaufschläge.</p>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 text-sm">
                 <div className="flex justify-between border-b border-indigo-200 pb-1">
                   <span className="text-indigo-800">Aufwand Scope Items (Tage)</span>
                   <span className="font-semibold text-indigo-900">{scopeDays.toFixed(1)}</span>
                 </div>
                 <div className="flex justify-between border-b border-indigo-200 pb-1">
                   <span className="text-indigo-800">Aufwand Technik & Daten (Tage)</span>
                   <span className="font-semibold text-indigo-900">{moduleDays.toFixed(1)}</span>
                 </div>
                 <div className="flex justify-between border-b border-indigo-200 pb-1">
                   <span className="text-indigo-800">Aufschlag Basis (Tage)</span>
                   <span className="font-semibold text-indigo-900">{baseDays.toFixed(1)}</span>
                 </div>
                 <div className="flex justify-between border-b border-indigo-300 pb-1 font-medium bg-indigo-100/50 px-2 rounded -mx-2">
                   <span className="text-indigo-900">PM & Meeting Aufschläge (Tage)</span>
                   <span className="font-bold text-indigo-900">+{(pmDays + meetingsDays).toFixed(1)}</span>
                 </div>

                 <div className="md:col-span-2 flex justify-between border-b-2 border-indigo-300 pb-2 pt-4">
                   <span className="text-indigo-900 font-bold text-base">Berechneter Gesamtaufwand (Tage)</span>
                   <span className="font-bold text-indigo-900 text-base">{totalCalculatedDays.toFixed(1)}</span>
                 </div>
                 <div className="md:col-span-2 flex justify-between pb-1 mt-1">
                   <span className="text-indigo-800">Nach manueller Anpassung verteilte Tage</span>
                   <span className="font-semibold text-indigo-900">{totalAssignedDays.toFixed(1)}</span>
                 </div>
                 <div className="md:col-span-2 flex justify-between items-end pt-4">
                   <span className="text-xl text-indigo-900 font-black">Indikative Projektkosten</span>
                   <span className="text-2xl font-black text-indigo-600">
                     {formatCurrency(totalProjectCost)}
                   </span>
                 </div>
               </div>
            </div>
      </CardContent>
    </Card>
  );
}
