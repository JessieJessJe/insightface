import ShaderCanvas from './ShaderCanvas';

function SelectedCodeBlock({ selectedLines, lines }) {
  const sortedIndices = [...selectedLines].sort((a, b) => a - b);
  return (
    <div className="selected-code-block">
      <pre className="selected-code-pre">
        {sortedIndices.map(idx => (
          <div key={idx} className="selected-code-line">
            <span className="selected-code-lineno">{String(idx + 1).padStart(2, ' ')}</span>
            {lines[idx]}
          </div>
        ))}
      </pre>
    </div>
  );
}

export default function InterpretPanel({ data, loading, error, selectedLines, lines, onAnalyze, onClearSelection }) {
  const hasSelection = selectedLines.size > 0;
  const count = selectedLines.size;

  // Empty state: no selection, no data
  if (!hasSelection && !data && !loading && !error) {
    return (
      <div className="interpret-panel">
        <div className="interpret-placeholder">
          <div className="interpret-placeholder-icon">◈</div>
          <p>Select lines of shader code, then analyze.</p>
          <p>Click any <span className="interpret-placeholder-number">number</span> to explore parameter variations.</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="interpret-panel">
        <SelectedCodeBlock selectedLines={selectedLines} lines={lines} />
        <div className="interpret-loading">
          <div className="loading-pulse" />
          <span>Claude is analyzing {count} line{count !== 1 ? 's' : ''}...</span>
        </div>
      </div>
    );
  }

  // Results state
  if (data) {
    return (
      <div className="interpret-panel">
        <SelectedCodeBlock selectedLines={selectedLines} lines={lines} />
        <div className="interpret-explanation">
          <div className="interpret-label">WHAT THIS DOES</div>
          <p>{data.explanation}</p>
        </div>
        <div className="interpret-preview">
          <div className="interpret-label">ISOLATED OUTPUT</div>
          <div className="interpret-canvas-wrap">
            <ShaderCanvas
              shader={data.isolationShader}
              width={280}
              height={200}
            />
          </div>
        </div>
        <div className="analyze-actions">
          <button className="clear-selection-btn" onClick={onClearSelection}>Clear</button>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="interpret-panel">
        {hasSelection && <SelectedCodeBlock selectedLines={selectedLines} lines={lines} />}
        <div className="interpret-error">
          <span>Could not interpret: {error}</span>
        </div>
        <div className="analyze-actions">
          <button className="analyze-btn" onClick={onAnalyze}>Retry</button>
          <button className="clear-selection-btn" onClick={onClearSelection}>Clear</button>
        </div>
      </div>
    );
  }

  // Preview state: selection exists, no data yet
  return (
    <div className="interpret-panel">
      <SelectedCodeBlock selectedLines={selectedLines} lines={lines} />
      <div className="analyze-actions">
        <button className="analyze-btn" onClick={onAnalyze}>
          Analyze {count === 1 ? 'Line' : `${count} Lines`}
        </button>
        <button className="clear-selection-btn" onClick={onClearSelection}>Clear</button>
      </div>
    </div>
  );
}
