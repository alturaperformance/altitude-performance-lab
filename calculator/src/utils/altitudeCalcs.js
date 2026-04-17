// Named aliases used by App.jsx / spec
export function calcO2Pct(elevation_ft) {
  return 20.9 * Math.pow(1 - (elevation_ft / 145442), 5.256);
}
export function calcVO2Reduction(elevation_ft) {
  return Math.max(0, ((elevation_ft - 5000) / 1000) * 1.9);
}
export function calcHRIncreasePct(elevation_ft) {
  return (elevation_ft > 5000) ? Math.min(20, ((elevation_ft - 5000) / 1000) * 2) : 0;
}
export function calcAcclimDays(elevation_ft) {
  if (elevation_ft < 8000) return 0;
  if (elevation_ft < 12000) return { min: 7, max: 10 };
  if (elevation_ft < 14000) return { min: 10, max: 14 };
  return { min: 14, max: 21 };
}
export function calcHydrationOz(weight_lbs, elevation_ft, activityDay = false) {
  const base = 0.5 * weight_lbs;
  const altModifier = (elevation_ft / 5000) * 0.5 * weight_lbs;
  const actModifier = activityDay ? (base + altModifier) * 0.2 : 0;
  return base + altModifier + actModifier;
}
export function calcFTPAtAltitude(ftp_home, elevation_ft) {
  const reduction = calcVO2Reduction(elevation_ft) / 100;
  return ftp_home * (1 - reduction);
}
export function calcLTPaceAtAltitude(lt_pace_min_per_mile, elevation_ft) {
  const reduction = calcVO2Reduction(elevation_ft) / 100;
  return lt_pace_min_per_mile * (1 / (1 - reduction));
}

/**
 * O2 availability at elevation using barometric pressure formula
 * Sea level O2 = 20.9%. Returns percentage.
 */
export const getO2Availability = (elevationFt) =>
  20.9 * Math.pow(1 - elevationFt / 145442, 5.256);

/**
 * VO2 max reduction above 5,000 ft
 * Approximately 1.9% per 1,000 ft above 5,000 ft
 * Returns percentage reduction (0–100)
 */
export const getVO2Reduction = (elevationFt) =>
  Math.max(0, ((elevationFt - 5000) / 1000) * 1.9);

/**
 * Estimated VO2 max via Uth–Sørensen–Overgaard–Pedersen formula
 * vo2max ≈ 15 × HRmax / HRrest
 */
export const estimateVO2Max = (hrMax, hrRest) => 15 * (hrMax / hrRest);

/**
 * Population average VO2 max by age and sex
 * Used as fallback when biometric data not available
 * Returns ml/kg/min
 */
export const getPopulationVO2Max = (age, sex) => {
  const male = [
    { maxAge: 29, value: 44 }, { maxAge: 39, value: 42 },
    { maxAge: 49, value: 40 }, { maxAge: 59, value: 36 },
    { maxAge: 100, value: 30 },
  ];
  const female = [
    { maxAge: 29, value: 38 }, { maxAge: 39, value: 36 },
    { maxAge: 49, value: 34 }, { maxAge: 59, value: 30 },
    { maxAge: 100, value: 26 },
  ];
  const table = sex === 'male' ? male : female;
  const row = table.find(r => age <= r.maxAge) || table[table.length - 1];
  return row.value;
};

/**
 * Fitness level multiplier on VO2 max population estimate
 * Higher fitness = higher actual VO2 max
 */
export const fitnessMultipliers = {
  sedentary: 0.75,
  light: 0.90,
  moderate: 1.0,
  active: 1.20,
  elite: 1.45,
};

/**
 * HR increase at altitude
 * ~2% per 1,000 ft above 5,000 ft, capped at 20%
 * Returns percentage increase
 */
export const getHRIncreasePct = (elevationFt) =>
  elevationFt > 5000 ? Math.min(20, ((elevationFt - 5000) / 1000) * 2) : 0;

/**
 * Acclimatization days needed based on target elevation
 * Returns { min, max, note }
 */
export const getAcclimatizationDays = (elevationFt) => {
  if (elevationFt < 8000) return { min: 0, max: 0, note: 'No structured acclimatization needed' };
  if (elevationFt < 12000) return { min: 7, max: 10, note: 'Or arrive ≤1 day before if time-constrained — avoid the 2–6 day window' };
  if (elevationFt < 14000) return { min: 10, max: 14, note: 'Or arrive ≤1 day before if time-constrained — avoid the 2–6 day window' };
  return { min: 14, max: 21, note: 'Staged ascent recommended; rest every 2,000–3,000 ft of gain' };
};

/**
 * Hydration target at altitude
 * Base: 0.5 oz per lb bodyweight
 * Altitude modifier: +0.5 oz/lb per 5,000 ft above sea level
 * Activity day: +20%
 */
export const getHydrationTarget = (bodyWeightLbs, elevationFt, isActivityDay = false) => {
  const base = bodyWeightLbs * 0.5;
  const altMod = (elevationFt / 5000) * 0.5;
  const actMod = isActivityDay ? 0.2 : 0;
  const totalOz = base * (1 + altMod) * (1 + actMod);
  const multiplier = (1 + altMod);
  return {
    restOz: Math.round(base * (1 + altMod)),
    activityOz: Math.round(totalOz),
    liters: parseFloat((totalOz * 0.02957).toFixed(1)),
    multiplier: parseFloat(multiplier.toFixed(1)),
  };
};

/**
 * FTP adjusted for altitude VO2 reduction
 */
export const getFTPAtAltitude = (ftpHome, vo2ReductionPct) =>
  Math.round(ftpHome * (1 - vo2ReductionPct / 100));

/**
 * Lactate threshold pace adjusted for altitude
 * Pace (sec/mile) slows proportional to VO2 reduction
 */
export const getLTPaceAtAltitude = (ltPaceSecPerMile, vo2ReductionPct) =>
  ltPaceSecPerMile * (1 / (1 - vo2ReductionPct / 100));

/**
 * Format seconds/mile as M:SS string
 */
export const formatPace = (secPerMile) => {
  const m = Math.floor(secPerMile / 60);
  const s = Math.round(secPerMile % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

/**
 * Parse M:SS string to seconds
 */
export const parsePace = (str) => {
  const parts = str.split(':');
  if (parts.length !== 2) return null;
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
};

/** Unit conversions */
export const ftToM = (ft) => ft * 0.3048;
export const mToFt = (m) => m / 0.3048;
export const lbsToKg = (lbs) => lbs * 0.453592;
export const kgToLbs = (kg) => kg / 0.453592;
export const kmPaceToMiPace = (secPerKm) => secPerKm * 1.60934;
export const miPaceToKmPace = (secPerMi) => secPerMi / 1.60934;
