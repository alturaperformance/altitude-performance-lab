const FITNESS_LEVELS = [
  { id: 'sedentary', label: 'Sedentary', desc: 'Little or no regular exercise' },
  { id: 'light', label: 'Light Active', desc: 'Light exercise 1–3 days/week' },
  { id: 'moderate', label: 'Moderate', desc: 'Moderate exercise 3–5 days/week' },
  { id: 'active', label: 'Active', desc: 'Hard exercise 6–7 days/week' },
  { id: 'elite', label: 'Elite / Competitive', desc: 'Training twice a day or competing' },
];

const RPE_OPTIONS = [
  { id: 'easy', label: 'Easy', desc: 'Can hold a full conversation' },
  { id: 'moderate', label: 'Moderate', desc: 'Can speak in short sentences' },
  { id: 'hard', label: 'Hard', desc: 'Can only say a few words' },
  { id: 'maximal', label: 'Maximal', desc: 'Cannot speak at all' },
];

const AMS_SYMPTOMS = [
  { id: 'none', label: 'None / Never had symptoms' },
  { id: 'never_been', label: 'Never been at altitude' },
  { id: 'headache', label: 'Headache' },
  { id: 'nausea', label: 'Nausea or vomiting' },
  { id: 'dizziness', label: 'Dizziness or lightheadedness' },
  { id: 'fatigue', label: 'Unusual fatigue' },
  { id: 'sleep', label: 'Poor sleep quality' },
  { id: 'appetite', label: 'Loss of appetite' },
];

const SLEEP_OPTIONS = [
  { id: 'excellent', label: 'Excellent', desc: 'Sleep deeply anywhere' },
  { id: 'good', label: 'Good', desc: 'Minor disruptions, feel rested' },
  { id: 'fair', label: 'Fair', desc: 'Often wake during the night' },
  { id: 'poor', label: 'Poor', desc: 'Rarely sleep well at altitude' },
];

export default function SimpleRoute({ data, onChange, onNext, onBack }) {
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

  const canContinue = data.age && data.sex && data.fitnessLevel && data.rpeLevel && data.sleepQuality;

  return (
    <div>
      <h2 className="section-title">Quick Assessment</h2>
      <p className="section-sub">We'll estimate your physiology from general parameters.</p>

      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="age">
              Age <span className="required">*</span>
            </label>
            <input
              id="age"
              type="number"
              className="form-input"
              min="10"
              max="100"
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
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">
            Fitness level <span className="required">*</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginTop: 8 }}>
            {FITNESS_LEVELS.map(opt => (
              <div
                key={opt.id}
                className={`route-card${data.fitnessLevel === opt.id ? ' selected' : ''}`}
                style={{ padding: '12px 16px', textAlign: 'left' }}
                onClick={() => onChange({ ...data, fitnessLevel: opt.id })}
              >
                <div className="route-card__title" style={{ fontSize: '0.85rem' }}>{opt.label}</div>
                <div className="route-card__desc" style={{ fontSize: '0.75rem' }}>{opt.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="form-group">
          <label className="form-label">
            Typical perceived exertion during your regular workouts <span className="required">*</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginTop: 8 }}>
            {RPE_OPTIONS.map(opt => (
              <div
                key={opt.id}
                className={`route-card${data.rpeLevel === opt.id ? ' selected' : ''}`}
                style={{ padding: '12px 16px', textAlign: 'left' }}
                onClick={() => onChange({ ...data, rpeLevel: opt.id })}
              >
                <div className="route-card__title" style={{ fontSize: '0.85rem' }}>{opt.label}</div>
                <div className="route-card__desc" style={{ fontSize: '0.75rem' }}>{opt.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
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
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">
            Sleep quality at altitude <span className="required">*</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginTop: 8 }}>
            {SLEEP_OPTIONS.map(opt => (
              <div
                key={opt.id}
                className={`route-card${data.sleepQuality === opt.id ? ' selected' : ''}`}
                style={{ padding: '12px 16px', textAlign: 'left' }}
                onClick={() => onChange({ ...data, sleepQuality: opt.id })}
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
