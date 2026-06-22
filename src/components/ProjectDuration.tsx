import React, { useMemo } from 'react';
import { useAppContext } from '../store';
import { Card, CardContent, CardHeader, Input, Label } from './ui';
import { CalendarDays, Plus, Trash2, Globe } from 'lucide-react';
import { PHASES, Phase } from '../types';
import { translations, Language, TranslationKey } from '../i18n';

export function ProjectDuration() {
  const { state, updateState } = useAppContext();
  const { projectDuration: d, language } = state;

  const lang = (language || 'de') as Language;
  const t = (key: TranslationKey) => translations[lang]?.[key] || translations['de'][key] || key;

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

  const handleLanguageUpdate = (newLang: string) => {
    updateState('language', newLang);
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

  const LanguageSelector = (
    <div className="flex items-center gap-2 text-sm bg-slate-100/80 px-3 py-1.5 rounded-full ring-1 ring-slate-200">
      <Globe className="w-4 h-4 text-slate-500" />
      <select 
        value={lang} 
        onChange={(e) => handleLanguageUpdate(e.target.value)}
        className="bg-transparent border-none text-slate-700 font-medium py-0 pl-1 pr-6 focus:ring-0 cursor-pointer"
      >
        <option value="de">Deutsch</option>
        <option value="en">English</option>
        <option value="fr">Français</option>
        <option value="nl">Nederlands</option>
        <option value="zh">中文</option>
      </select>
    </div>
  );

  return (
    <Card>
      <CardHeader 
        title={t('duration.title')} 
        icon={CalendarDays} 
        description={t('duration.desc')}
        action={LanguageSelector}
      />
      <CardContent className="space-y-8">
        
        {/* Core Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <Label>{t('duration.start')}</Label>
            <Input type="date" value={d.startDate} onChange={e => handleUpdate({ startDate: e.target.value })} className="mt-2" />
          </div>
          <div>
            <Label>{t('duration.end')}</Label>
            <Input type="date" value={d.endDate} onChange={e => handleUpdate({ endDate: e.target.value })} className="mt-2" />
          </div>
          <div>
            <Label>{t('duration.grossWeeks')}</Label>
            <div className="mt-2 px-3 py-1.5 bg-gray-50 text-gray-700 rounded-md ring-1 ring-inset ring-gray-200 sm:text-sm font-medium">
              {grossWeeks} {t('duration.weeks')}
            </div>
          </div>
          <div>
            <Label>{t('duration.netWeeks')}</Label>
            <Input type="number" value={d.netWeeks} onChange={e => handleUpdate({ netWeeks: parseFloat(e.target.value) || 0 })} className="mt-2" />
          </div>
        </div>

        {/* Phase Distribution */}
        <div>
          <div className="flex items-center justify-between mb-4 border-b pb-2">
            <h4 className="text-sm font-medium text-gray-900">{t('duration.phaseDist')}</h4>
            {!isMainPhasesValid && (
              <span className="text-sm font-medium text-red-600">{t('duration.sumMustBe').replace('{sum}', mainPhasesSum.toString())}</span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('duration.phase')}</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('duration.distPercent')}</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('duration.durationWeeks')}</th>
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
                           <span className="text-sm text-gray-400">{t('duration.manual')}</span>
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
                            <span className="text-sm text-gray-500">{t('duration.weeks')}</span>
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
            <h4 className="text-sm font-medium text-gray-900">{t('duration.phaseDetails')}</h4>
            <button onClick={addPhaseDetail} className="text-xs flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100 font-medium">
              <Plus className="w-3 h-3" /> {t('duration.addDetail')}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('duration.phase')}</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('duration.content')}</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('duration.distPercent')}</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('duration.durationWeeks')}</th>
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
                          <div className="text-xs text-red-500 mt-1">{t('duration.sumFor')} {detail.phase}: {phaseDetailSums[detail.phase] || 0}%</div>
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
