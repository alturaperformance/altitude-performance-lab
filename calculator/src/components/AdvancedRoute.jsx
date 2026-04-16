import { useState } from 'react';

const PERIODIZATION_PHASES = [
  { id: 'base', label: 'Base / Aerobic', desc: 'Building aerobic foundation, lower intensity' },
  { id: 'build', label: 'Build', desc: 'Increasing intensity and volume' },
  { id: 'peak', label: 'Peak', desc: 'Highest intensity work before event' },
  { id: 'taper', label: 'Taper', desc: 'Reducing volume pre-event' },
  { id: 'race', label: 'Race / Event', desc: 'Active competition period' },
  { id: 'recovery', label: 'Recovery', desc: 'Post-event or injury recovery' },
];

const AMS_SYMPTOMS = [
  { id: 'none', label: 'None' },
  { id: 'never_been', label: 'Never been at altitude' },
  { id: 'headache', label: 'Headache' },
  { id: 'nausea', label: 'Nausea' },
  { id: 'dizziness', label: 'Dizziness' },
  { id: 'fatigue', label: 'Unusual fatigue' },
  { id: 'sleep', label: 'Poor sleep' },
  { id: 'appetite', label: 'Loss of appetite' },
];

export default function AdvancedRoute({ data, onChange, onNext, onBack, activity, units }) {
  const [estimateVO2, setEstimateVO2] = useState(false);
  const weightUnit = units === 'imperial' ? 'lbs' : 'kg';
  const weightPlaceholder = units === 'imperial' ? 'e.g. 165' : 'e.g. 75';

  const symptoms = data.priorAMSSymptoms || [];
  const toggleSymptom = (id) => {
    let next;
    if (id === 'none' || id === 'never_been') {
      next = symptoms.includes(id) ? [] : [id];
    } else {
      const filtered = symptoms.filter(s => s !== 'none' && s !== 'never_been');
      next = filtered.includes(id) ? filtered.filter(s => s !== id) : [...filtered, id];
    }
    onChange({ ...data, priorAMSSymptoms: next });
  };

  const canContinue = data.age && data.sex;

  return (
    <div>
      <h2 className="section-title">Training Data</h2>
      <p className="section-sub">Enter your biometric and training data for a precise analysis. All fields marked optional can be skipped.</p>

      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="adv-age">
              Age <span className="required">*</span>
            </label>
            <input
              id="adv-age"
              type="number"
              className="form-input"
              min="10" max="100"
              value={data.age || ''}
              onChange={e => onChange({ ...data, age: e.target.value })}
              placeholder="e.g. 35"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              Biological sex <span className="required">*</span>
            </label>
            <div className="pill-group">
              {['Male', 'Female', 'Other'].map(s => (
                <button
                  key={s}
                  className={`pill${data.sex === s.toLowerCase() ? ' selected' : ''}`}
                  onClick={() => onChange({ ...data, sex: s.toLowerCase() })}
                  type="button"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="hrRest">
              Resting heart rate (bpm) <span className="optional">(optional)</span>
            </label>
            <input
              id="hrRest"
              type="number"
              className="form-input"
              min="30" max="120"
              value={data.hrRest || ''}
              onChange={e => onChange({ ...data, hrRest: e.target.value })}
              placeholder="e.g. 55"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="hrMax">
              Max heart rate (bpm) <span className="optional">(optional)</span>
            </label>
            <input
              id="hrMax"
              type="number"
              className="form-input"
              min="100" max="230"
              value={data.hrMax || ''}
              onChange={e => onChange({ ...data, hrMax: e.target.value })}
              placeholder="e.g. 185"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="hrv">
              HRV (ms) <span className="optional">(optional)</span>
            </label>
            <input
              id="hrv"
              type="number"
              className="form-input"
              min="0" max="300"
              value={data.hrv || ''}
              onChange={e => onChange({ ...data, hrv: e.target.value })}
              placeholder="e.g. 68"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="spo2">
              Resting SpO₂ (%) <span className="optional">(optional)</span>
            </label>
            <input
              id="spo2"
              type="number"
              className="form-input"
              min="70" max="100"
              value={data.spo2 || ''}
              onChange={e => onChange({ ...data, spo2: e.target.value })}
              placeholder="e.g. 97"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            VO₂ max (ml/kg/min) <span className="optional">(optional)</span>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="number"
              className="form-input"
              min="20" max="90"
              value={data.vo2Max || ''}
              onChange={e => onChange({ ...data, vo2Max: e.target.value })}
              placeholder="e.g. 52"
              disabled={estimateVO2}
              style={{ maxWidth: 140 }}
            />
            <button
              type="button"
              className={`pill${estimateVO2 ? ' selected' : ''}`}
              onClick={() => { setEstimateVO2(!estimateVO2); onChange({ ...data, vo2Max: '' }); }}
              style={{ whiteSpace: 'nowrap' }}
            >
              {estimateVO2 ? '✓ Estimating from HR' : 'Estimate it for me'}
            </button>
          </div>
          {estimateVO2 && (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6 }}>
              Enter your resting HR and max HR above — we'll estimate using the Uth–Sørensen formula.
            </p>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="weight">
              Body weight ({weightUnit}) <span className="optional">(optional)</span>
            </label>
            <input
              id="weight"
              type="number"
              className="form-input"
              min="0"
              value={data.weight || ''}
              onChange={e => onChange({ ...data, weight: e.target.value })}
              placeholder={weightPlaceholder}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="trainingHours">
              Average training hours / week <span className="optional">(optional)</span>
            </label>
            <input
              id="trainingHours"
              type="number"
              className="form-input"
              min="0" max="40"
              value={data.trainingHours || ''}
              onChange={e => onChange({ ...data, trainingHours: e.target.value })}
              placeholder="e.g. 10"
            />
          </div>
        </div>

        {(activity === 'road' || activity === 'mtb') && (
          <div className="form-group">
            <label className="form-label" htmlFor="ftp">
              FTP — Functional Threshold Power (W) <span className="optional">(optional)</span>
            </label>
            <input
              id="ftp"
              type="number"
              className="form-input"
              min="50" max="600"
              value={data.ftp || ''}
              onChange={e => onChange({ ...data, ftp: e.target.value })}
              placeholder="e.g. 250"
              style={{ maxWidth: 160 }}
            />
          </div>
        )}

        {activity === 'running' && (
          <div className="form-group">
            <label className="form-label" htmlFor="ltPace">
              Lactate threshold pace (min:sec per {units === 'imperial' ? 'mile' : 'km'}) <span className="optional">(optional)</span>
            </label>
            <input
              id="ltPace"
              type="text"
              className="form-input"
              value={data.ltPace || ''}
              onChange={e => onChange({ ...data, ltPace: e.target.value })}
              placeholder="e.g. 7:30"
              style={{ maxWidth: 140 }}
            />
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="form-group">
          <label className="form-label">
            Prior AMS symptoms (select all that apply)
          </label>
          <div className="pill-group" style={{ marginTop: 8 }}>
            {AMS_SYMPTOMS.map(s => (
              <button
                key={s.id}
                className={`pill${symptoms.includes(s.id) ? ' selected' : ''}`}
                onClick={() => toggleSymptom(s.id)}
                type="button"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">
            Current training / periodization phase <span className="optional">(optional)</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginTop: 8 }}>
            {PERIODIZATION_PHASES.map(opt => (
              <div
                key={opt.id}
                className={`route-card${data.periodizationPhase === opt.id ? ' selected' : ''}`}
                style={{ padding: '10px 14px', textAlign: 'left' }}
                onClick={() => onChange({ ...data, periodizationPhase: opt.id })}
              >
                <div className="route-card__title" style={{ fontSize: '0.85rem' }}>{opt.label}</div>
                <div className="route-card__desc" style={{ fontSize: '0.75rem' }}>{opt.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between' }}>
        <button className="btn btn--ghost" onClick={onBack}>← Back</button>
        <button className="btn btn--primary" onClick={onNext} disabled={!canContinue}>
          Calculate Results →
        </button>
      </div>
    </div>
  );
}
