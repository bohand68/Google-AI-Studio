import { useMemo } from 'react';
import { useAppContext } from '../store';
import { PHASES } from '../constants';
import { Phase } from '../types';

export function useProjectCalculation() {
  const { state } = useAppContext();
  const { projectDuration: d, scopeItems: s, dataMigration: dm, integrations: int, forms: fm, teamAndCosts: tc } = state;

  return useMemo(() => {
    let sLow = 0, sMedium = 0, sHigh = 0, sVeryHigh = 0;
    Object.values(s.items).forEach(item => {
      sLow += item.low || 0;
      sMedium += item.medium || 0;
      sHigh += item.high || 0;
      sVeryHigh += item.veryHigh || 0;
    });

    const getGenericPhaseDays = (mod: any, phase: string) => {
      let pDays = 0;
      Object.keys(mod.inputs).forEach(type => {
        const inp = mod.inputs[type];
        const setup = mod.setup[type];
        if (setup) {
           const tDays = (inp.low * setup.Low) + (inp.medium * setup.Medium) + (inp.high * setup.High);
           const dist = mod.distribution[type] || {};
           pDays += tDays * ((dist[phase as Phase] || 0) / 100);
        }
      });
      return pDays;
    };

    const pmPersons = tc.pmPersons ?? 1;
    const pmDaysPerWeek = tc.pmDaysPerWeek ?? 0.125;
    const meetingPersons = tc.meetingPersons ?? 1;
    const meetingDaysPerWeek = tc.meetingDaysPerWeek ?? 0.125;

    let overallBaseDays = 0;
    let overallPmDays = 0;
    let overallMeetingDays = 0;

    let currentStart = 0;

    const phaseData = PHASES.filter(p => !(p === 'Discover' && (d.phaseDistributions[p] || 0) === 0)).map(phase => {
        const isRun = phase === 'Run+Hypercare';
        const wks = isRun ? d.runHypercareWeeks : d.netWeeks * ((d.phaseDistributions[phase] || 0) / 100);
        
        const matrix = s.complexityMatrix[phase as Phase];
        const scopeDays = isRun ? 0 : (matrix ? 
          (sLow * matrix.Low) + (sMedium * matrix.Medium) + (sHigh * matrix.High) + (sVeryHigh * matrix['Very High']) 
          : 0);

        const dmDays = isRun ? 0 : getGenericPhaseDays(dm, phase);
        const intDays = isRun ? 0 : getGenericPhaseDays(int, phase);
        const fMDays = isRun ? 0 : getGenericPhaseDays(fm, phase);

        const baseDays = scopeDays + dmDays + intDays + fMDays;
        const pmDays = isRun ? 0 : pmPersons * wks * pmDaysPerWeek;
        const meetingDays = isRun ? 0 : meetingPersons * wks * meetingDaysPerWeek;

        overallBaseDays += baseDays;
        overallPmDays += pmDays;
        overallMeetingDays += meetingDays;

        const start = currentStart;
        const end = currentStart + wks;
        currentStart = end;

        return { phase, weeks: wks, baseDays, pmDays, meetingDays, start, end };
    });

    const roles = Object.keys(tc.dailyRates);
    
    const complexityFactor = tc.complexityFactor || 0;
    const steeringFactor = tc.steeringFactor || 0;
    const multiplier = 1 + ((complexityFactor + steeringFactor) / 100);

    // Compute total calculated days per role first to handle overrides properly
    const computedRoleTotalDays: Record<string, number> = {};
    roles.forEach(code => {
       let rDays = overallBaseDays * ((tc.rolePercent[code] || 0) / 100);
       if (code === 'PL-BPC') rDays += overallPmDays;
       if (code === 'SC-BPC') rDays += overallMeetingDays * 0.5;
       if (code === 'C-BPC') rDays += overallMeetingDays * 0.5;
       computedRoleTotalDays[code] = rDays * multiplier;
    });

    // Phase arrays per role
    const roleTable = roles.map(code => {
        const rate = tc.dailyRates[code] || 0;
        let totalBT = 0;
        let totalEuro = 0;
        
        const phaseCols = phaseData.map(pData => {
           let days = 0;
           const isRun = pData.phase === 'Run+Hypercare';

           if (isRun) {
               days = tc.runHypercareDays?.[code] || 0;
           } else {
               days = pData.baseDays * ((tc.rolePercent[code] || 0) / 100);
               if (code === 'PL-BPC') days += pData.pmDays;
               if (code === 'SC-BPC') days += pData.meetingDays * 0.5;
               if (code === 'C-BPC') days += pData.meetingDays * 0.5;

               days = days * multiplier;

               const override = tc.roleDaysOverride[code];
               if (override !== undefined && override !== null && computedRoleTotalDays[code] > 0) {
                  const targetNonRunDays = (override as number) - (tc.runHypercareDays?.[code] || 0);
                  days = targetNonRunDays * (days / computedRoleTotalDays[code]);
               } else if (override !== undefined && override !== null && computedRoleTotalDays[code] === 0) {
                  const targetNonRunDays = (override as number) - (tc.runHypercareDays?.[code] || 0);
                  const allNonRunPhases = phaseData.filter(p => p.phase !== 'Run+Hypercare');
                  const totalWeeks = allNonRunPhases.reduce((acc, p) => acc + p.weeks, 0);
                  if (totalWeeks > 0) {
                     days = targetNonRunDays * (pData.weeks / totalWeeks);
                  } else {
                     days = targetNonRunDays / allNonRunPhases.length;
                  }
               }

           }

           const euro = days * rate;
           totalBT += days;
           totalEuro += euro;
           return { phase: pData.phase, bt: days, euro };
        });

        return { code, rate, phaseCols, totalBT, totalEuro };
    });

    // column sums
    const phaseTotals: Record<string, { bt: number, euro: number }> = {};
    phaseData.forEach(pData => {
       phaseTotals[pData.phase] = { bt: 0, euro: 0 };
    });
    let grandTotalBT = 0;
    let grandTotalEuro = 0;

    roleTable.forEach(row => {
       row.phaseCols.forEach(pCol => {
          phaseTotals[pCol.phase].bt += pCol.bt;
          phaseTotals[pCol.phase].euro += pCol.euro;
       });
       grandTotalBT += row.totalBT;
       grandTotalEuro += row.totalEuro;
    });

    return { phaseData, roleTable, phaseTotals, grandTotalBT, grandTotalEuro };
  }, [s, dm, int, fm, tc, d]);
}
