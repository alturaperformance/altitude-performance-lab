import { useState, useMemo } from 'react';
import './App.css';

import ActivitySelector from './components/ActivitySelector.jsx';
import ProfileSetup from './components/ProfileSetup.jsx';
import RouteSelector from './components/RouteSelector.jsx';
import SimpleRoute from './components/SimpleRoute.jsx';
import AdvancedRoute from './components/AdvancedRoute.jsx';
import Dashboard from './components/Dashboard.jsx';
import UnitToggle from './components/UnitToggle.jsx';

import {
  calcO2Pct,
  calcVO2Reduction,
  calcHRIncreasePct,
  calcAcclimDays,
  calcHydrationOz,
  calcFTPAtAltitude,
  calcLTPaceAtAltitude,
  estimateVO2Max,
  mToFt,
  kgToLbs,
  fitnessMultipliers,
  getPopulationVO2Max,
} from './utils/altitudeCalcs.js';

import { calculateAMSRisk } from './utils/riskScoring.js';
import {
  getPacingAdvice,
  getDayOfChecklist,
} from './utils/activityModifiers.js';

const PHASES = ['Activity', 'Profile', 'Details', 'Results'];

function phaseToStep(phase) {
  if (phase === 0) return 0;
  if (phase === 1) return 1;
  if (phase === 2) return 2;
  return 3;
}

