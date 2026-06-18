import React from 'react';
import { Card, CardHeader, CardContent, Label } from './ui';
import { Network } from 'lucide-react';
import { useAppContext } from '../store';

export function Rasci() {
  const { state, updateState } = useAppContext();
  const teamAndCosts = state.teamAndCosts;
  const steeringFactor = teamAndCosts.steeringFactor || 0;

  const handleUpdate = (val: number) => {
    updateState('teamAndCosts', { ...teamAndCosts, steeringFactor: val });
  };

  return (
    <Card>
      <CardHeader title="6. RASCI Matrix & Steuerungsaufwand" icon={Network} description="Berücksichtigung des Einflusses auf Abstimmungs- und Steuerungsaufwand." />
      <CardContent className="space-y-6">
        <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
          <p className="mb-2 font-medium">Standard RASCI Mapping für S/4HANA Public Cloud:</p>
          <ul className="list-disc list-inside space-y-1 mb-4">
            <li><strong>R</strong>esponsible (Durchführung)</li>
            <li><strong>A</strong>ccountable (Verantwortung)</li>
            <li><strong>S</strong>upport (Unterstützung)</li>
            <li><strong>C</strong>onsulted (Konsultiert)</li>
            <li><strong>I</strong>nformed (Informiert)</li>
          </ul>
          <p>
            Der Steuerungsaufwand skaliert je nach Rolle im Gesamtprojekt. 
            <strong> niedrig (I), mittel (C,S), hoch (A,R)</strong>. Dieser Faktor wird im Projektmanagement-FTE-Bedarf abgebildet.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white ring-1 ring-slate-200/60 rounded-xl">
          <div className="flex flex-col">
            <h4 className="text-sm font-semibold text-slate-900">Steuerungsaufwand anpassen</h4>
            <p className="text-xs text-slate-500 mt-1">Beeinflusst den generellen Steuerungsaufwand der Berater (-10% bis +10%)</p>
          </div>
          <div className="flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100 mt-4 sm:mt-0">
            <Label className="text-sm font-semibold text-indigo-900 whitespace-nowrap mb-0">Steuerungsaufwand:</Label>
            <input 
              type="range" 
              min="-10" max="10" step="10" 
              value={steeringFactor} 
              onChange={e => handleUpdate(parseInt(e.target.value))}
              className="w-32 accent-indigo-600"
            />
            <span className="text-sm font-bold text-indigo-700 min-w-[3.5rem] text-right">
              {steeringFactor > 0 ? '+' : ''}{steeringFactor}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
