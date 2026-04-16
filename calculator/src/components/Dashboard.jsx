import { useState } from 'react';
import DayOfChecklist from './DayOfChecklist.jsx';
import { generatePDF } from '../utils/pdfBuilder.js';

function O2Arc({ pct }) {
  // SVG arc gauge: 0=empty, 20.9=full (sea level)
  const maxO2 = 20.9;
  const frac = Math.min(1, Math.max(0, pct / maxO2));
  const r = 36;
  const cx = 48;
  const cy = 48;
  const startAngle = -210;
  const sweep = 240;
  const toRad = d => (d * Math.PI) / 180;
  const arcX = (angle) => cx + r * Math.cos(toRad(angle));
  const arcY = (angle) => cy + r * Math.sin(toRad(angle));
  const endAngle = startAngle + sweep * frac;
  const largeArc = sweep * frac > 180 ? 1 : 0;
  const bgEndAngle = startAngle + sweep;
  const bgLargeArc = sweep > 180 ? 1 : 0;

  const color = pct > 17 ? '#3FB950' : pct > 14 ? '#D29922' : '#F85149';

  return (
    <svg width="96" height="72" viewBox="0 0 96 72" style={{ display: 'block', margin: '0 auto 8px' }}>
      {/* Background track */}
      <path
        d={`M ${arcX(startAngle)} ${arcY(startAngle)} A ${r} ${r} 0 ${bgLargeArc} 1 ${arcX(bgEndAngle)} ${arcY(bgEndAngle)}`}
        fill="none" stroke="#30363D" strokeWidth="6" strokeLinecap="round"
      />
      {/* Value arc */}
      {frac > 0 && (
        <path
          d={`M ${arcX(startAngle)} ${arcY(startAngle)} A ${r} ${r} 0 ${largeArc} 1 ${arcX(endAngle)} ${arcY(endAngle)}`}
          fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
        />
      )}
    </svg>
  );
}

function MetricCard({ label, value, valueClass, sub, hint, children }) {
  return (
    <div className="metric-card">
      <div className="metric-card__label">{label}</div>
      {children || (
        <>
          <div className={`metric-card__value ${valueClass || ''}`}>{value}</div>
          {sub && <div className="metric-card__sub">{sub}</div>}
        </>
      )}
      {hint && <div className="metric-card__hint">{hint}</div>}
    </div>
  );
}

function RiskBadge({ level }) {
  const cls = level === 'low' ? 'badge--low' : level === 'moderate' ? 'badge--moderate' : 'badge--high';
  return <span className={`badge ${cls}`}>{level.charAt(0).toUpperCase() + level.slice(1)}</span>;
}