export default function App() {
  const [units, setUnits] = useState('imperial');
  const [phase, setPhase] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [path, setPath] = useState(null);

  const [activityData, setActivityData] = useState({
    activity: '', subtype: '', duration: '', intensity: '', overnightAtAltitude: '',
  });

  const [profileData, setProfileData] = useState({
    homeElevation: '', targetElevation: '', eventDate: '',
    trainingDaysAboveHome: '', altitudeExperience: '',
  });

  const [routeData, setRouteData] = useState({});

  const step = phaseToStep(phase);

  const calc = useMemo(() => {
    if (phase < 4) return null;

    const targetFt = units === 'imperial'
      ? parseFloat(profileData.targetElevation) || 0
      : mToFt(parseFloat(profileData.targetElevation) || 0);

    const homeFt = units === 'imperial'
      ? parseFloat(profileData.homeElevation) || 0
      : mToFt(parseFloat(profileData.homeElevation) || 0);

    const vo2Reduction = calcVO2Reduction(targetFt);
    const o2Pct = calcO2Pct(Math.max(0, targetFt));
    const homeO2Pct = calcO2Pct(Math.max(0, homeFt));
    const hrIncreasePct = calcHRIncreasePct(Math.max(0, targetFt));
    const acclimDays = calcAcclimDays(Math.max(0, targetFt));

    const weightLbs = routeData.weight
      ? (units === 'imperial' ? parseFloat(routeData.weight) : kgToLbs(parseFloat(routeData.weight)))
      : 154;

    const hydrationOz = calcHydrationOz(weightLbs, Math.max(0, targetFt), false);

    const ftpAtAltitude = routeData.ftp
      ? calcFTPAtAltitude(parseFloat(routeData.ftp), targetFt)
      : null;

    let ltPaceAtAltitude = null;
    if (routeData.ltPace) {
      const raw = routeData.ltPace.toString().trim();
      let minPerMile;
      if (raw.includes(':')) {
        const parts = raw.split(':');
        minPerMile = parseInt(parts[0]) + parseInt(parts[1] || 0) / 60;
      } else {
        minPerMile = parseFloat(raw);
      }
      if (!isNaN(minPerMile)) {
        ltPaceAtAltitude = calcLTPaceAtAltitude(minPerMile, targetFt);
      }
    }

    let vo2Max = routeData.vo2Max ? parseFloat(routeData.vo2Max) : null;
    if (!vo2Max && routeData.hrMax && routeData.hrRest) {
      vo2Max = estimateVO2Max(parseFloat(routeData.hrMax), parseFloat(routeData.hrRest));
    }
    if (!vo2Max && routeData.age && path === 'simple') {
      const baseVO2 = getPopulationVO2Max(parseInt(routeData.age), routeData.sex || 'male');
      const mult = fitnessMultipliers[routeData.fitnessLevel] || 1.0;
      vo2Max = baseVO2 * mult;
    }

    const vo2MaxAtAltitude = vo2Max ? vo2Max * (1 - vo2Reduction / 100) : null;

    const baseHR = routeData.hrMax ? parseFloat(routeData.hrMax) : 185;
    const hrAdjFactor = 1 + hrIncreasePct / 100;
    const hrZones = [
      { zone: 'Z1', name: 'Recovery',  range: `<${Math.round(baseHR * 0.60 * hrAdjFactor)} bpm`,                                                           rpeNote: 'Very easy — will feel easier than expected' },
      { zone: 'Z2', name: 'Endurance', range: `${Math.round(baseHR * 0.60 * hrAdjFactor)}–${Math.round(baseHR * 0.70 * hrAdjFactor)} bpm`,                 rpeNote: 'Easy — will feel moderate' },
      { zone: 'Z3', name: 'Tempo',     range: `${Math.round(baseHR * 0.70 * hrAdjFactor)}–${Math.round(baseHR * 0.80 * hrAdjFactor)} bpm`,                 rpeNote: 'Moderate — will feel hard' },
      { zone: 'Z4', name: 'Threshold', range: `${Math.round(baseHR * 0.80 * hrAdjFactor)}–${Math.round(baseHR * 0.90 * hrAdjFactor)} bpm`,                 rpeNote: 'Hard — will feel very hard' },
      { zone: 'Z5', name: 'VO2 Max',   range: `>${Math.round(baseHR * 0.90 * hrAdjFactor)} bpm`,                                                           rpeNote: 'Max — use sparingly, higher fatigue' },
    ];

    const today = new Date();
    const eventDate = profileData.eventDate ? new Date(profileData.eventDate) : null;
    const daysUntilEvent = eventDate ? Math.floor((eventDate - today) / (1000 * 60 * 60 * 24)) : null;
    const weeksUntilEvent = daysUntilEvent !== null ? Math.floor(daysUntilEvent / 7) : null;
    const hasAcclim = typeof acclimDays === 'object' && acclimDays !== null && acclimDays.min > 0;

    const timeline = [];
    if (weeksUntilEvent === null || weeksUntilEvent >= 4) {
      timeline.push({ period: 'Now – 4 weeks out', focus: 'Preparation', actions: 'Maintain fitness, begin iron-rich nutrition focus, research event location and nearest medical facilities.' });
    }
    if (weeksUntilEvent === null || weeksUntilEvent >= 2) {
      timeline.push({ period: '2–3 weeks out', focus: 'Pre-altitude training', actions: 'Peak training volume complete, begin tapering if applicable. Prioritize sleep quality.' });
    }
    if (hasAcclim) {
      timeline.push({
        period: `Arrive ${acclimDays.min}–${acclimDays.max} days early`,
        focus: 'Optimal Acclimatization',
        actions: `Research consistently shows 7–10+ days at altitude produces the best performance outcomes. By day 7 the acute stress phase has passed, EPO response is underway, and ventilation has adapted. Easy activity only the first 2–3 days; gradual intensity increase after day 4.`,
      });
      timeline.push({
        period: 'Avoid: 2–6 days before',
        focus: '⚠ Danger Zone',
        actions: `Days 2–6 represent peak acute altitude stress — plasma volume drops, VO2 max is maximally impaired, and AMS symptoms are most likely. If you cannot arrive ${acclimDays.min}+ days early, arrive ≤24 hours before instead. Arriving the day before is significantly better than arriving 3–5 days out.`,
      });
    }
    timeline.push({ period: 'Event day', focus: 'Execute', actions: 'Start slower than home pace, use HR not pace as your guide, know descent criteria before you leave.' });
    timeline.push({ period: 'Post-event', focus: 'Recovery', actions: 'Altitude stress compounds with event fatigue — prioritize sleep, rehydration, and carbohydrate refueling within 45 minutes.' });

    const ltPaceStr = ltPaceAtAltitude
      ? `${Math.floor(ltPaceAtAltitude)}:${String(Math.round((ltPaceAtAltitude % 1) * 60)).padStart(2, '0')} min/mi`
      : null;

    const pacingAdvice = getPacingAdvice({
      activity: activityData.activity,
      subType: activityData.subtype,
      intensity: activityData.intensity === 'Race Effort' ? 'race' : (activityData.intensity || '').toLowerCase(),
      vo2ReductionPct: vo2Reduction,
      hrIncreasePct,
      ltPaceAtAltitude: ltPaceStr,
    });

    const checklist = getDayOfChecklist({
      activity: activityData.activity,
      targetElevationFt: targetFt,
      overnightAtAltitude: activityData.overnightAtAltitude,
    });

    return {
      targetFt,
      vo2ReductionPct: vo2Reduction,
      o2Pct,
      homeO2Pct,
      hrIncreasePct,
      acclimDays,
      hydrationOz,
      ftpAtAltitude,
      ltPaceAtAltitude,
      vo2Max,
      vo2MaxAtAltitude,
      hrZones,
      timeline,
      pacingAdvice,
      checklist,
      daysAvailable: daysUntilEvent,
    };
  }, [phase, profileData, routeData, activityData, units, path]);

  const risk = useMemo(() => {
    if (phase < 4 || !calc) return null;

    const targetFt = calc.targetFt;
    const homeFt = units === 'imperial'
      ? parseFloat(profileData.homeElevation) || 0
      : mToFt(parseFloat(profileData.homeElevation) || 0);

    const result = calculateAMSRisk({
      homeElevationFt: homeFt,
      targetElevationFt: targetFt,
      daysAvailable: calc.daysAvailable || 0,
      priorAMSSymptoms: routeData.priorAMSSymptoms || [],
      spo2: routeData.spo2 ? parseFloat(routeData.spo2) : null,
      periodizationPhase: routeData.periodizationPhase || null,
      overnightAtAltitude: activityData.overnightAtAltitude || 'unsure',
      altitudeExperience: profileData.altitudeExperience || 'occasionally',
    });

    return { ...result, level: result.risk.charAt(0).toUpperCase() + result.risk.slice(1) };
  }, [calc, phase, profileData, routeData, activityData, units]);

  const handleSetUnits = (newUnit) => {
    if (newUnit === units) return;

    // Convert stored elevation values so the same number isn't re-interpreted as a different unit
    const convertElev = (val) => {
      const num = parseFloat(val);
      if (!val || isNaN(num)) return val;
      return newUnit === 'metric'
        ? String(Math.round(num * 0.3048))   // ft → m
        : String(Math.round(num / 0.3048));  // m → ft
    };

    setProfileData(prev => ({
      ...prev,
      homeElevation: convertElev(prev.homeElevation),
      targetElevation: convertElev(prev.targetElevation),
    }));

    // Convert weight if entered
    const w = parseFloat(routeData.weight);
    if (routeData.weight && !isNaN(w)) {
      setRouteData(prev => ({
        ...prev,
        weight: newUnit === 'metric'
          ? String(+(w * 0.453592).toFixed(1))  // lbs → kg
          : String(Math.round(w / 0.453592)),    // kg → lbs
      }));
    }

    setUnits(newUnit);
  };

  const goNext = () => setPhase(p => p + 1);
  const goBack = () => setPhase(p => p - 1);

  const handleRouteSelect = (selectedPath) => {
    setPath(selectedPath);
    setPhase(3);
  };

  const handleRouteNext = () => setPhase(4);

  const handleRestart = () => {
    setPhase(0);
    setPath(null);
    setActivityData({ activity: '', subtype: '', duration: '', intensity: '', overnightAtAltitude: '' });
    setProfileData({ homeElevation: '', targetElevation: '', eventDate: '', trainingDaysAboveHome: '', altitudeExperience: '' });
    setRouteData({});
  };

  const BASE = '/';

  return (
    <>
      <nav className="site-nav" role="navigation" aria-label="Main navigation">
        <div className="site-nav__inner">
          <a href={`${BASE}index.html`} className="site-nav__logo" aria-label="Altitude Performance Lab home">
            <div className="site-nav__logo-mark">APL</div>
            <span className="site-nav__logo-text">Altitude<span>Performance</span>Lab</span>
          </a>
          <ul className="site-nav__links">
            <li><a href={`${BASE}index.html`}>Home</a></li>
            <li><a href={`${BASE}performance.html`}>Performance</a></li>
            <li><a href={`${BASE}nutrition.html`}>Nutrition</a></li>
            <li><a href={`${BASE}resources.html`}>Resources</a></li>
          </ul>
          <div className="site-nav__right">
            <UnitToggle units={units} setUnits={handleSetUnits} />
          </div>
          <button
            className={`site-nav__hamburger${mobileNavOpen ? ' open' : ''}`}
            onClick={() => setMobileNavOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      <div className={`site-nav__mobile${mobileNavOpen ? ' open' : ''}`}>
        <a href={`${BASE}index.html`} onClick={() => setMobileNavOpen(false)}>Home</a>
        <a href={`${BASE}performance.html`} onClick={() => setMobileNavOpen(false)}>Performance</a>
        <a href={`${BASE}nutrition.html`} onClick={() => setMobileNavOpen(false)}>Nutrition</a>
        <a href={`${BASE}resources.html`} onClick={() => setMobileNavOpen(false)}>Resources</a>
        <div style={{ padding: '8px 0' }}><UnitToggle units={units} setUnits={handleSetUnits} /></div>
      </div>

    <div className="app">

      {phase < 4 && (
        <div className="progress-wrap">
          <div className="progress-bar">
            {PHASES.map((_, i) => (
              <div
                key={i}
                className={`progress-step${i < step ? ' done' : i === step ? ' active' : ''}`}
              />
            ))}
          </div>
          <div className="progress-labels">
            {PHASES.map((label, i) => (
              <span
                key={i}
                style={{
                  color: i === step ? 'var(--accent)' : i < step ? 'var(--success)' : undefined,
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {phase === 0 && (
        <ActivitySelector
          data={activityData}
          onChange={setActivityData}
          onNext={goNext}
          units={units}
        />
      )}

      {phase === 1 && (
        <ProfileSetup
          data={profileData}
          onChange={setProfileData}
          onNext={goNext}
          onBack={goBack}
          units={units}
        />
      )}

      {phase === 2 && (
        <RouteSelector
          onSelect={handleRouteSelect}
          onBack={goBack}
        />
      )}

      {phase === 3 && path === 'simple' && (
        <SimpleRoute
          data={routeData}
          onChange={setRouteData}
          onNext={handleRouteNext}
          onBack={() => setPhase(2)}
        />
      )}

      {phase === 3 && path === 'advanced' && (
        <AdvancedRoute
          data={routeData}
          onChange={setRouteData}
          onNext={handleRouteNext}
          onBack={() => setPhase(2)}
          activity={activityData.activity}
          units={units}
        />
      )}

      {phase === 4 && calc && risk && (
        <Dashboard
          calc={calc}
          risk={risk}
          activityData={activityData}
          profileData={profileData}
          routeData={routeData}
          units={units}
          onRestart={handleRestart}
        />
      )}
    </div>
    </>
  );
}
