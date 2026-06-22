import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { useAppContext } from '../store';
import { Card, CardHeader, CardContent } from './ui';
import { BarChartHorizontal } from 'lucide-react';
import { PHASES, PHASE_COLORS } from '../constants';
import { Phase } from '../types';
import { translations, Language, TranslationKey } from '../i18n';

export function ProjectTimeline() {
  const { state } = useAppContext();
  const { projectDuration: d, scopeItems: s, dataMigration: dm, integrations: int, forms: fm, teamAndCosts: tc, language } = state;

  const lang = (language || 'de') as Language;
  const t = (key: TranslationKey) => translations[lang]?.[key] || translations['de'][key] || key;

  const data = useMemo(() => {
    let sLow = 0, sMedium = 0, sHigh = 0, sVeryHigh = 0;
    Object.values(s.items).forEach(item => {
      sLow += item.low || 0;
      sMedium += item.medium || 0;
      sHigh += item.high || 0;
      sVeryHigh += item.veryHigh || 0;
    });

    const calculateGenericDaysForPhase = (mod: any, phase: string) => {
      let phaseDays = 0;
      Object.keys(mod.inputs).forEach(type => {
        const inp = mod.inputs[type];
        const setup = mod.setup[type];
        if (setup) {
           const typeTotalDays = (inp.low * setup.Low) + (inp.medium * setup.Medium) + (inp.high * setup.High);
           const dist = mod.distribution[type] || {};
           phaseDays += typeTotalDays * ((dist[phase as Phase] || 0) / 100);
        }
      });
      return phaseDays;
    };

    let currentStart = 0;
    return PHASES.map(phase => {
      const isRun = phase === 'Run+Hypercare';
      const durationWeeks = isRun
        ? d.runHypercareWeeks
        : d.netWeeks * ((d.phaseDistributions[phase] || 0) / 100);

      const start = currentStart;
      const end = currentStart + durationWeeks;
      currentStart = end;

      // Calculate scope days for this phase
      const matrix = s.complexityMatrix[phase as Phase];
      const scopeDays = isRun ? 0 : (matrix ? 
        (sLow * matrix.Low) + (sMedium * matrix.Medium) + (sHigh * matrix.High) + (sVeryHigh * matrix['Very High']) 
        : 0);

      const dataMigrationDays = isRun ? 0 : calculateGenericDaysForPhase(dm, phase);
      const integrationDays = isRun ? 0 : calculateGenericDaysForPhase(int, phase);
      const formsDays = isRun ? 0 : calculateGenericDaysForPhase(fm, phase);

      const basePhaseDays = scopeDays + dataMigrationDays + integrationDays + formsDays;
      
      const pmPersons = tc.pmPersons ?? 1;
      const pmDaysPerWeek = tc.pmDaysPerWeek ?? 0.125;
      const meetingPersons = tc.meetingPersons ?? 1;
      const meetingDaysPerWeek = tc.meetingDaysPerWeek ?? 0.125;
      
      const pmDays = isRun ? 0 : pmPersons * durationWeeks * pmDaysPerWeek;
      const meetingDays = isRun ? 0 : meetingPersons * durationWeeks * meetingDaysPerWeek;
      
      let runLayerDays = 0;
      if (isRun) {
         runLayerDays = Object.values(tc.runHypercareDays || {}).reduce((a, b) => a + (b || 0), 0);
      }

      const totalPhaseDays = basePhaseDays + pmDays + meetingDays + runLayerDays;

      return {
        name: phase,
        start: parseFloat(start.toFixed(2)),
        duration: parseFloat(durationWeeks.toFixed(2)),
        end: parseFloat(end.toFixed(2)),
        scopeDays,
        dataMigrationDays,
        integrationDays,
        formsDays,
        pmDays,
        meetingDays,
        runLayerDays,
        totalPhaseDays,
        totalPhaseDaysLabel: totalPhaseDays > 0 ? `${totalPhaseDays.toFixed(1)} Tage` : '',
        durationLabel: durationWeeks > 0 ? `${parseFloat(durationWeeks.toFixed(1))} W` : ''
      };
    }).filter(item => item.duration > 0 || item.name === 'Explore'); // filter out zero duration except placeholder if all are zero
  }, [d, s, dm, int, fm, tc]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      // payload[0] is the transparent start bar, payload[1] is the duration bar
      const pData = payload[1]?.payload || payload[0]?.payload; 
      if (!pData) return null;
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-sm rounded-lg flex flex-col gap-1 ring-1 ring-black/5 min-w-[220px]">
          <p className="font-bold text-gray-900 border-b border-gray-100 pb-1 mb-1">{pData.name}</p>
          <div className="text-sm text-gray-600 mb-2">
            <span>Dauer:</span> <span className="font-medium text-gray-900">{pData.duration} Wochen</span> (W{pData.start} - W{pData.end})
          </div>
          
          {pData.totalPhaseDays > 0 && (
             <>
               <p className="font-bold text-gray-900 border-b border-gray-100 pb-1 mb-1 text-xs uppercase tracking-wider mt-2">Kalkulierte Aufwände</p>
               {pData.scopeDays > 0 && <div className="flex justify-between text-sm"><span className="text-gray-600">Scope Items:</span> <span className="font-medium">{pData.scopeDays.toFixed(1)} T</span></div>}
               {pData.dataMigrationDays > 0 && <div className="flex justify-between text-sm"><span className="text-gray-600">Datenmigration:</span> <span className="font-medium">{pData.dataMigrationDays.toFixed(1)} T</span></div>}
               {pData.integrationDays > 0 && <div className="flex justify-between text-sm"><span className="text-gray-600">Integrationen:</span> <span className="font-medium">{pData.integrationDays.toFixed(1)} T</span></div>}
               {pData.formsDays > 0 && <div className="flex justify-between text-sm"><span className="text-gray-600">Formulare:</span> <span className="font-medium">{pData.formsDays.toFixed(1)} T</span></div>}
               {(pData.pmDays > 0 || pData.meetingDays > 0) && (
                 <div className="flex justify-between text-sm text-indigo-700 mt-1 pt-1 border-t border-indigo-50/50">
                    <span>PM & Meetings:</span> <span>+{(pData.pmDays + pData.meetingDays).toFixed(1)} T</span>
                 </div>
               )}
               {pData.runLayerDays > 0 && (
                 <div className="flex justify-between text-sm text-emerald-700 mt-1 pt-1 border-t border-emerald-50/50">
                    <span>Run+Hypercare (Manuell):</span> <span>+{pData.runLayerDays.toFixed(1)} T</span>
                 </div>
               )}
               <div className="flex justify-between text-sm font-bold text-indigo-700 mt-1 pt-1 border-t border-indigo-100">
                  <span>Gesamt für {pData.name}:</span> <span>{pData.totalPhaseDays.toFixed(1)} T</span>
               </div>
             </>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader 
        title={t('timeline.title')} 
        icon={BarChartHorizontal} 
        description={t('timeline.desc')} 
      />
      <CardContent>
        <div className="h-[360px] w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 60, left: 20, bottom: 0 }}
              barGap={0}
              barCategoryGap="20%"
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
              <XAxis 
                type="number" 
                tickFormatter={(v) => `W${v}`} 
                tick={{ fontSize: 12, fill: '#6b7280' }} 
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={110} 
                tick={{ fontSize: 13, fill: '#374151', fontWeight: 500 }} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip cursor={{ fill: '#f3f4f6' }} content={<CustomTooltip />} />
              <Bar dataKey="start" stackId="a" fill="transparent" isAnimationActive={true} />
              <Bar dataKey="duration" stackId="a" radius={[0, 4, 4, 0]} isAnimationActive={true}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PHASE_COLORS[entry.name as keyof typeof PHASE_COLORS] || '#6366f1'} />
                ))}
                <LabelList dataKey="durationLabel" position="inside" style={{ fill: '#ffffff', fontSize: 12, fontWeight: 600 }} />
                <LabelList dataKey="totalPhaseDaysLabel" position="right" style={{ fill: '#4f46e5', fontSize: 12, fontWeight: 700 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
