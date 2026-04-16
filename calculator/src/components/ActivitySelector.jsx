import { ACTIVITIES } from '../utils/activityModifiers.js';

const INTENSITIES = ['Easy', 'Moderate', 'Race Effort'];
const OVERNIGHTS = ['yes', 'no', 'unsure'];
const OVERNIGHT_LABELS = { yes: 'Yes', no: 'No', unsure: 'Unsure' };

export default function ActivitySelector({ data, onChange, onNext, units }) {
  const selected = data.activity || null;
  const selectedActivity = ACTIVITIES.find(a => a.id === selected);

  const canContinue =
    data.activity &&
    data.subtype &&
    data.duration &&
    data.intensity &&
    data.overnightAtAltitude;

  return (
    <div>
      <h2 className="section-title">What are you training for?</h2>
      <p className="section-sub">Select your primary activity at altitude.</p>

      <div className="activity-grid">
        {ACTIVITIES.map(act => (
          <div
            key={act.id}
            className={`activity-card${data.activity === act.id ? ' selected' : ''}`}
            onClick={() => onChange({ ...data, activity: act.id, subtype: '', intensity: '', overnightAtAltitude: '' })}
          >
            <div className="icon">{act.icon}</div>
            <div className="label">{act.label}</div>
          </div>
        ))}
      </div>

      {selectedActivity && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="form-group">
            <label className="form-label">
              Subtype <span className="required">*</span>
            </label>
            <div className="pill-group">
              {selectedActivity.subTypes.map(st => (
                <button
                  key={st}
                  className={`pill${data.subtype === st ? ' selected' : ''}`}
                  onClick={() => onChange({ ...data, subtype: st })}
                  type="button"
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="duration">
              Expected duration (hours) <span className="required">*</span>
            </label>
            <input
              id="duration"
              type="number"
              className="form-input"
              min="0.5"
              max="24"
              step="0.5"
              value={data.duration || ''}
              onChange={e => onChange({ ...data, duration: e.target.value })}
              placeholder="e.g. 4"
              style={{ maxWidth: 160 }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Intensity level <span className="required">*</span>
            </label>
            <div className="pill-group">
              {INTENSITIES.map(lvl => (
                <button
                  key={lvl}
                  className={`pill${data.intensity === lvl ? ' selected' : ''}`}
                  onClick={() => onChange({ ...data, intensity: lvl })}
                  type="button"
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              Will you sleep at altitude the night(s) before or during your event? <span className="required">*</span>
              <span className="form-label__hint">Sleeping at altitude accelerates acclimatization — even one night matters.</span>
            </label>
            <div className="pill-group">
              {OVERNIGHTS.map(opt => (
                <button
                  key={opt}
                  className={`pill${data.overnightAtAltitude === opt ? ' selected' : ''}`}
                  onClick={() => onChange({ ...data, overnightAtAltitude: opt })}
                  type="button"
                >
                  {OVERNIGHT_LABELS[opt]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn--primary" onClick={onNext} disabled={!canContinue}>
          Continue to Profile →
        </button>
      </div>
    </div>
  );
}
