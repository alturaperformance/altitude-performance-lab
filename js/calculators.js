/* ============================================================
   ALTITUDE PERFORMANCE LAB — Calculator Engine
   Science sources:
     - Wehrlin & Hallen (2006): VO2max reduction at altitude
     - Chapman et al. (1992): Altitude and aerobic performance
     - ACSM altitude guidelines
     - Buskirk et al. altitude physiology research
   ============================================================ */

'use strict';

/* ============================================================
   ALTITUDE SCIENCE ENGINE (shared)
   ============================================================ */

const AltitudeScience = {

  FT_TO_M: 0.3048,

  ftToM(ft) { return ft * this.FT_TO_M; },

  /**
   * VO2 max reduction (%) at a given altitude in meters above sea level.
   * < 1,000m: ~0.5% per 1,000m
   * 1,000–5,500m: ~6.9% per 1,000m above 1,000m
   * > 5,500m: ~10% per 1,000m (extreme hypoxia)
   */
  getVO2MaxReductionAtAltitude(altitudeM) {
    if (altitudeM <= 0) return 0;
    if (altitudeM <= 1000) return (altitudeM / 1000) * 0.5;
    if (altitudeM <= 5500) return 0.5 + ((altitudeM - 1000) / 1000) * 6.9;
    return 0.5 + (4500 / 1000) * 6.9 + ((altitudeM - 5500) / 1000) * 10;
  },

  getNetVO2MaxReduction(targetAltM, homeAltM) {
    return Math.max(0,
      this.getVO2MaxReductionAtAltitude(targetAltM) -
      this.getVO2MaxReductionAtAltitude(homeAltM)
    );
  },

  sportMultipliers: {
    running: 1.00, cycling: 0.95, skiing: 0.88,
    hiking: 0.60, mountaineering: 0.72, general: 0.85,
  },

  fitnessAmplifiers: {
    recreational: 0.85, intermediate: 0.95, advanced: 1.00,
    competitive: 1.05, elite: 1.10,
  },

  getPerformanceImpact(netVO2MaxReduction, sport, fitnessLevel) {
    const sportMult   = this.sportMultipliers[sport]       ?? 0.85;
    const fitnessMult = this.fitnessAmplifiers[fitnessLevel] ?? 1.00;
    return netVO2MaxReduction * sportMult * fitnessMult;
  },

  getAcclimatizationTimeline(targetAltM) {
    if (targetAltM < 1000)  return { zone: 'Low Altitude',          zoneColor: 'success', initial: '< 1 day',     significant: 'Minimal needed',           full: 'No major acclimatization required',            notes: 'Performance impact at this elevation is negligible for most athletes.' };
    if (targetAltM < 2000)  return { zone: 'Low–Moderate Altitude', zoneColor: 'success', initial: '1–2 days',   significant: '1 week',                   full: '2–3 weeks',                                   notes: 'Most athletes notice mild effects. Breathing adjusts within days.' };
    if (targetAltM < 3000)  return { zone: 'Moderate Altitude',     zoneColor: 'warning', initial: '3–5 days',   significant: '2–3 weeks',                full: '4–6 weeks',                                   notes: 'Expect noticeable breathlessness during intensity. EPO response begins around day 4.' };
    if (targetAltM < 4000)  return { zone: 'High Altitude',         zoneColor: 'warning', initial: '5–10 days',  significant: '3–4 weeks',                full: '6–8 weeks',                                   notes: 'Risk of altitude sickness increases. Gradual ascent and rest days are critical.' };
    if (targetAltM < 5500)  return { zone: 'Very High Altitude',    zoneColor: 'danger',  initial: '10–14 days', significant: '4–6 weeks',                full: '8–12 weeks (if achievable)',                  notes: 'Acclimatization is slow and incomplete. Progressive altitude staging strongly recommended.' };
    return               { zone: 'Extreme Altitude',          zoneColor: 'danger',  initial: '14+ days',   significant: 'Partial — never complete', full: 'Full acclimatization not possible above 5,500m', notes: 'Deterioration continues despite acclimatization. Supplemental oxygen may be necessary.' };
  },

  getSportContext(sport, perfImpact) {
    const s = perfImpact.toFixed(1);
    switch (sport) {
      case 'running':        return `A ${perfImpact.toFixed(0)}% reduction means your sustainable pace will slow. A runner finishing a 10K in 45:00 at home elevation would finish in approximately ${this.adjustTime(45 * 60, perfImpact / 100)} at target altitude.`;
      case 'cycling':        return `Expect your FTP/threshold power to drop by approximately ${s}%. Heart rate will run higher at equivalent efforts — recalibrate training zones on arrival.`;
      case 'skiing':         return `Aerobic endurance on the mountain will be reduced by ~${s}%. Recovery between runs slows noticeably. Hydration becomes more critical due to cold, dry air.`;
      case 'hiking':         return `Trail pace will slow by approximately ${s}%. Rest intervals should be extended. Pole usage increases efficiency significantly at high altitude.`;
      case 'mountaineering': return `Summit attempts and high-camp work will be substantially harder. ${s}% performance reduction compounds with cold, pack weight, and technical terrain.`;
      default:               return `Expect a ~${s}% reduction in aerobic performance capacity. Keep intensity moderate during the first few days to allow initial adaptation.`;
    }
  },

  adjustTime(originalSeconds, factor) {
    const adjusted = Math.round(originalSeconds * (1 + factor));
    return `${Math.floor(adjusted / 60)}:${(adjusted % 60).toString().padStart(2, '0')}`;
  },

  calculate({ targetAltFt, homeAltFt, sport, fitnessLevel, unit }) {
    const targetAltM = unit === 'ft' ? this.ftToM(targetAltFt) : targetAltFt;
    const homeAltM   = unit === 'ft' ? this.ftToM(homeAltFt)   : homeAltFt;
    const netVO2Reduction = this.getNetVO2MaxReduction(targetAltM, homeAltM);
    const perfImpact      = this.getPerformanceImpact(netVO2Reduction, sport, fitnessLevel);
    return {
      targetAltM, homeAltM,
      netVO2Reduction:  +netVO2Reduction.toFixed(1),
      perfImpact:       +perfImpact.toFixed(1),
      acclimatization:  this.getAcclimatizationTimeline(targetAltM),
      sportContext:     this.getSportContext(sport, perfImpact),
      targetAltDisplay: unit === 'ft' ? `${Math.round(targetAltFt).toLocaleString()} ft` : `${Math.round(targetAltM).toLocaleString()} m`,
      homeAltDisplay:   unit === 'ft' ? `${Math.round(homeAltFt).toLocaleString()} ft`   : `${Math.round(homeAltM).toLocaleString()} m`,
    };
  },
};


