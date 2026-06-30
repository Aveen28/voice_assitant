import { STATE_NAMES, STATE_VISUALS } from '../config/visuals'

export function Controls({
  error,
  isListening,
  isRequesting,
  onStart,
  onStateChange,
  onStop,
  state,
}) {
  return (
    <section className="control-dock" aria-label="MYCROFT controls">
      <div className="control-actions">
        <button
          className="action-button action-button-primary"
          type="button"
          onClick={onStart}
          disabled={isListening || isRequesting}
        >
          <span className="button-glyph" aria-hidden="true" />
          {isRequesting ? 'Requesting access' : 'Start microphone'}
        </button>
        <button
          className="action-button"
          type="button"
          onClick={onStop}
          disabled={!isListening || isRequesting}
        >
          Stop
        </button>
      </div>

      <div className="state-control">
        <span className="control-label">State override</span>
        <div className="state-buttons">
          {STATE_NAMES.map((stateName) => (
            <button
              key={stateName}
              className={stateName === state ? 'state-button active' : 'state-button'}
              type="button"
              onClick={() => onStateChange(stateName)}
            >
              <span className="state-marker" aria-hidden="true" />
              {STATE_VISUALS[stateName].label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="control-error">{error}</p>}
    </section>
  )
}
