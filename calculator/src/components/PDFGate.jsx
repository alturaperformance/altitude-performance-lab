import { useState } from 'react';
import { generatePDF } from '../utils/pdfBuilder.js';

export default function PDFGate({ calcData, inputs, risk, formData }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const valid =
    form.firstName.trim().length > 0 &&
    form.lastName.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!valid) return;
    setLoading(true);
    try {
      const doc = generatePDF(
        {
          ...inputs,
          ...formData,
          unit: inputs.units,
        },
        {
          targetFt: calcData.targetFt,
          o2: calcData.o2Pct,
          o2Home: calcData.homeO2Pct,
          vo2Reduction: calcData.vo2ReductionPct,
          hrIncreasePct: calcData.hrIncreasePct,
          acclimDays: typeof calcData.acclimDays === 'object' ? calcData.acclimDays : { min: 0, max: 0, note: 'None required' },
          hydration: {
            restOz: Math.round(calcData.hydrationOz),
            activityOz: Math.round(calcData.hydrationOz * 1.2),
            liters: (calcData.hydrationOz * 1.2 * 0.02957).toFixed(1),
            multiplier: ((calcData.hydrationOz) / (0.5 * (inputs.weightLbs || 154))).toFixed(1),
          },
          riskResult: { ...risk, risk: risk.level.toLowerCase() },
          ftpAtAlt: calcData.ftpAtAltitude ? Math.round(calcData.ftpAtAltitude) : null,
          ltPaceAtAlt: calcData.ltPaceAtAltitude ? calcData.ltPaceAtAltitude.toFixed(2) : null,
          vo2max: calcData.vo2Max,
          adjustedVO2: calcData.vo2MaxAtAltitude,
          vo2Estimated: !formData.vo2Max,
          pacingAdvice: calcData.pacingAdvice || '',
          checklist: calcData.checklist || [],
          daysAvailable: calcData.daysAvailable,
        },
        form.firstName,
        form.lastName,
        inputs.eventDate
      );
      doc.save(`AltitudeReport_${form.firstName}${form.lastName}_${inputs.eventDate || 'event'}.pdf`);
      setSubmitted(true);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('There was an error generating your PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pdf-gate no-print">
      <div style={{ fontSize: '2rem', marginBottom: 12 }}>📄</div>
      <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 8 }}>
        Your personalized altitude report is ready.
      </h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: 480, margin: '0 auto 0' }}>
        Get a full PDF breakdown — physiology, training zones, timeline, nutrition, and safety protocols — personalized to your data.
      </p>

      {submitted ? (
        <div style={{ marginTop: 28, padding: '20px 24px', background: 'rgba(63,185,80,0.1)', border: '1px solid rgba(63,185,80,0.3)', borderRadius: 8, display: 'inline-block' }}>
          <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: '1rem' }}>
            ✓ Your report has been downloaded.
          </span>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 6 }}>
            A copy will be sent to {form.email}
          </p>
        </div>
      ) : (
        <form className="pdf-gate__form" onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="pdf-first">First name</label>
            <input
              id="pdf-first"
              type="text"
              className="form-input"
              value={form.firstName}
              onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
              placeholder="Alex"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="pdf-last">Last name</label>
            <input
              id="pdf-last"
              type="text"
              className="form-input"
              value={form.lastName}
              onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
              placeholder="Ridgeway"
              required
            />
          </div>

          <div className="form-group email-field" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="pdf-email">Email address</label>
            <input
              id="pdf-email"
              type="email"
              className="form-input"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="alex@example.com"
              required
            />
          </div>

          <div className="submit-btn">
            <button
              type="submit"
              className="btn btn--primary"
              disabled={!valid || loading}
              style={{ width: '100%', justifyContent: 'center', padding: '12px 20px' }}
            >
              {loading ? 'Generating…' : 'Download My Report'}
            </button>
          </div>
        </form>
      )}

      <p className="disclaimer">
        Your information is used only to personalize your report and will not be shared with third parties.
      </p>
    </div>
  );
}