/* ============================================================
   ACCLIMATIZATION PLANNER ENGINE
   ============================================================ */

const AcclimatizationScience = {

  plan({ targetAltFt, homeAltFt, daysAvailable, unit }) {
    const targetAltM = unit === 'ft' ? AltitudeScience.ftToM(targetAltFt) : targetAltFt;
    const homeAltM   = unit === 'ft' ? AltitudeScience.ftToM(homeAltFt)   : homeAltFt;
    const vo2Reduction = AltitudeScience.getNetVO2MaxReduction(targetAltM, homeAltM);
    const zone = AltitudeScience.getAcclimatizationTimeline(targetAltM);
    const days = parseInt(daysAvailable, 10);

    let strategy;
    if      (days <= 2)  strategy = 'arrive-late';
    else if (days <= 6)  strategy = 'danger-zone';
    else if (days <= 14) strategy = 'moderate';
    else                 strategy = 'full';

    return {
      targetAltM,
      targetAltDisplay: unit === 'ft' ? `${Math.round(targetAltFt).toLocaleString()} ft` : `${Math.round(targetAltM).toLocaleString()} m`,
      zone,
      daysAvailable: days,
      strategy,
      vo2Reduction: +vo2Reduction.toFixed(1),
      phases:        this.getPhases(targetAltM, days),
      advice:        this.getAdvice(strategy, days),
    };
  },

  getPhases(altM, days) {
    const all = [
      { day: 'Day 1–2',   title: 'Arrival & Initial Response',  color: 'warning', desc: 'Hyperventilation, possible headache, disrupted sleep. Keep effort minimal — walking only. Hydrate aggressively and prioritize rest.' },
      { day: 'Day 3–5',   title: 'Adaptation Trough',           color: 'danger',  desc: 'Plasma volume drops, reducing hemoglobin temporarily. Energy is lowest here. Avoid all high-intensity training. This phase passes.' },
      { day: 'Day 4–7',   title: 'EPO Response Begins',         color: 'warning', desc: 'Erythropoietin production increases, initiating red blood cell production. Light aerobic training is now appropriate.' },
      { day: 'Week 2',    title: 'Respiratory Adaptation',      color: 'accent',  desc: 'Breathing efficiency improves significantly. Performance begins recovering. Resume structured training at 70–80% of normal intensity.' },
      { day: 'Week 3–4',  title: 'Hematological Adaptation',   color: 'success', desc: 'Red blood cell mass increasing meaningfully. Return to full training volume. Performance approaches altitude-adjusted baseline.' },
      { day: 'Week 5–8',  title: 'Full Acclimatization',        color: 'success', desc: 'Near-complete adaptation for this altitude. Performance within 2–3% of home-level ceiling (altitude-adjusted).' },
    ];

    if (altM < 2500)  return all.slice(0, 3);
    if (days <= 7)    return all.slice(0, 3);
    if (days <= 14)   return all.slice(0, 4);
    return all;
  },

  getAdvice(strategy, days) {
    switch (strategy) {
      case 'arrive-late': return {
        title:       'Arrive & Compete Strategy',
        badge:       'Optimal for Short Trips',
        badgeColor:  'success',
        points: [
          'Arrive within 24–36 hours of your event — the body hasn\'t begun major adaptation yet',
          'Acute hypoxia is manageable; performance is ~5–8% below home level (vs. 10–15% at day 3)',
          'Avoid any high-intensity effort in the 24 hrs before — easy movement only',
          'Hydrate aggressively from the moment you land — double your normal intake',
          'Sleep as much as possible — altitude disrupts sleep architecture for 2–3 nights',
        ],
      };
      case 'danger-zone': return {
        title:       'Navigating the Adaptation Trough',
        badge:       'Challenging Window',
        badgeColor:  'danger',
        points: [
          'Days 3–6 are the hardest: plasma volume has dropped but red blood cells haven\'t recovered',
          'Performance will feel worse than arrival day — this is normal and temporary',
          'If competing, reduce expectations 10–15% and start conservatively',
          'Focus entirely on recovery: easy movement, sleep, hydration, iron-rich foods',
          'Performance recovers significantly by day 8–10 — push through with patience',
        ],
      };
      case 'moderate': return {
        title:       '1–2 Week Acclimatization Block',
        badge:       'Good Window',
        badgeColor:  'warning',
        points: [
          'Days 1–3: Easy aerobic only. No intervals or threshold work.',
          'Days 4–7: Resume moderate intensity. HR will run 5–10 bpm higher — train by HR, not pace/power',
          'Week 2: Introduce threshold sessions. Performance approaching 90–95% of altitude-adjusted baseline',
          'Reduce weekly training volume by 25–30% in week 1, then restore to normal in week 2',
          'Prioritize iron-rich foods and increase daily water intake by 30–50%',
        ],
      };
      default: return {
        title:       'Full Acclimatization Protocol (4+ Weeks)',
        badge:       'Optimal Protocol',
        badgeColor:  'accent',
        points: [
          'Weeks 1–2 (Foundation): Easy aerobic work only. Volume reduced by 30%. Prioritize sleep.',
          'Weeks 2–3 (Build): Introduce structured intensity. Monitor HR — adjust zones down initially.',
          'Weeks 3–4 (Performance): Full training volume. EPO response now driving RBC production.',
          'Week 4+ (Peak): Near sea-level performance achievable — this is your peak training window.',
          'Schedule key workouts and races in weeks 3–4 for optimal physiological readiness.',
        ],
      };
    }
  },
};


/* ============================================================
   TRAINING ZONE CALCULATOR ENGINE
   ============================================================ */