export default function Dashboard({ calc, risk, activityData, profileData, routeData, units, onRestart }) {
  const [unlocked, setUnlocked] = useState(false);
  const [userInfo, setUserInfo] = useState({ firstName: '', lastName: '', email: '' });
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfDone, setPdfDone] = useState(false);

  const gateValid =
    userInfo.firstName.trim().length > 0 &&
    userInfo.lastName.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userInfo.email);

  const handleUnlock = (e) => {
    e.preventDefault();
    if (gateValid) setUnlocked(true);
  };

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      const inputs = {
        ...profileData,
        ...activityData,
        units,
        weightLbs: routeData?.weight
          ? (units === 'imperial' ? parseFloat(routeData.weight) : parseFloat(routeData.weight) / 0.453592)
          : 154,
      };
      const formData = { ...routeData, activity: activityData?.activity };
      const doc = generatePDF(
        { ...inputs, ...formData, unit: inputs.units },
        {
          targetFt: calc.targetFt,
          o2: calc.o2Pct,
          o2Home: calc.homeO2Pct,
          vo2Reduction: calc.vo2ReductionPct,
          hrIncreasePct: calc.hrIncreasePct,
          acclimDays: typeof calc.acclimDays === 'object' ? calc.acclimDays : { min: 0, max: 0, note: 'None required' },
          hydration: {
            restOz: Math.round(calc.hydrationOz),
            activityOz: Math.round(calc.hydrationOz * 1.2),
            liters: (calc.hydrationOz * 1.2 * 0.02957).toFixed(1),
            multiplier: ((calc.hydrationOz) / (0.5 * (inputs.weightLbs || 154))).toFixed(1),
          },
          riskResult: { ...risk, risk: risk.level.toLowerCase() },
          ftpAtAlt: calc.ftpAtAltitude ? Math.round(calc.ftpAtAltitude) : null,
          ltPaceAtAlt: calc.ltPaceAtAltitude ? calc.ltPaceAtAltitude.toFixed(2) : null,
          vo2max: calc.vo2Max,
          adjustedVO2: calc.vo2MaxAtAltitude,
          vo2Estimated: !formData.vo2Max,
          pacingAdvice: calc.pacingAdvice || '',
          checklist: calc.checklist || [],
          daysAvailable: calc.daysAvailable,
        },
        userInfo.firstName,
        userInfo.lastName,
        profileData.eventDate
      );
      doc.save(`AltitudeReport_${userInfo.firstName}${userInfo.lastName}_${profileData.eventDate || 'event'}.pdf`);
      setPdfDone(true);
    } catch (err) {
      console.error('PDF error:', err);
      alert('Error generating PDF — please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  const elevUnit = units === 'imperial' ? 'ft' : 'm';
  const targetFt = calc.targetFt;
  const targetDisplay = units === 'imperial'
    ? `${Math.round(targetFt).toLocaleString()} ft`
    : `${Math.round(targetFt * 0.3048).toLocaleString()} m`;

  const o2Color = calc.o2Pct > 17 ? 'green' : calc.o2Pct > 14 ? 'amber' : 'red';
  const perfColor = calc.vo2ReductionPct < 8 ? 'green' : calc.vo2ReductionPct < 16 ? 'amber' : 'red';
  const riskColor = risk.risk === 'low' ? 'green' : risk.risk === 'moderate' ? 'amber' : 'red';
  const hydColor = 'green';

  const acclimText = typeof calc.acclimDays === 'object' && calc.acclimDays !== null
    ? `${calc.acclimDays.min}–${calc.acclimDays.max} days`
    : 'None needed';

  const o2DropPct = Math.round((1 - calc.o2Pct / calc.homeO2Pct) * 100);
  const hints = {
    o2: `Each breath at this altitude delivers about ${o2DropPct}% less oxygen than at home. Your lungs and heart have to work harder just to keep your body running normally.`,
    perf: `In plain terms: an effort that feels "easy" at home will feel like a ${calc.vo2ReductionPct < 8 ? 'moderate' : calc.vo2ReductionPct < 16 ? 'hard' : 'very hard'} effort here. Slow down, and use how you feel — not your usual pace — as your guide.`,
    ams: risk.risk === 'low'
      ? `Low risk means most people feel fine within a day or two. You may get a mild headache or feel more tired than usual — that's normal. Hydrate and take it easy on day one.`
      : risk.risk === 'moderate'
      ? `Moderate risk means you're likely to notice real symptoms: headache, fatigue, shortness of breath, or poor sleep — especially in the first 48 hours. These are your body's signals to slow down.`
      : `High risk means significant symptoms are likely. Headaches, nausea, and dizziness can appear quickly. Have a plan to descend if symptoms worsen — do not push through altitude sickness.`,
    hydration: `You lose water faster at altitude because you breathe more rapidly and the air is drier. Staying hydrated is one of the simplest ways to reduce headaches and maintain energy.`,
    acclim: typeof calc.acclimDays === 'object'
      ? `Your body needs time to adjust to less oxygen — building more red blood cells, regulating breathing, and stabilizing blood chemistry. Arriving early enough makes a meaningful difference in how you feel and perform.`
      : `At this elevation, your body adapts quickly and no special acclimatization period is needed before normal activity.`,
  };

  const phaseNote = routeData?.periodizationPhase === 'peak'
    ? 'You are in peak training — altitude will compound fatigue significantly. Prioritize recovery.'
    : routeData?.periodizationPhase === 'taper'
    ? 'Tapering is ideal timing for altitude — reduced volume helps with acclimatization.'
    : routeData?.periodizationPhase === 'recovery'
    ? 'You are in recovery — altitude stress will compound existing fatigue. Extra caution advised.'
    : null;

  const inputs = {
    ...profileData,
    ...activityData,
    units,
    weightLbs: routeData?.weight
      ? (units === 'imperial' ? parseFloat(routeData.weight) : parseFloat(routeData.weight) / 0.453592)
      : 154,
  };

  const formData = { ...routeData, activity: activityData?.activity };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 className="section-title" style={{ marginBottom: 4 }}>Altitude Performance Results</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Target: <strong style={{ color: 'var(--text)' }}>{targetDisplay}</strong>
            {' '}·{' '}
            {activityData?.activity && (
              <span style={{ textTransform: 'capitalize' }}>{activityData.activity.replace('_', ' ')}</span>
            )}
            {activityData?.subtype && ` — ${activityData.subtype}`}
          </p>
        </div>
        <button className="btn btn--ghost" style={{ fontSize: '0.78rem' }} onClick={onRestart}>
          Start Over
        </button>
      </div>

      {phaseNote && (
        <div style={{
          background: 'rgba(210,153,34,0.1)',
          border: '1px solid rgba(210,153,34,0.35)',
          borderRadius: 8,
          padding: '10px 16px',
          marginBottom: 20,
          fontSize: '0.85rem',
          color: 'var(--warning)',
        }}>
          {phaseNote}
        </div>
      )}

      <div className="dashboard-grid">
        {/* Card 1: O2 */}
        <MetricCard label="O₂ Availability" hint={hints.o2}>
          <O2Arc pct={calc.o2Pct} />
          <div className={`metric-card__value ${o2Color}`}>{calc.o2Pct.toFixed(1)}%</div>
          <div className="metric-card__sub">vs. {calc.homeO2Pct.toFixed(1)}% at home</div>
        </MetricCard>

        {/* Card 2: Performance Impact */}
        <MetricCard
          label="Performance Impact"
          value={`-${calc.vo2ReductionPct.toFixed(1)}%`}
          valueClass={perfColor}
          sub={`+${Math.round(calc.hrIncreasePct)}% HR at altitude`}
          hint={hints.perf}
        />

        {/* Card 3: AMS Risk */}
        <MetricCard label="Altitude Sickness Risk" hint={hints.ams}>
          <div style={{ marginBottom: 8 }}>
            <RiskBadge level={risk.risk} />
          </div>
          {risk.factors.slice(0, 2).map((f, i) => (
            <div key={i} style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 3 }}>
              · {f}
            </div>
          ))}
        </MetricCard>

        {/* Card 4: Hydration */}
        <MetricCard
          label="Hydration Target"
          value={`${Math.round(calc.hydrationOz)} oz`}
          valueClass={hydColor}
          sub={`${(calc.hydrationOz * 0.0295735).toFixed(1)} L / day at rest`}
          hint={hints.hydration}
        />

        {/* Card 5: Acclimatization */}
        <MetricCard label="Acclimatization" hint={hints.acclim}>
          <div className={`metric-card__value ${typeof calc.acclimDays === 'object' ? 'amber' : 'green'}`} style={{ fontSize: '1.3rem' }}>
            {acclimText}
          </div>
          <div className="metric-card__sub">
            {typeof calc.acclimDays === 'object'
              ? 'Optimal arrival window. If time-constrained, arrive ≤1 day before — avoid days 2–6.'
              : 'No structured acclimatization needed'}
          </div>
        </MetricCard>
      </div>

      {/* ── EMAIL GATE ────────────────────────────────────── */}
      {!unlocked && (
        <div className="report-gate">
          <div className="report-gate__icon">📊</div>
          <h3 className="report-gate__title">Your full report is ready</h3>
          <p className="report-gate__sub">
            Enter your name and email to unlock your personalized pacing plan, HR zones, acclimatization timeline, safety checklist, and PDF download.
          </p>
          <form className="report-gate__form" onSubmit={handleUnlock}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="gate-first">First name</label>
              <input
                id="gate-first"
                type="text"
                className="form-input"
                value={userInfo.firstName}
                onChange={e => setUserInfo(u => ({ ...u, firstName: e.target.value }))}
                placeholder="Alex"
                autoComplete="given-name"
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="gate-last">Last name</label>
              <input
                id="gate-last"
                type="text"
                className="form-input"
                value={userInfo.lastName}
                onChange={e => setUserInfo(u => ({ ...u, lastName: e.target.value }))}
                placeholder="Ridgeway"
                autoComplete="family-name"
                required
              />
            </div>
            <div className="form-group report-gate__email" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="gate-email">Email address</label>
              <input
                id="gate-email"
                type="email"
                className="form-input"
                value={userInfo.email}
                onChange={e => setUserInfo(u => ({ ...u, email: e.target.value }))}
                placeholder="alex@example.com"
                autoComplete="email"
                required
              />
            </div>
            <div className="report-gate__submit">
              <button
                type="submit"
                className="btn btn--primary"
                disabled={!gateValid}
                style={{ width: '100%', justifyContent: 'center', padding: '13px 20px', fontSize: '0.95rem' }}
              >
                Unlock Full Report →
              </button>
            </div>
          </form>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 12 }}>
            Your information is used only to personalize your report and will not be shared.
          </p>
        </div>
      )}

      {/* ── FULL REPORT (unlocked) ─────────────────────── */}
      {unlocked && (
        <>
          {/* Pacing */}
          {calc.pacingAdvice && (
            <div className="card card--accent" style={{ marginBottom: 20 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 6 }}>
                How to Pace Yourself — {activityData?.activity?.replace('_', ' ')}
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 10, lineHeight: 1.5 }}>
                Going too hard early at altitude is one of the most common mistakes. Your body is working harder than usual just to breathe — use these guidelines to avoid blowing up.
              </p>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{calc.pacingAdvice}</p>
            </div>
          )}

          {/* AMS Warnings */}
          {risk.warnings && risk.warnings.length > 0 && (
            <div className="card" style={{ marginBottom: 20, borderColor: risk.risk === 'high' ? 'var(--danger)' : risk.risk === 'moderate' ? 'var(--warning)' : 'var(--border)' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: risk.risk === 'high' ? 'var(--danger)' : risk.risk === 'moderate' ? 'var(--warning)' : 'var(--text-muted)', marginBottom: 6 }}>
                Altitude Sickness — What to Watch For
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 10, lineHeight: 1.5 }}>
                Altitude sickness (AMS) happens when your body struggles to adapt to less oxygen. Symptoms include headache, nausea, dizziness, and poor sleep. It's not a fitness thing — it can affect anyone regardless of how fit they are.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {risk.warnings.map((w, i) => (
                  <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text)', padding: '4px 0', borderBottom: i < risk.warnings.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    · {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* FTP / LT Pace */}
          {(calc.ftpAtAltitude || calc.ltPaceAtAltitude) && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 12 }}>
                Training Targets at Altitude
              </div>
              <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                {calc.ftpAtAltitude && (
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>FTP at Altitude</div>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--warning)' }}>
                      {Math.round(calc.ftpAtAltitude)}W
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 8 }}>
                      (−{Math.round(parseFloat(routeData.ftp) - calc.ftpAtAltitude)}W from home)
                    </span>
                  </div>
                )}
                {calc.ltPaceAtAltitude && (
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>LT Pace at Altitude</div>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--warning)' }}>
                      {calc.ltPaceAtAltitude.toFixed(2)} min/mi
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* HR Zones */}
          {calc.hrZones && calc.hrZones.length > 0 && (
            <div className="card" style={{ marginBottom: 20, overflowX: 'auto' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 6 }}>
                Heart Rate Zones (Adjusted for Altitude)
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 12, lineHeight: 1.5 }}>
                At altitude your heart beats faster for the same effort because less oxygen reaches your muscles. These zones are recalculated for this elevation — use them instead of your normal home zones.
              </p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '6px 0', color: 'var(--text-muted)', fontWeight: 600, paddingRight: 16 }}>Zone</th>
                    <th style={{ textAlign: 'left', padding: '6px 0', color: 'var(--text-muted)', fontWeight: 600, paddingRight: 16 }}>Name</th>
                    <th style={{ textAlign: 'left', padding: '6px 0', color: 'var(--text-muted)', fontWeight: 600, paddingRight: 16 }}>HR Range</th>
                    <th style={{ textAlign: 'left', padding: '6px 0', color: 'var(--text-muted)', fontWeight: 600 }}>RPE Note</th>
                  </tr>
                </thead>
                <tbody>
                  {calc.hrZones.map((z, i) => (
                    <tr key={i} style={{ borderBottom: i < calc.hrZones.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '8px 16px 8px 0', fontWeight: 700, color: 'var(--accent)' }}>{z.zone}</td>
                      <td style={{ padding: '8px 16px 8px 0' }}>{z.name}</td>
                      <td style={{ padding: '8px 16px 8px 0', fontFamily: 'monospace' }}>{z.range}</td>
                      <td style={{ padding: '8px 0', color: 'var(--text-muted)', fontSize: '0.78rem' }}>{z.rpeNote}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Timeline */}
          {calc.timeline && calc.timeline.length > 0 && (
            <div className="card" style={{ marginBottom: 32 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 6 }}>
                Preparation Timeline
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 16, lineHeight: 1.5 }}>
                When you arrive matters as much as how fit you are. This timeline tells you what to focus on in the weeks and days leading up to your event.
              </p>
              {calc.timeline.map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 16, paddingBottom: 14, borderBottom: i < calc.timeline.length - 1 ? '1px solid var(--border)' : 'none', marginBottom: 14 }}>
                  <div style={{ minWidth: 130 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent)' }}>{t.period}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{t.focus}</div>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text)', flex: 1 }}>{t.actions}</div>
                </div>
              ))}
            </div>
          )}

          <DayOfChecklist
            activity={activityData?.activity}
            targetElevationFt={targetFt}
            overnightAtAltitude={activityData?.overnightAtAltitude}
            riskLevel={risk.risk}
          />

          {/* PDF Download */}
          <div className="pdf-download-bar no-print">
            {pdfDone ? (
              <div className="pdf-download-bar__done">
                <span style={{ color: 'var(--success)', fontWeight: 700 }}>✓ Report downloaded</span>
                <button
                  className="btn btn--ghost"
                  style={{ fontSize: '0.82rem' }}
                  onClick={() => { setPdfDone(false); handleDownloadPDF(); }}
                >
                  Download again
                </button>
              </div>
            ) : (
              <>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 3 }}>Download your full altitude report</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>PDF includes all zones, timeline, pacing plan, and checklist personalized to {userInfo.firstName}.</div>
                </div>
                <button
                  className="btn btn--primary"
                  onClick={handleDownloadPDF}
                  disabled={pdfLoading}
                  style={{ flexShrink: 0, padding: '12px 28px' }}
                >
                  {pdfLoading ? 'Generating…' : '📄 Download PDF Report'}
                </button>
              </>
            )}
          </div>
        </>
      )}

      <p className="disclaimer" style={{ marginTop: 20, marginBottom: 40 }}>
        This calculator provides general fitness and performance estimates only. It is not medical advice. Consult a physician before strenuous activity at altitude, especially if you have cardiovascular, respiratory, or other medical conditions.
      </p>
    </div>
  );
}
