const EXPERIENCE_OPTIONS = [
  { id: 'never', label: 'Never been at altitude', desc: 'I have no experience above 6,000 ft' },
  { id: 'rarely', label: 'Rarely', desc: '1–2 times, limited experience' },
  { id: 'occasionally', label: 'Occasionally', desc: 'A few times per year' },
  { id: 'regularly', label: 'Regularly', desc: 'Frequent altitude activities' },
];

export default function ProfileSetup({ data, onChange, onNext, onBack, units }) {
  const elevUnit = units === 'imperial' ? 'ft' : 'm';
  const elevPlaceholder = units === 'imperial' ? 'e.g. 5280' : 'e.g. 1600';
  const targetPlaceholder = units === 'imperial' ? 'e.g. 11000' : 'e.g. 3350';

  const canContinue =
    data.homeElevation !== '' && data.homeElevation !== undefined &&
    data.targetElevation !== '' && data.targetElevation !== undefined &&
    data.altitudeExperience &&
    data.eventDate;

  return (
    <div>
      <h2 className="section-title">Your Profile</h2>
      <p className="section-sub">Tell us about your home base and target event.</p>

      <div className="card">
        <div className="form-group">
          <label className="form-label" htmlFor="homeElevation">
            Home / primary training elevation ({elevUnit}) <span className="required">*</span>
          </label>
          <input
            id="homeElevation"
            type="number"
            className="form-input"
            value={data.homeElevation ?? ''}
            onChange={e => onChange({ ...data, homeElevation: e.target.value })}
            placeholder={elevPlaceholder}
            min="0"
            max={units === 'imperial' ? '29032' : '8849'}
            style={{ maxWidth: 220 }}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="targetElevation">
            Target event elevation ({elevUnit}) <span className="required">*</span>
          </label>
          <input
            id="targetElevation"
            type="number"
            className="form-input"
            value={data.targetElevation ?? ''}
            onChange={e => onChange({ ...data, targetElevation: e.target.value })}
            placeholder={targetPlaceholder}
            min="0"
            max={units === 'imperial' ? '29032' : '8849'}
            style={{ maxWidth: 220 }}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="eventDate">
            Target event date <span className="required">*</span>
          </label>
          <input
            id="eventDate"
            type="date"
            className="form-input"
            value={data.eventDate || ''}
            onChange={e => onChange({ ...data, eventDate: e.target.value })}
            style={{ maxWidth: 220 }}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="trainingDaysAboveHome">
            Days per week training outdoors above home elevation (0–7)
          </label>
          <input
            id="trainingDaysAboveHome"
            type="number"
            className="form-input"
            min="0"
            max="7"
            value={data.trainingDaysAboveHome ?? ''}
            onChange={e => onChange({ ...data, trainingDaysAboveHome: e.target.value })}
            placeholder="0"
            style={{ maxWidth: 100 }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">
            Prior altitude experience <span className="required">*</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginTop: 8 }}>
            {EXPERIENCE_OPTIONS.map(opt => (
              <div
                key={opt.id}
                className={`route-card${data.altitudeExperience === opt.id ? ' selected' : ''}`}
                style={{ padding: '14px 16px', textAlign: 'left' }}
                onClick={() => onChange({ ...data, altitudeExperience: opt.id })}
              >
                <div className="route-card__title" style={{ fontSize: '0.9rem' }}>{opt.label}</div>
                <div className="route-card__desc" style={{ fontSize: '0.78rem' }}>{opt.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between' }}>
        <button className="btn btn--ghost" onClick={onBack}>← Back</button>
        <button className="btn btn--primary" onClick={onNext} disabled={!canContinue}>
          Continue →
        </button>
      </div>
    </div>
  );
}