const TrainingZoneScience = {

  fmtPace(seconds) {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}/mi`;
  },

  calculate({ targetAltFt, homeAltFt, sport, metricType, metricValue, fitnessLevel, unit }) {
    const targetAltM = unit === 'ft' ? AltitudeScience.ftToM(targetAltFt) : targetAltFt;
    const homeAltM   = unit === 'ft' ? AltitudeScience.ftToM(homeAltFt)   : homeAltFt;
    const netVO2     = AltitudeScience.getNetVO2MaxReduction(targetAltM, homeAltM);
    const perfImpact = AltitudeScience.getPerformanceImpact(netVO2, sport, fitnessLevel);
    const perfFactor = 1 - (perfImpact / 100);

    // HR drifts ~3 bpm per 1,000m above 2,500m for equivalent aerobic efforts
    const hrDrift = targetAltM > 2500 ? Math.round((targetAltM - 2500) / 1000 * 3) : 0;

    // Volume reduction recommendation for first week
    const volReduction = Math.min(40, Math.round(perfImpact * 2));

    let zones, adjustedLabel, adjustedValue;

    if (metricType === 'ftp') {
      const altFTP = Math.round(metricValue * perfFactor);
      adjustedLabel = 'Altitude-Adjusted FTP';
      adjustedValue = `${altFTP}W`;
      zones = [
        { name: 'Z1 — Recovery',  pct: '< 55%',     home: `< ${Math.round(metricValue * 0.55)}W`,         alt: `< ${Math.round(altFTP * 0.55)}W`         },
        { name: 'Z2 — Endurance', pct: '55–75%',    home: `${Math.round(metricValue * 0.55)}–${Math.round(metricValue * 0.75)}W`, alt: `${Math.round(altFTP * 0.55)}–${Math.round(altFTP * 0.75)}W` },
        { name: 'Z3 — Tempo',     pct: '75–90%',    home: `${Math.round(metricValue * 0.75)}–${Math.round(metricValue * 0.90)}W`, alt: `${Math.round(altFTP * 0.75)}–${Math.round(altFTP * 0.90)}W` },
        { name: 'Z4 — Threshold', pct: '90–105%',   home: `${Math.round(metricValue * 0.90)}–${Math.round(metricValue * 1.05)}W`, alt: `${Math.round(altFTP * 0.90)}–${Math.round(altFTP * 1.05)}W` },
        { name: 'Z5 — VO₂ Max',   pct: '> 105%',    home: `> ${Math.round(metricValue * 1.05)}W`,          alt: `> ${Math.round(altFTP * 1.05)}W`          },
      ];
    } else {
      // Pace in seconds/mile; altitude makes you slower = more sec/mile
      const altPace = Math.round(metricValue / perfFactor);
      adjustedLabel = 'Altitude-Adjusted Threshold Pace';
      adjustedValue = this.fmtPace(altPace);
      zones = [
        { name: 'Z1 — Recovery',  pct: '> 130%',    home: `> ${this.fmtPace(Math.round(metricValue * 1.30))}`,      alt: `> ${this.fmtPace(Math.round(altPace * 1.30))}`      },
        { name: 'Z2 — Aerobic',   pct: '115–130%',  home: `${this.fmtPace(Math.round(metricValue * 1.15))}–${this.fmtPace(Math.round(metricValue * 1.30))}`, alt: `${this.fmtPace(Math.round(altPace * 1.15))}–${this.fmtPace(Math.round(altPace * 1.30))}` },
        { name: 'Z3 — Tempo',     pct: '105–115%',  home: `${this.fmtPace(Math.round(metricValue * 1.05))}–${this.fmtPace(Math.round(metricValue * 1.15))}`, alt: `${this.fmtPace(Math.round(altPace * 1.05))}–${this.fmtPace(Math.round(altPace * 1.15))}` },
        { name: 'Z4 — Threshold', pct: '97–105%',   home: `${this.fmtPace(Math.round(metricValue * 0.97))}–${this.fmtPace(Math.round(metricValue * 1.05))}`, alt: `${this.fmtPace(Math.round(altPace * 0.97))}–${this.fmtPace(Math.round(altPace * 1.05))}` },
        { name: 'Z5 — VO₂ Max',   pct: '< 95%',     home: `< ${this.fmtPace(Math.round(metricValue * 0.95))}`,      alt: `< ${this.fmtPace(Math.round(altPace * 0.95))}`      },
      ];
    }

    return {
      zones, adjustedLabel, adjustedValue,
      perfImpact: +perfImpact.toFixed(1),
      netVO2:     +netVO2.toFixed(1),
      hrDrift, volReduction, metricType,
      targetAltDisplay: unit === 'ft' ? `${Math.round(targetAltFt).toLocaleString()} ft` : `${Math.round(targetAltM).toLocaleString()} m`,
    };
  },
};


/* ============================================================
   NUTRITION & HYDRATION CALCULATOR ENGINE
   ============================================================ */

const NutritionScience = {

  calculate({ targetAltFt, bodyWeightLbs, trainingLoad, temperature, unit }) {
    const targetAltM = unit === 'ft' ? AltitudeScience.ftToM(targetAltFt) : targetAltFt;

    // Baseline: 0.5 oz per lb of bodyweight
    const baselineOz = bodyWeightLbs * 0.5;

    // Altitude multiplier: respiratory moisture loss increases ~6% per 1,000m above 1,000m
    const altMultiplier = 1 + Math.max(0, (targetAltM - 1000) / 1000) * 0.06;

    // Training volume add-on (oz/day)
    const trainingOz = { rest: 0, light: 16, moderate: 24, heavy: 40 }[trainingLoad] ?? 0;

    // Temperature modifier (oz/day)
    const tempOz = { cold: 8, moderate: 0, warm: 14 }[temperature] ?? 0;

    const totalOz = Math.round(baselineOz * altMultiplier + trainingOz + tempOz);
    const totalMl = Math.round(totalOz * 29.574);
    const totalLiters = (totalMl / 1000).toFixed(1);

    // Caloric increase: altitude raises BMR, cold air adds burn, training amplifies
    const altCaloricPct = Math.round(Math.max(0, (targetAltM - 1500) / 1000) * 5);
    const trainCaloricPct = { rest: 0, light: 3, moderate: 5, heavy: 8 }[trainingLoad] ?? 0;
    const totalCaloricPct = Math.min(25, altCaloricPct + trainCaloricPct);

    // Iron recommendation
    const ironTarget = targetAltM > 1500
      ? `${Math.round(25 + (targetAltM - 1500) / 1000 * 3)}–${Math.round(30 + (targetAltM - 1500) / 1000 * 3)} mg/day`
      : '8–18 mg/day (standard)';

    const altAddOz = Math.round(baselineOz * (altMultiplier - 1));

    return {
      targetAltM,
      targetAltDisplay: unit === 'ft' ? `${Math.round(targetAltFt).toLocaleString()} ft` : `${Math.round(targetAltM).toLocaleString()} m`,
      totalOz, totalMl, totalLiters,
      baselineOz: Math.round(baselineOz),
      altAddOz, trainingOz, tempOz,
      totalCaloricPct,
      ironTarget,
    };
  },
};


/* ============================================================
   ALTITUDE PERFORMANCE CALCULATOR — UI Controller
   ============================================================ */

const CalculatorUI = {

  state: { unit: 'ft', sport: 'running', fitnessLevel: 'intermediate', hasCalculated: false, result: null },

  init() {
    this.bindUnitToggle();
    this.bindForm();
    this.bindReportGate();
  },

  bindUnitToggle() {
    const buttons = document.querySelectorAll('.unit-toggle button');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.state.unit = btn.dataset.unit;
        buttons.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        const unitLabels = document.querySelectorAll('.input-unit');
        unitLabels.forEach(l => { l.textContent = this.state.unit; });
        const targetInput = document.getElementById('calc-target-alt');
        const homeInput   = document.getElementById('calc-home-alt');
        if (targetInput) targetInput.placeholder = this.state.unit === 'ft' ? 'e.g. 8000' : 'e.g. 2438';
        if (homeInput)   homeInput.placeholder   = this.state.unit === 'ft' ? 'e.g. 0 (sea level)' : 'e.g. 0';
      });
    });
  },

  bindForm() {
    const form = document.getElementById('altitude-calculator-form');
    if (!form) return;
    form.addEventListener('submit', e => { e.preventDefault(); this.runCalculation(); });
  },

  bindReportGate() {
    const gateForm = document.getElementById('report-gate-form');
    if (!gateForm) return;
    gateForm.addEventListener('submit', e => {
      e.preventDefault();
      const email = document.getElementById('report-email')?.value;
      if (!email || !email.includes('@')) return;
      document.getElementById('report-gate-form').style.display  = 'none';
      document.getElementById('report-gate-success').style.display = 'block';
      console.log('[APL] Report requested:', email, this.state.result);
    });
  },

  runCalculation() {
    const targetAlt = parseFloat(document.getElementById('calc-target-alt')?.value) || 0;
    const homeAlt   = parseFloat(document.getElementById('calc-home-alt')?.value)   || 0;
    const sport     = document.getElementById('calc-sport')?.value   || 'running';
    const fitness   = document.getElementById('calc-fitness')?.value || 'intermediate';

    if (targetAlt <= 0) { this.showError('Please enter a target altitude.'); return; }
    if (homeAlt >= targetAlt) { this.showError('Target altitude must be higher than your home altitude.'); return; }
    this.clearError();

    const result = AltitudeScience.calculate({ targetAltFt: targetAlt, homeAltFt: homeAlt, sport, fitnessLevel: fitness, unit: this.state.unit });
    this.state.result = result;
    this.state.hasCalculated = true;
    this.renderResults(result);
  },

  renderResults(result) {
    const container = document.getElementById('results-container');
    if (!container) return;

    const vo2Color  = result.netVO2Reduction > 15 ? 'danger' : result.netVO2Reduction > 8 ? 'warning' : 'accent';
    const perfColor = result.perfImpact > 15       ? 'danger' : result.perfImpact > 8       ? 'warning' : 'accent';
    const acclimColor = result.acclimatization.zoneColor;
    const vo2Bar  = Math.min(100, (result.netVO2Reduction / 30) * 100).toFixed(0);
    const perfBar = Math.min(100, (result.perfImpact / 30) * 100).toFixed(0);
    const zoneBadge = { success: 'badge--success', warning: 'badge--warning', danger: 'badge--danger' }[acclimColor] || 'badge--muted';

    container.innerHTML = `
      <div class="animate-in">
        <div class="result-card result-card--${vo2Color} mb-16">
          <div class="result-card__header">
            <div>
              <div class="result-card__label">VO₂ Max Impact</div>
              <div class="result-card__value ${vo2Color}">−${result.netVO2Reduction}%</div>
            </div>
            <span class="badge badge--muted">Aerobic Capacity</span>
          </div>
          <p class="result-card__description">Your aerobic capacity will be reduced by <strong>${result.netVO2Reduction}%</strong> going from ${result.homeAltDisplay} to ${result.targetAltDisplay}. This is the primary driver of altitude performance loss.</p>
          <div class="result-card__bar"><div class="result-card__bar-fill" style="width:${vo2Bar}%;background:var(--${vo2Color==='accent'?'accent':vo2Color})"></div></div>
        </div>
        <div class="result-card result-card--${perfColor} mb-16">
          <div class="result-card__header">
            <div>
              <div class="result-card__label">Performance Impact</div>
              <div class="result-card__value ${perfColor}">−${result.perfImpact}%</div>
            </div>
            <span class="badge badge--muted">Output Reduction</span>
          </div>
          <p class="result-card__description">${result.sportContext}</p>
          <div class="result-card__bar"><div class="result-card__bar-fill" style="width:${perfBar}%;background:var(--${perfColor==='accent'?'accent':perfColor})"></div></div>
        </div>
        <div class="result-card result-card--${acclimColor} mb-24">
          <div class="result-card__header">
            <div>
              <div class="result-card__label">Acclimatization</div>
              <div class="result-card__value ${acclimColor}" style="font-size:1.25rem;line-height:1.3">${result.acclimatization.initial}</div>
            </div>
            <span class="badge ${zoneBadge}">${result.acclimatization.zone}</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;font-size:0.8125rem"><span style="color:var(--text-muted);font-family:var(--font-mono)">Initial adaptation</span><span style="color:var(--text-secondary);font-family:var(--font-mono)">${result.acclimatization.initial}</span></div>
            <div style="display:flex;justify-content:space-between;font-size:0.8125rem"><span style="color:var(--text-muted);font-family:var(--font-mono)">Significant adaptation</span><span style="color:var(--text-secondary);font-family:var(--font-mono)">${result.acclimatization.significant}</span></div>
            <div style="display:flex;justify-content:space-between;font-size:0.8125rem"><span style="color:var(--text-muted);font-family:var(--font-mono)">Full acclimatization</span><span style="color:var(--text-secondary);font-family:var(--font-mono)">${result.acclimatization.full}</span></div>
          </div>
          <p class="result-card__description">${result.acclimatization.notes}</p>
        </div>
      </div>`;

    const reportGate = document.getElementById('report-gate');
    if (reportGate) reportGate.classList.add('visible');
    if (window.innerWidth <= 768) container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  showError(msg) {
    const el = document.getElementById('calc-error');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
  },
  clearError() {
    const el = document.getElementById('calc-error');
    if (el) el.style.display = 'none';
  },
};


/* ============================================================
   ACCLIMATIZATION PLANNER — UI Controller
   ============================================================ */

const AcclimatizationUI = {

  state: { unit: 'ft' },

  init() {
    this.bindUnitToggle('acclim-unit-toggle', 'acclim-unit');
    const form = document.getElementById('acclimatization-form');
    if (!form) return;
    form.addEventListener('submit', e => { e.preventDefault(); this.run(); });
    this.bindReportGate('acclim-report-form', 'acclim-report-success');
  },

  bindUnitToggle(toggleId, unitClass) {
    const buttons = document.querySelectorAll(`#${toggleId} button`);
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.state.unit = btn.dataset.unit;
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll(`.${unitClass}`).forEach(l => { l.textContent = this.state.unit; });
      });
    });
  },

  bindReportGate(formId, successId) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const email = form.querySelector('input[type="email"]')?.value;
      if (!email || !email.includes('@')) return;
      form.style.display = 'none';
      const success = document.getElementById(successId);
      if (success) success.style.display = 'block';
      console.log('[APL] Acclimatization report requested:', email);
    });
  },

  run() {
    const targetAlt    = parseFloat(document.getElementById('acclim-target-alt')?.value) || 0;
    const homeAlt      = parseFloat(document.getElementById('acclim-home-alt')?.value)   || 0;
    const daysAvailable = document.getElementById('acclim-days')?.value || '7';
    const errorEl = document.getElementById('acclim-error');

    if (targetAlt <= 0) {
      if (errorEl) { errorEl.textContent = 'Please enter a target altitude.'; errorEl.style.display = 'block'; }
      return;
    }
    if (errorEl) errorEl.style.display = 'none';

    const result = AcclimatizationScience.plan({
      targetAltFt: targetAlt, homeAltFt: homeAlt,
      daysAvailable, unit: this.state.unit,
    });

    this.renderResults(result);
  },

  renderResults(r) {
    const container = document.getElementById('acclim-results-container');
    const placeholder = document.getElementById('acclim-placeholder');
    if (!container) return;
    if (placeholder) placeholder.style.display = 'none';

    const zoneBadge = { success: 'badge--success', warning: 'badge--warning', danger: 'badge--danger' }[r.zone.zoneColor] || 'badge--muted';
    const adviceBadge = { success: 'badge--success', warning: 'badge--warning', danger: 'badge--danger', accent: 'badge--accent' }[r.advice.badgeColor] || 'badge--muted';

    const phasesHtml = r.phases.map(p => `
      <div class="acclim-phase">
        <div class="acclim-phase__dot" style="background:var(--${p.color==='accent'?'accent':p.color})"></div>
        <div class="acclim-phase__day">${p.day}</div>
        <div class="acclim-phase__content">
          <div class="acclim-phase__title">${p.title}</div>
          <div class="acclim-phase__desc">${p.desc}</div>
        </div>
      </div>`).join('');

    const pointsHtml = r.advice.points.map(p => `
      <div style="display:flex;gap:10px;margin-bottom:10px">
        <div style="color:var(--accent);font-family:var(--font-mono);font-size:0.75rem;margin-top:3px;flex-shrink:0">→</div>
        <p style="font-size:0.875rem;line-height:1.6;margin:0">${p}</p>
      </div>`).join('');

    container.innerHTML = `
      <div class="animate-in">
        <div class="result-card mb-16">
          <div class="result-card__header">
            <div>
              <div class="result-card__label">Altitude Zone</div>
              <div class="result-card__value accent" style="font-size:1.1rem">${r.zone.zone}</div>
            </div>
            <span class="badge ${zoneBadge}">${r.daysAvailable} days available</span>
          </div>
          <p class="result-card__description">VO₂ max reduction from home altitude: <strong style="color:var(--warning)">−${r.vo2Reduction}%</strong>. ${r.zone.notes}</p>
        </div>

        <div class="result-card mb-16">
          <div class="result-card__header">
            <div><div class="result-card__label">Adaptation Phases</div></div>
            <span class="badge badge--muted">Timeline</span>
          </div>
          <div class="acclim-timeline">${phasesHtml}</div>
        </div>

        <div class="result-card mb-24">
          <div class="result-card__header">
            <div><div class="result-card__label">${r.advice.title}</div></div>
            <span class="badge ${adviceBadge}">${r.advice.badge}</span>
          </div>
          <div style="margin-top:4px">${pointsHtml}</div>
        </div>
      </div>`;

    const gate = document.getElementById('acclim-report-gate');
    if (gate) gate.classList.add('visible');
    if (window.innerWidth <= 768) container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },
};


