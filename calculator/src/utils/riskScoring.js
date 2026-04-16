import { getAcclimatizationDays } from './altitudeCalcs.js';

/**
 * AMS (Acute Mountain Sickness) risk scoring
 * Returns { score, risk: 'low'|'moderate'|'high', factors: string[], warnings: string[] }
 */
export const calculateAMSRisk = ({
  homeElevationFt = 0,
  targetElevationFt,
  daysAvailable = 0,
  priorAMSSymptoms = [],
  spo2 = null,
  periodizationPhase = null,
  overnightAtAltitude = 'unsure',
  altitudeExperience = 'occasionally',
}) => {
  let score = 0;
  const factors = [];

  // Elevation delta scoring
  const delta = targetElevationFt - homeElevationFt;
  if (delta >= 4000) {
    score += 2;
    factors.push(`Large elevation gain of ${Math.round(delta).toLocaleString()} ft`);
  } else if (delta >= 1500) {
    score += 1;
    factors.push(`Elevation gain of ${Math.round(delta).toLocaleString()} ft`);
  }

  // Acclimatization time check
  // Research: 7-10 days = optimal. 2-6 days = danger zone (acute phase, peak impairment).
  // ≤1 day before = acceptable fallback (pre-acute phase, limited exposure).
  const rec = getAcclimatizationDays(targetElevationFt);
  if (rec.min > 0) {
    if (daysAvailable >= 2 && daysAvailable <= 6) {
      score += 2;
      factors.push('Arriving in the 2–6 day danger zone — peak performance impairment and AMS risk');
    } else if (daysAvailable >= rec.min) {
      // Optimal window: 7+ days — reduce score slightly
      score = Math.max(0, score - 1);
    }
    // ≤1 day: no penalty — pre-acute phase is better than the danger zone
  }

  // Prior AMS symptoms (max +2)
  const relevant = (priorAMSSymptoms || []).filter(s => s !== 'none' && s !== 'never_been');
  const symScore = Math.min(2, relevant.length);
  score += symScore;
  if (symScore > 0) factors.push(`Prior altitude symptoms reported (${relevant.length})`);

  // SpO2 < 95% at rest
  if (spo2 !== null && spo2 < 95) {
    score += 1;
    factors.push('Resting SpO₂ below 95%');
  }

  // Recovery phase compounds fatigue
  if (periodizationPhase === 'recovery') {
    score += 1;
    factors.push('Currently in recovery — altitude stress compounds fatigue');
  }

  // Overnight at altitude
  if (overnightAtAltitude === 'yes') {
    score += 1;
    factors.push('Sleeping at activity altitude');
  } else if (overnightAtAltitude === 'no') {
    score = Math.max(0, score - 1);
  }

  // No altitude experience
  if (altitudeExperience === 'never') {
    score += 1;
    factors.push('No prior altitude experience');
  }

  score = Math.max(0, score);
  const risk = score <= 1 ? 'low' : score <= 3 ? 'moderate' : 'high';

  const warnings = {
    low: ['Monitor for mild headache on first day', 'Stay well hydrated', 'Avoid alcohol for first 24 hours'],
    moderate: ['Acclimatize before hard effort — easy movement first 24–48 hours', 'Monitor SpO₂ if possible', 'Descend immediately if headache worsens or nausea develops'],
    high: ['Seek medical clearance before this event', 'Carry emergency descent plan', 'Never ascend with AMS symptoms — descend immediately if any appear'],
  }[risk];

  return { score, risk, factors: factors.slice(0, 3), warnings };
};
