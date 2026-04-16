export default function RouteSelector({ onSelect, onBack }) {
  return (
    <div>
      <h2 className="section-title">How would you like to proceed?</h2>
      <p className="section-sub">Choose the path that best matches your data availability.</p>

      <div className="route-fork">
        <div className="route-card" onClick={() => onSelect('simple')}>
          <div className="route-card__icon">🎯</div>
          <div className="route-card__title">Quick Assessment</div>
          <div className="route-card__desc">
            I don't track biometric data. Give me useful estimates based on age, fitness level, and experience.
          </div>
        </div>

        <div className="route-card" onClick={() => onSelect('advanced')}>
          <div className="route-card__icon">⌚</div>
          <div className="route-card__title">Wearable &amp; Training Data</div>
          <div className="route-card__desc">
            I have heart rate, VO₂ max, FTP, or other training metrics to enter for a more precise report.
          </div>
        </div>
      </div>

      <div style={{ marginTop: 32 }}>
        <button className="btn btn--ghost" onClick={onBack}>← Back</button>
      </div>
    </div>
  );
}