/* ============================================================
   TRAINING ZONE CALCULATOR — UI Controller
   ============================================================ */

const TrainingZoneUI = {

  state: { unit: 'ft', metricType: 'ftp' },
  pendingResult: null,

  init() {
    this.bindUnitToggle();
    this.bindMetricToggle();
    const form = document.getElementById('training-zone-form');
    if (!form) return;
    form.addEventListener('submit', e => { e.preventDefault(); this.run(); });
    this.bindReportGate();
  },

  bindUnitToggle() {
    document.querySelectorAll('#tz-unit-toggle button').forEach(btn => {
      btn.addEventListener('click', () => {
        this.state.unit = btn.dataset.unit;
        document.querySelectorAll('#tz-unit-toggle button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.tz-unit').forEach(l => { l.textContent = this.state.unit; });
      });
    });
  },

  bindMetricToggle() {
    document.querySelectorAll('.metric-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.state.metricType = btn.dataset.metric;
        document.querySelectorAll('.metric-toggle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const ftpGroup  = document.getElementById('ftp-group');
        const paceGroup = document.getElementById('pace-group');
        const sportSelect = document.getElementById('tz-sport');

        if (this.state.metricType === 'ftp') {
          if (ftpGroup)  ftpGroup.style.display  = 'flex';
          if (paceGroup) paceGroup.style.display = 'none';
          if (sportSelect) sportSelect.value = 'cycling';
        } else {
          if (ftpGroup)  ftpGroup.style.display  = 'none';
          if (paceGroup) paceGroup.style.display = 'flex';
          if (sportSelect) sportSelect.value = 'running';
        }
      });
    });
  },

  bindReportGate() {
    const form = document.getElementById('tz-gate-form');
    if (!form) return;
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const firstName = document.getElementById('tz-first-name')?.value.trim();
      const lastName  = document.getElementById('tz-last-name')?.value.trim();
      const email     = document.getElementById('tz-email')?.value.trim();
      if (!firstName || !lastName || !email || !email.includes('@')) return;

      const encode = d => Object.keys(d).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(d[k] ?? '')).join('&');
      try {
        await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: encode({
            'form-name': 'performance-calculator-lead',
            'bot-field': '',
            firstName, lastName, email,
            targetAlt: document.getElementById('tz-target-alt')?.value || '',
            sport: document.getElementById('tz-sport')?.value || '',
          }),
        });
      } catch (err) { console.error('Form error:', err); }

      const gate = document.getElementById('tz-report-gate');
      if (gate) gate.style.display = 'none';
      if (this.pendingResult) this.renderResults(this.pendingResult);
    });
  },

  run() {
    const targetAlt    = parseFloat(document.getElementById('tz-target-alt')?.value) || 0;
    const homeAlt      = parseFloat(document.getElementById('tz-home-alt')?.value)   || 0;
    const sport        = document.getElementById('tz-sport')?.value    || 'cycling';
    const fitnessLevel = document.getElementById('tz-fitness')?.value  || 'intermediate';
    const errorEl      = document.getElementById('tz-error');

    let metricValue;
    if (this.state.metricType === 'ftp') {
      metricValue = parseFloat(document.getElementById('tz-ftp')?.value) || 0;
      if (metricValue <= 0) {
        if (errorEl) { errorEl.textContent = 'Please enter your FTP in watts.'; errorEl.style.display = 'block'; }
        return;
      }
    } else {
      const paceStr = document.getElementById('tz-pace')?.value || '';
      const parts = paceStr.split(':');
      if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
        if (errorEl) { errorEl.textContent = 'Please enter pace as MM:SS (e.g. 7:30).'; errorEl.style.display = 'block'; }
        return;
      }
      metricValue = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }

    if (targetAlt <= 0) {
      if (errorEl) { errorEl.textContent = 'Please enter a target altitude.'; errorEl.style.display = 'block'; }
      return;
    }
    if (errorEl) errorEl.style.display = 'none';

    this.pendingResult = TrainingZoneScience.calculate({
      targetAltFt: targetAlt, homeAltFt: homeAlt,
      sport, metricType: this.state.metricType, metricValue,
      fitnessLevel, unit: this.state.unit,
    });

    // Show gate — results render after lead is captured
    const placeholder = document.getElementById('tz-placeholder');
    if (placeholder) placeholder.style.display = 'none';
    const gate = document.getElementById('tz-report-gate');
    if (gate) { gate.style.display = 'block'; gate.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  },

  renderResults(r) {
    const container = document.getElementById('tz-results-container');
    const placeholder = document.getElementById('tz-placeholder');
    if (!container) return;
    if (placeholder) placeholder.style.display = 'none';

    const zonesHtml = r.zones.map(z => `
      <tr>
        <td>${z.name}</td>
        <td style="color:var(--text-muted)">${z.pct}</td>
        <td>${z.home}</td>
        <td style="color:var(--accent)">${z.alt}</td>
      </tr>`).join('');

    container.innerHTML = `
      <div class="animate-in">
        <div class="result-card mb-16">
          <div class="result-card__header">
            <div>
              <div class="result-card__label">${r.adjustedLabel}</div>
              <div class="result-card__value accent">${r.adjustedValue}</div>
            </div>
            <span class="badge badge--warning">−${r.perfImpact}% output</span>
          </div>
          <p class="result-card__description">Your VO₂ max drops <strong>${r.netVO2}%</strong> at ${r.targetAltDisplay}. ${r.metricType === 'ftp' ? 'Recalibrate all power targets using the altitude-adjusted FTP below.' : 'Use these altitude-adjusted paces for all structured workouts at elevation.'}</p>
        </div>

        <div class="result-card mb-16">
          <div class="result-card__header">
            <div><div class="result-card__label">Training Zone Adjustments</div></div>
            <span class="badge badge--muted">Sea Level → Altitude</span>
          </div>
          <table class="zone-table">
            <thead><tr><th>Zone</th><th>% of ${r.metricType === 'ftp' ? 'FTP' : 'Threshold'}</th><th>Sea Level</th><th>At Altitude</th></tr></thead>
            <tbody>${zonesHtml}</tbody>
          </table>
        </div>

        <div class="result-card mb-24">
          <div class="result-card__header">
            <div><div class="result-card__label">Key Adjustments</div></div>
            <span class="badge badge--muted">First ${r.volReduction > 20 ? '2 Weeks' : 'Week'}</span>
          </div>
          <div>
            ${r.hrDrift > 0 ? `<div style="display:flex;gap:10px;margin-bottom:10px"><div style="color:var(--warning);font-family:var(--font-mono);font-size:0.75rem;margin-top:3px;flex-shrink:0">!</div><p style="font-size:0.875rem;line-height:1.6;margin:0">HR will run approximately <strong>${r.hrDrift}+ bpm higher</strong> for equivalent aerobic efforts. Train by HR — not by pace or power — for the first 3–5 days.</p></div>` : ''}
            <div style="display:flex;gap:10px;margin-bottom:10px"><div style="color:var(--accent);font-family:var(--font-mono);font-size:0.75rem;margin-top:3px;flex-shrink:0">→</div><p style="font-size:0.875rem;line-height:1.6;margin:0">Reduce total training volume by <strong>${r.volReduction}%</strong> in the first 5–7 days to allow physiological adaptation.</p></div>
            <div style="display:flex;gap:10px;margin-bottom:10px"><div style="color:var(--accent);font-family:var(--font-mono);font-size:0.75rem;margin-top:3px;flex-shrink:0">→</div><p style="font-size:0.875rem;line-height:1.6;margin:0">Avoid threshold and VO₂ max efforts for the first 2–3 days. Your body is redistributing blood volume and any intense effort compounds the stress.</p></div>
            <div style="display:flex;gap:10px"><div style="color:var(--accent);font-family:var(--font-mono);font-size:0.75rem;margin-top:3px;flex-shrink:0">→</div><p style="font-size:0.875rem;line-height:1.6;margin:0">Performance gradually returns from week 2 onward as EPO response drives increased red blood cell production.</p></div>
          </div>
        </div>
      </div>`;

    const gate = document.getElementById('tz-report-gate');
    if (gate) gate.classList.add('visible');
    if (window.innerWidth <= 768) container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },
};


