export default function UnitToggle({ units, setUnits }) {
  return (
    <div className="unit-toggle" title="Switch between Imperial and Metric units">
      <button
        className={`unit-toggle__btn${units === 'imperial' ? ' active' : ''}`}
        onClick={() => setUnits('imperial')}
      >
        Imperial
      </button>
      <button
        className={`unit-toggle__btn${units === 'metric' ? ' active' : ''}`}
        onClick={() => setUnits('metric')}
      >
        Metric
      </button>
    </div>
  );
}
