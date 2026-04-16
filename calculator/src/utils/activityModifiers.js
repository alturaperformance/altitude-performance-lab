/**
 * Activity-specific performance modifiers and pacing adjustments
 * Returns sport-specific context and pacing advice
 */

export const ACTIVITIES = [
  { id: 'skiing',    label: 'Skiing',          icon: '⛷️',  subTypes: ['Alpine skiing', 'Backcountry / touring'] },
  { id: 'hiking',    label: 'Hiking',           icon: '🥾',  subTypes: ['Day hike', 'Multi-day / backpacking'] },
  { id: 'running',   label: 'Running',          icon: '🏃',  subTypes: ['Trail running', 'Summit attempt', 'Mountain race'] },
  { id: 'mtb',       label: 'Mountain Biking',  icon: '🚵',  subTypes: ['Cross-country (XC)', 'Enduro', 'Bikepacking'] },
  { id: 'road',      label: 'Road Cycling',     icon: '🚴',  subTypes: ['Gran fondo', 'Stage race', 'Recreational'] },
];

/**
 * VO2 max dependency of each sport
 * Running and road cycling are most aerobically dependent
 */
export const vo2DependencyFactor = {
  skiing: 0.75,
  hiking: 0.55,
  running: 1.0,
  mtb: 0.90,
  road: 0.95,
};

/**
 * Generate activity-specific pacing advice
 */
export const getPacingAdvice = ({ activity, subType, intensity, vo2ReductionPct, hrIncreasePct, ltPaceAtAltitude }) => {
  const reduction = (vo2ReductionPct * vo2DependencyFactor[activity]).toFixed(1);
  const hrNote = hrIncreasePct > 0 ? ` — expect HR to run ${Math.round(hrIncreasePct)}% higher` : '';

  const base = {
    skiing: `Reduce hard charge efforts by ~${reduction}%. Legs will fatigue faster in thin air — shorter burst intervals between recovery breaks${hrNote}.`,
    hiking: `Slow trail pace by ~${reduction}%. Use a rhythm breathing technique: 2 steps per breath at moderate elevation, 1 step per breath above 12,000 ft${hrNote}.`,
    running: ltPaceAtAltitude
      ? `Your altitude-adjusted threshold pace is ${ltPaceAtAltitude} — use this as your ceiling for hard efforts${hrNote}.`
      : `Slow pace by ~${reduction}% relative to sea-level race pace. Start conservatively — altitude effects compound with race effort${hrNote}.`,
    mtb: `Reduce power output by ~${reduction}%. Climbs will feel significantly harder — shift earlier and spin at higher cadence rather than grinding${hrNote}.`,
    road: `Reduce pace or power by ~${reduction}%. On climbs, sit and spin rather than stand and grind — standing increases O2 demand by 12–18%${hrNote}.`,
  }[activity] || `Reduce effort by ~${reduction}%${hrNote}.`;

  if (intensity === 'race') {
    return `Race effort: ${base} At race effort, cognitive performance also drops — practice your nutrition and pacing plan at target elevation before race day.`;
  }
  return base;
};

/**
 * Day-of checklist items (activity-specific + universal)
 */
export const getDayOfChecklist = ({ activity, targetElevationFt, overnightAtAltitude }) => {
  const universal = [
    'Start hydrating the night before — aim for pale yellow urine on event morning',
    'Eat a carbohydrate-rich meal 2–3 hours before start',
    'Warm up longer than you would at sea level (10–15 min easy movement)',
    'Start easier than you think necessary — first 20 minutes is the riskiest for overexertion',
    'Note any headache, nausea, or unusual shortness of breath at the start',
    'Know the descent route before you leave the trailhead or start line',
  ];

  const activitySpecific = {
    skiing: ['Check helmet and goggle fit — cold makes equipment less pliable', 'Bring electrolyte snacks — cold air blunts thirst signals'],
    hiking: ['Carry more water than planned — high alpine springs may not be reliable', 'Layer for temperature swing — altitude temperature drops 3–5°F per 1,000 ft'],
    running: ['Pin race bib with extra pins — altitude starts often have cold, windy corrals', 'Use HR cap: reduce target HR by 5–8 bpm vs. sea-level races for first half'],
    mtb: ['Check tire pressure — altitude and cold affect PSI; check morning of', 'Carry a tube and pump — help is farther away on mountain trails'],
    road: ['Sunscreen is not optional — UV increases ~10% per 1,000 m', 'Sip every 15 minutes rather than waiting for thirst'],
  }[activity] || [];

  const altitudeSpecific = targetElevationFt >= 12000
    ? ['Carry emergency shelter and first aid kit regardless of trip length']
    : [];

  return [...universal, ...activitySpecific, ...altitudeSpecific];
};