/* ============================================================
   NUTRITION CALCULATOR — UI Controller
   ============================================================ */

const NutritionUI = {

  state: { unit: 'ft', weightUnit: 'lbs' },
  pendingResult: null,

  init() {
    this.bindUnitToggle();
    this.bindWeightToggle();
    const form = document.getElementById('nutrition-form');
    if (!form) return;
    form.addEventListener('submit', e => { e.preventDefault(); this.run(); });
    this.bindReportGate();
  },

  bindUnitToggle() {
    document.querySelectorAll('#nutr-unit-toggle button').forEach(btn => {
      btn.addEventListener('click', () => {
        this.state.unit = btn.dataset.unit;
        document.querySelectorAll('#nutr-unit-toggle button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.nutr-unit').forEach(l => { l.textContent = this.state.unit; });
      });
    });
  },

  bindWeightToggle() {
    document.querySelectorAll('#nutr-weight-toggle button').forEach(btn => {
      btn.addEventListener('click', () => {
        this.state.weightUnit = btn.dataset.weight;
        document.querySelectorAll('#nutr-weight-toggle button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const weightLabel = document.querySelector('.nutr-weight-unit');
        if (weightLabel) weightLabel.textContent = this.state.weightUnit;
        const placeholder = document.getElementById('nutr-weight');
        if (placeholder) placeholder.placeholder = this.state.weightUnit === 'lbs' ? 'e.g. 165' : 'e.g. 75';
      });
    });
  },

  bindReportGate() {
    const form = document.getElementById('nutr-gate-form');
    if (!form) return;
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const firstName = document.getElementById('nutr-first-name')?.value.trim();
      const lastName  = document.getElementById('nutr-last-name')?.value.trim();
      const email     = document.getElementById('nutr-email')?.value.trim();
      if (!firstName || !lastName || !email || !email.includes('@')) return;

      const encode = d => Object.keys(d).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(d[k] ?? '')).join('&');
      try {
        await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: encode({
            'form-name': 'nutrition-calculator-lead',
            'bot-field': '',
            firstName, lastName, email,
            targetAlt: document.getElementById('nutr-target-alt')?.value || '',
            trainingLoad: document.getElementById('nutr-training')?.value || '',
          }),
        });
      } catch (err) { console.error('Form error:', err); }

      const gate = document.getElementById('nutr-report-gate');
      if (gate) gate.style.display = 'none';
      if (this.pendingResult) this.renderResults(this.pendingResult);
    });
  },

  run() {
    const targetAlt    = parseFloat(document.getElementById('nutr-target-alt')?.value) || 0;
    let weight         = parseFloat(document.getElementById('nutr-weight')?.value) || 0;
    const trainingLoad = document.getElementById('nutr-training')?.value || 'moderate';
    const temperature  = document.getElementById('nutr-temp')?.value    || 'moderate';
    const errorEl      = document.getElementById('nutr-error');

    if (targetAlt <= 0) {
      if (errorEl) { errorEl.textContent = 'Please enter your target altitude.'; errorEl.style.display = 'block'; }
      return;
    }
    if (weight <= 0) {
      if (errorEl) { errorEl.textContent = 'Please enter your body weight.'; errorEl.style.display = 'block'; }
      return;
    }
    if (errorEl) errorEl.style.display = 'none';

    if (this.state.weightUnit === 'kg') weight = weight * 2.205;

    this.pendingResult = NutritionScience.calculate({
      targetAltFt: targetAlt, bodyWeightLbs: weight,
      trainingLoad, temperature, unit: this.state.unit,
    });

    // Show gate — results render after lead is captured
    const placeholder = document.getElementById('nutr-placeholder');
    if (placeholder) placeholder.style.display = 'none';
    const gate = document.getElementById('nutr-report-gate');
    if (gate) { gate.style.display = 'block'; gate.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  },

  renderResults(r) {
    const container = document.getElementById('nutr-results-container');
    const placeholder = document.getElementById('nutr-placeholder');
    if (!container) return;
    if (placeholder) placeholder.style.display = 'none';

    const breakdownItems = [
      { label: 'Baseline (body weight)',         value: `${r.baselineOz} oz` },
      { label: 'Altitude add-on (dry thin air)', value: r.altAddOz > 0 ? `+${r.altAddOz} oz` : 'Minimal' },
      { label: 'Training volume add-on',          value: r.trainingOz > 0 ? `+${r.trainingOz} oz` : 'Rest day — no add-on' },
      { label: 'Temperature modifier',            value: r.tempOz > 0 ? `+${r.tempOz} oz` : 'None' },
    ].map(i => `
      <div style="display:flex;justify-content:space-between;font-size:0.8125rem;padding:6px 0;border-bottom:1px solid var(--border-subtle)">
        <span style="color:var(--text-muted);font-family:var(--font-mono)">${i.label}</span>
        <span style="color:var(--text-secondary);font-family:var(--font-mono)">${i.value}</span>
      </div>`).join('');

    container.innerHTML = `
      <div class="animate-in">
        <div class="result-card mb-16">
          <div class="result-card__header">
            <div>
              <div class="result-card__label">Daily Hydration Target</div>
              <div class="result-card__value accent">${r.totalOz} oz <span style="font-size:1rem;color:var(--text-secondary)">/ ${r.totalLiters}L</span></div>
            </div>
            <span class="badge badge--accent">${r.totalMl} mL</span>
          </div>
          <div style="margin:12px 0">${breakdownItems}</div>
          <p class="result-card__description" style="margin-top:12px">Cold, dry mountain air pulls moisture from your lungs with every breath. Spread this intake throughout the day — front-load morning hydration before training.</p>
        </div>

        <div class="result-card mb-16">
          <div class="result-card__header">
            <div>
              <div class="result-card__label">Caloric Adjustment</div>
              <div class="result-card__value ${r.totalCaloricPct > 15 ? 'warning' : 'accent'}">+${r.totalCaloricPct}%</div>
            </div>
            <span class="badge badge--muted">vs. Sea Level</span>
          </div>
          <p class="result-card__description">Altitude raises your basal metabolic rate and cold air increases thermogenic demands. Add approximately ${r.totalCaloricPct}% more calories per day — prioritize carbohydrates (your primary fuel at altitude) and lean protein to support tissue repair.</p>
          <p class="result-card__description" style="margin-top:8px">⚠️ Altitude also suppresses appetite. You may not feel hungry — eat proactively, not reactively.</p>
        </div>

        <div class="result-card mb-24">
          <div class="result-card__header">
            <div><div class="result-card__label">Iron & Supplement Priority</div></div>
            <span class="badge badge--accent">EPO Support</span>
          </div>
          <p class="result-card__description" style="margin-bottom:12px">Target iron intake at ${r.targetAltDisplay}: <strong style="color:var(--accent)">${r.ironTarget}</strong></p>
          <p class="result-card__description">Altitude triggers erythropoietin (EPO) production, which drives red blood cell synthesis — but only when adequate iron is available. Iron-deficient athletes gain minimal hematological benefit from altitude exposure.</p>
          <div style="margin-top:12px;display:flex;flex-direction:column;gap:8px">
            <div style="display:flex;gap:10px"><div style="color:var(--accent);font-family:var(--font-mono);font-size:0.75rem;margin-top:3px;flex-shrink:0">→</div><p style="font-size:0.875rem;line-height:1.6;margin:0">Best food sources: red meat, liver, shellfish, lentils, spinach + vitamin C for absorption</p></div>
            <div style="display:flex;gap:10px"><div style="color:var(--accent);font-family:var(--font-mono);font-size:0.75rem;margin-top:3px;flex-shrink:0">→</div><p style="font-size:0.875rem;line-height:1.6;margin:0">Consider iron bisglycinate supplements — more bioavailable with fewer GI side effects</p></div>
            <div style="display:flex;gap:10px"><div style="color:var(--accent);font-family:var(--font-mono);font-size:0.75rem;margin-top:3px;flex-shrink:0">→</div><p style="font-size:0.875rem;line-height:1.6;margin:0">Avoid calcium-rich foods (dairy) within 2 hours of iron intake — calcium blocks absorption</p></div>
          </div>
        </div>
      </div>`;

    const gate = document.getElementById('nutr-report-gate');
    if (gate) gate.classList.add('visible');
    if (window.innerWidth <= 768) container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },
};


