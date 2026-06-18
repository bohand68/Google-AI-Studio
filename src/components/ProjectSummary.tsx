import React from 'react';
import { Card, CardHeader, CardContent } from './ui';
import { Table as TableIcon, PieChart as PieChartIcon, BarChart3 as BarChartIcon, Target } from 'lucide-react';
import { PHASES } from '../constants';
import { useProjectCalculation } from '../hooks/useProjectCalculation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

const phaseColorClasses: Record<string, string> = {
  'Discover': '',
  'Prepare': '',
  'Explore': '',
  'Realize': '',
  'Deploy': '',
  'Run+Hypercare': ''
};

const CHART_COLORS = ['#4f46e5', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#84cc16', '#eab308', '#f59e0b'];

const fmtNum = (v: number) => new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
const fmtCurr = (v: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

function BenchmarkProgress({ label, current, benchmark, formatter }: { label: string; current: number; benchmark: number; formatter: (v: number) => string }) {
  const percent = Math.min(100, Math.max(0, (current / benchmark) * 100));
  const isOver = current > benchmark * 1.1;
  const isOptimal = current >= benchmark * 0.8 && current <= benchmark * 1.1;
  const isLow = current < benchmark * 0.8;
  
  let color = 'bg-indigo-600';
  if (isOver) color = 'bg-amber-500';
  if (isOptimal) color = 'bg-emerald-500';
  if (isLow) color = 'bg-sky-400';

  return (
    <div>
      <div className="flex justify-between items-end mb-2">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <div className="text-right">
          <span className={`text-sm font-bold ${isOver ? 'text-amber-600' : isOptimal ? 'text-emerald-600' : 'text-slate-900'}`}>
            {formatter(current)}
          </span>
          <span className="text-xs text-slate-500 ml-2">
            / {formatter(benchmark)} (Benchmark)
          </span>
        </div>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
        <div className={`h-2.5 rounded-full ${color} transition-all duration-500`} style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  );
}

export function ProjectSummary() {
  const summary = useProjectCalculation();

  const barData = summary.phaseData.map(p => {
    const data: any = { name: p.phase };
    summary.roleTable.forEach(row => {
      const phaseCol = row.phaseCols.find(c => c.phase === p.phase);
      if (phaseCol) {
        data[row.code] = phaseCol.euro;
      }
    });
    return data;
  });

  const roles = summary.roleTable.map(r => r.code);

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden">
        <CardHeader title="8. Gesamtübersicht & Kalkulation" icon={TableIcon} description="Vollständige Auswertung und Verteilung der Aufwände nach Projektphasen und Beraterkategorien." />
        <CardContent>
          <div className="overflow-x-auto ring-1 ring-gray-200 rounded-lg mb-8">
            <table className="min-w-full divide-y divide-gray-200 text-sm whitespace-nowrap">
              <thead className="bg-gray-50">
                <tr className="divide-x divide-gray-200">
                  <th colSpan={2} className="px-4 py-3 text-left font-semibold text-gray-900">S/4HANA Kalkulation</th>
                  {summary.phaseData.map(p => (
                     <th key={`h1-${p.phase}`} colSpan={2} className={`px-4 py-3 text-center uppercase text-xs font-bold tracking-wider text-gray-700 ${phaseColorClasses[p.phase]}`}>
                       {p.phase}
                     </th>
                  ))}
                  <th colSpan={2} className="px-4 py-3 text-center bg-slate-50 font-bold text-slate-900 tracking-wider text-xs border-l border-slate-200">GESCHÄTZTE AUFWÄNDE</th>
                </tr>
                <tr className="divide-x divide-gray-200 bg-white">
                  <th colSpan={2} className="px-4 py-2 text-left font-medium text-gray-500 italic">Gepl. Projektlaufzeit [Wochen]:</th>
                  {summary.phaseData.map(p => (
                     <th key={`wks-${p.phase}`} colSpan={2} className={`px-4 py-2 text-center font-medium text-gray-700 ${phaseColorClasses[p.phase]}`}>
                        {fmtNum(p.weeks)}
                     </th>
                  ))}
                  <th colSpan={2} className="px-4 py-2 bg-slate-50 text-center font-bold text-slate-700 border-l border-slate-200">
                    {fmtNum(summary.phaseData.reduce((acc, p) => acc + p.weeks, 0))}
                  </th>
                </tr>
                <tr className="divide-x divide-gray-200 bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Beraterkategorien</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Tagessatz</th>
                  {summary.phaseData.map(p => (
                     <React.Fragment key={`hdr-${p.phase}`}>
                       <th className={`px-4 py-2 text-right text-xs font-semibold text-gray-600 ${phaseColorClasses[p.phase]}`}>BT</th>
                       <th className={`px-4 py-2 text-right text-xs font-semibold text-gray-600 ${phaseColorClasses[p.phase]}`}>EURO</th>
                     </React.Fragment>
                  ))}
                  <th className="px-4 py-2 text-right text-xs font-bold text-slate-900 bg-slate-50 border-l border-slate-200">Summe BT</th>
                  <th className="px-4 py-2 text-right text-xs font-bold text-slate-900 bg-slate-50">Summe [EURO]</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                 {summary.roleTable.map(row => (
                    <tr key={row.code} className="divide-x divide-gray-200 hover:bg-gray-50 transition-colors">
                       <td className="px-4 py-2 text-left font-medium text-gray-900 font-mono text-xs">{row.code}</td>
                       <td className="px-4 py-2 text-right text-gray-600 text-xs">{fmtNum(row.rate)}</td>
                       {row.phaseCols.map(col => (
                          <React.Fragment key={`${row.code}-${col.phase}`}>
                            <td className="px-4 py-2 text-right text-gray-700 text-xs">{fmtNum(col.bt)}</td>
                            <td className="px-4 py-2 text-right text-gray-700 text-xs">{fmtNum(col.euro)}</td>
                          </React.Fragment>
                       ))}
                       <td className="px-4 py-2 text-right bg-slate-50 font-bold text-slate-700 text-xs border-l border-slate-200">{fmtNum(row.totalBT)}</td>
                       <td className="px-4 py-2 text-right bg-slate-50 font-bold text-slate-700 text-xs">{fmtNum(row.totalEuro)}</td>
                    </tr>
                 ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                 <tr className="divide-x divide-gray-200 font-bold">
                   <td colSpan={2} className="px-4 py-3 text-left uppercase text-gray-900 text-sm tracking-wider">SUMME</td>
                   {summary.phaseData.map(p => (
                     <React.Fragment key={`sum-${p.phase}`}>
                       <td className="px-4 py-3 text-right text-gray-900">{fmtNum(summary.phaseTotals[p.phase].bt)}</td>
                       <td className="px-4 py-3 text-right text-gray-900">{fmtNum(summary.phaseTotals[p.phase].euro)}</td>
                     </React.Fragment>
                   ))}
                   <td className="px-4 py-3 text-right text-slate-900 font-bold bg-slate-100 border-l border-slate-200">{fmtNum(summary.grandTotalBT)}</td>
                   <td className="px-4 py-3 text-right text-slate-900 font-bold bg-slate-100">{fmtNum(summary.grandTotalEuro)}</td>
                 </tr>
              </tfoot>
            </table>
          </div>

          {/* Dashboards Section */}
          <div className="mt-8">
            <Card className="border-0 shadow-none ring-1 ring-slate-200/60 bg-slate-50/50">
              <CardHeader title="Kosten pro Projektphase" icon={BarChartIcon} />
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" axisLine={false} tickLine={false} fontSize={12} tickFormatter={(value) => `€${value / 1000}k`} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={12} width={100} />
                    <RechartsTooltip formatter={(value: number) => fmtCurr(value)} cursor={{fill: '#f1f5f9'}} />
                    <Legend verticalAlign="bottom" height={36} />
                    {roles.map((role, idx) => (
                      <Bar key={role} dataKey={role} stackId="a" fill={CHART_COLORS[idx % CHART_COLORS.length]} name={role} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Benchmarks Section */}
          <div className="mt-8">
            <Card className="border-0 shadow-none ring-1 ring-slate-200/60 bg-slate-50/50">
              <CardHeader title="Aufwands-Benchmarks (S/4HANA Public Cloud)" icon={Target} description="Vergleich der aktuellen Kalkulation mit typischen Industriestandards für mittelständische Unternehmen." />
              <CardContent className="space-y-6 pt-4">
                 <div className="bg-indigo-50/50 p-4 rounded-lg border border-indigo-100 text-sm text-indigo-900 leading-relaxed">
                   Die hinterlegten Erfahrungswerte (Benchmarks) dienen als unverbindliche Richtwerte für ein typisches S/4HANA Public Cloud Projekt im Mittelstand. Sie orientieren sich an der {' '}
                   <a 
                     href="https://go.support.sap.com/roadmapviewer/#/group/658F507A56F71EA68D42CF25D6E3F4AE" 
                     target="_blank" 
                     rel="noopener noreferrer" 
                     className="font-medium text-indigo-600 hover:text-indigo-800 underline underline-offset-2 transition-colors"
                   >
                     SAP Activate Methodik
                   </a>
                   {' '} sowie an aggregierten Erfahrungswerten aus bisherigen Implementierungsprojekten.
                 </div>
                 
                 <BenchmarkProgress 
                    label="Gesamtkosten (EUR)"
                    current={summary.grandTotalEuro}
                    benchmark={800000}
                    formatter={fmtCurr}
                 />
                 <BenchmarkProgress 
                    label="Projektlaufzeit (Wochen)"
                    current={summary.phaseData.reduce((acc, p) => acc + p.weeks, 0)}
                    benchmark={28}
                    formatter={(v) => `${v} Wochen`}
                 />
                 <BenchmarkProgress 
                    label="Beratungstage (Gesamt)"
                    current={summary.grandTotalBT}
                    benchmark={500}
                    formatter={(v) => `${v} PT`}
                 />
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
