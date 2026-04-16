import { useState } from 'react';
import { getDayOfChecklist } from '../utils/activityModifiers.js';

export default function DayOfChecklist({ activity, targetElevationFt, overnightAtAltitude, riskLevel }) {
  const items = getDayOfChecklist({ activity, targetElevationFt, overnightAtAltitude });

  // Add a pulse oximeter item if risk is moderate/high
  const allItems = [
    ...items,
    ...(riskLevel === 'moderate' || riskLevel === 'high'
      ? ['Carry a pulse oximeter — monitor SpO₂ during and after the activity']
      : []),
    'Know the location of the nearest medical facility',
    'Set a firm turnaround time regardless of summit or finish line conditions',
  ];

  const [checked, setChecked] = useState({});

  const toggle = (i) => setChecked(prev => ({ ...prev, [i]: !prev[i] }));

  return (
    <div className="checklist no-print">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Day-Of Checklist
        </h3>
        <button
          className="btn btn--ghost"
          style={{ fontSize: '0.78rem', padding: '6px 14px' }}
          onClick={() => window.print()}
          title="Print checklist"
        >
          Print Checklist
        </button>
      </div>

      {allItems.map((item, i) => (
        <label key={i} className="checklist__item" style={{ cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={!!checked[i]}
            onChange={() => toggle(i)}
          />
          <span style={{ textDecoration: checked[i] ? 'line-through' : 'none', color: checked[i] ? 'var(--text-muted)' : 'var(--text)' }}>
            {item}
          </span>
        </label>
      ))}
    </div>
  );
}