/* ============================================================
   NAV — Mobile hamburger
   ============================================================ */

function initMobileNav() {
  const hamburger = document.getElementById('nav-hamburger');
  const mobileNav = document.getElementById('nav-mobile');
  if (!hamburger || !mobileNav) return;
  hamburger.addEventListener('click', () => { mobileNav.classList.toggle('open'); });
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => mobileNav.classList.remove('open'));
  });
}


/* ============================================================
   EMAIL CAPTURE — generic forms
   ============================================================ */

function initEmailCapture() {
  document.querySelectorAll('.hero-email-form, .section-email-form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const email = form.querySelector('input[type="email"]')?.value;
      if (!email || !email.includes('@')) return;
      form.style.display = 'none';
      const success = form.parentElement?.querySelector('.success-msg');
      if (success) success.classList.add('visible');
      console.log('[APL] Email captured:', email);
    });
  });
}


/* ============================================================
   RESOURCES PAGE — Category filter
   ============================================================ */

function initResourcesFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  if (!filterBtns.length) return;

  const searchInput  = document.getElementById('article-search');
  const noResults    = document.getElementById('no-results');
  const noResultsMsg = document.getElementById('no-results-msg');
  const clearBtn     = document.getElementById('clear-search');
  const summary      = document.getElementById('results-summary');
  const articles     = Array.from(document.querySelectorAll('.article-card'));

  let activeFilter = 'all';
  let searchQuery  = '';

  // Count articles per category for badge labels
  const counts = { all: articles.length };
  articles.forEach(a => {
    const cat = a.dataset.category;
    if (cat) counts[cat] = (counts[cat] || 0) + 1;
  });
  document.querySelectorAll('.filter-btn__count').forEach(badge => {
    const key = badge.dataset.count;
    if (counts[key] !== undefined) badge.textContent = counts[key];
  });

  function applyFilters() {
    const q = searchQuery.toLowerCase().trim();
    let visible = 0;

    articles.forEach(article => {
      const catMatch  = activeFilter === 'all' || article.dataset.category === activeFilter;
      const searchStr = (article.dataset.searchText || '') + ' ' +
                        (article.querySelector('h3')?.textContent || '') + ' ' +
                        (article.querySelector('p')?.textContent || '');
      const textMatch = !q || searchStr.toLowerCase().includes(q);

      if (catMatch && textMatch) {
        article.removeAttribute('data-hidden');
        visible++;
      } else {
        article.setAttribute('data-hidden', 'true');
      }
    });

    // No-results state
    if (noResults) {
      if (visible === 0) {
        noResults.classList.add('visible');
        if (noResultsMsg) {
          noResultsMsg.textContent = q
            ? `No articles matched "${q}"${activeFilter !== 'all' ? ' in this category' : ''}.`
            : 'No articles in this category.';
        }
      } else {
        noResults.classList.remove('visible');
      }
    }

    // Results summary
    if (summary) {
      if (q || activeFilter !== 'all') {
        summary.textContent = `Showing ${visible} of ${articles.length} article${articles.length !== 1 ? 's' : ''}`;
      } else {
        summary.textContent = '';
      }
    }
  }

  // Category filter clicks
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.filter;
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyFilters();
    });
  });

  // Live search
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      searchQuery = searchInput.value;
      applyFilters();
    });
  }

  // Clear search button
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) { searchInput.value = ''; searchQuery = ''; }
      activeFilter = 'all';
      filterBtns.forEach(b => b.classList.remove('active'));
      const allBtn = document.querySelector('.filter-btn[data-filter="all"]');
      if (allBtn) allBtn.classList.add('active');
      applyFilters();
    });
  }

  // Support ?filter=category in URL (e.g. from footer links)
  const urlFilter = new URLSearchParams(window.location.search).get('filter');
  if (urlFilter) {
    const matchBtn = document.querySelector(`.filter-btn[data-filter="${urlFilter}"]`);
    if (matchBtn) matchBtn.click();
  }
}


