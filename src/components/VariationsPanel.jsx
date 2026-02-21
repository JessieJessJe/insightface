import ShaderCanvas from './ShaderCanvas';

export default function VariationsPanel({ data, loading, error, currentShader, paramValue, onSelectVariation }) {
  if (!loading && !data && !error) return null;

  const makeVariationShader = (originalValue, newValue) => {
    // Replace the specific parameter value in the shader
    // We do a targeted replacement on the first occurrence
    return currentShader.replace(originalValue, newValue);
  };

  return (
    <div className={`variations-panel ${data || loading ? 'variations-panel-visible' : ''}`}>
      <div className="variations-header">
        {loading ? (
          <div className="interpret-loading">
            <div className="loading-pulse" />
            <span>Generating variations for <code>{paramValue}</code>...</span>
          </div>
        ) : data ? (
          <div className="variations-title">
            <span className="interpret-label">PARAMETER</span>
            <span className="variations-param-name">{data.paramName}</span>
          </div>
        ) : null}
      </div>
      
      {error && (
        <div className="interpret-error">
          <span>Could not generate variations</span>
        </div>
      )}

      {data && !loading && (
        <div className="variations-grid">
          {data.variations.map((v, i) => {
            const varShader = makeVariationShader(paramValue, v.value);
            return (
              <div
                key={i}
                className="variation-card"
                onClick={() => onSelectVariation(paramValue, v.value)}
              >
                <div className="variation-canvas-wrap">
                  <ShaderCanvas
                    shader={varShader}
                    width={200}
                    height={150}
                  />
                </div>
                <div className="variation-info">
                  <span className="variation-label">{v.label}</span>
                  <span className="variation-value">{v.value}</span>
                  <span className="variation-desc">{v.description}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