/* ============================================================
   ACTIVE NAV LINK
   ============================================================ */

function setActiveNavLink() {
  const path = window.location.pathname;
  document.querySelectorAll('.nav__links a, .nav__mobile a').forEach(link => {
    const href = link.getAttribute('href') || '';
    const isHome   = (path === '/' || path.endsWith('index.html'))         && (href === '/' || href === 'index.html');
    const isAcclim = path.includes('acclimatization') && href.includes('acclimatization');
    const isTrain  = path.includes('training')        && href.includes('training');
    const isNutr   = path.includes('nutrition')       && href.includes('nutrition');
    const isTools  = path.includes('tools')           && href.includes('tools');
    const isRes    = path.includes('resources')       && href.includes('resources');
    if (isHome || isAcclim || isTrain || isNutr || isTools || isRes) {
      link.classList.add('active');
    }
  });
}


/* ============================================================
   BOOT
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  setActiveNavLink();
  initMobileNav();
  initEmailCapture();
  initResourcesFilter();

  if (document.getElementById('altitude-calculator-form'))   CalculatorUI.init();
  if (document.getElementById('acclimatization-form'))        AcclimatizationUI.init();
  if (document.getElementById('training-zone-form'))          TrainingZoneUI.init();
  if (document.getElementById('nutrition-form'))              NutritionUI.init();
});
