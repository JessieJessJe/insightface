import { useState, useCallback, useRef } from 'react';
import { DEMO_SHADER, getShaderLines } from './shader';
import ShaderCanvas from './components/ShaderCanvas';
import CodePanel from './components/CodePanel';
import InterpretPanel from './components/InterpretPanel';
import VariationsPanel from './components/VariationsPanel';
import './App.css';

const API_BASE = 'http://localhost:3001/api';

function App() {
  const [currentShader, setCurrentShader] = useState(DEMO_SHADER);
  const [hoveredLine, setHoveredLine] = useState(null);
  const [selectedLines, setSelectedLines] = useState(new Set());
  const [lastClickedLine, setLastClickedLine] = useState(null);
  const [interpretData, setInterpretData] = useState(null);
  const [interpretLoading, setInterpretLoading] = useState(false);
  const [interpretError, setInterpretError] = useState(null);

  const [activeParam, setActiveParam] = useState(null);
  const [variationsData, setVariationsData] = useState(null);
  const [variationsLoading, setVariationsLoading] = useState(false);
  const [variationsError, setVariationsError] = useState(null);
  const [selectedParamValue, setSelectedParamValue] = useState(null);

  const interpretCache = useRef({});
  const lines = getShaderLines(currentShader);

  // Hover is cosmetic only — no API call
  const handleHoverLine = useCallback((idx) => {
    setHoveredLine(idx);
  }, []);

  const handleLeaveLine = useCallback(() => {
    // Keep hover state for cosmetic purposes
  }, []);

  // Click to select/deselect lines, shift+click for range
  const handleSelectLine = useCallback((idx, shiftKey) => {
    setSelectedLines(prev => {
      const next = new Set(prev);
      if (shiftKey && lastClickedLine !== null) {
        const from = Math.min(lastClickedLine, idx);
        const to = Math.max(lastClickedLine, idx);
        for (let i = from; i <= to; i++) {
          next.add(i);
        }
      } else {
        if (next.has(idx)) {
          next.delete(idx);
        } else {
          next.add(idx);
        }
      }
      return next;
    });
    setLastClickedLine(idx);
    // Clear previous results when selection changes
    setInterpretData(null);
    setInterpretError(null);
  }, [lastClickedLine]);

  const handleClearSelection = useCallback(() => {
    setSelectedLines(new Set());
    setLastClickedLine(null);
    setInterpretData(null);
    setInterpretError(null);
  }, []);

  // Analyze selected lines — calls API
  const handleAnalyze = useCallback(async () => {
    const sortedIndices = [...selectedLines].sort((a, b) => a - b);
    if (sortedIndices.length === 0) return;

    const cacheKey = sortedIndices.join(',');
    if (interpretCache.current[cacheKey]) {
      setInterpretData(interpretCache.current[cacheKey]);
      return;
    }

    const selectedLineTexts = sortedIndices.map(i => lines[i]);

    setInterpretLoading(true);
    setInterpretError(null);
    setInterpretData(null);

    try {
      const res = await fetch(`${API_BASE}/interpret`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullShader: currentShader,
          selectedLines: selectedLineTexts,
          lineIndices: sortedIndices,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      interpretCache.current[cacheKey] = data;
      setInterpretData(data);
    } catch (err) {
      console.error(err);
      setInterpretError(err.message);
    } finally {
      setInterpretLoading(false);
    }
  }, [selectedLines, currentShader, lines]);

  const handleParamClick = useCallback(async (paramId, value, lineContent, lineIndex) => {
    setActiveParam(paramId);
    setSelectedParamValue(value);
    setVariationsLoading(true);
    setVariationsError(null);
    setVariationsData(null);

    try {
      const res = await fetch(`${API_BASE}/variations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullShader: currentShader,
          paramValue: value,
          paramContext: lineContent,
          lineIndex,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setVariationsData(data);
    } catch (err) {
      console.error(err);
      setVariationsError(err.message);
    } finally {
      setVariationsLoading(false);
    }
  }, [currentShader]);

  const handleSelectVariation = useCallback((oldValue, newValue) => {
    setCurrentShader(prev => prev.replace(oldValue, newValue));
    setVariationsData(null);
    setActiveParam(null);
    setSelectedParamValue(null);
    // Shader changed — clear selection and cache (lines are stale)
    setSelectedLines(new Set());
    setLastClickedLine(null);
    setInterpretData(null);
    setInterpretError(null);
    interpretCache.current = {};
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">
          <span className="logo-icon">◈</span>
          <span className="logo-text">insightface</span>
        </div>
        <p className="tagline">Select to understand · Click to explore</p>
      </header>

      <main className="app-main">
        <div className="left-panel">
          <CodePanel
            lines={lines}
            onHoverLine={handleHoverLine}
            onLeaveLine={handleLeaveLine}
            hoveredLine={hoveredLine}
            selectedLines={selectedLines}
            lastClickedLine={lastClickedLine}
            onSelectLine={handleSelectLine}
            onParamClick={handleParamClick}
            activeParam={activeParam}
            onAnalyze={handleAnalyze}
            onClearSelection={handleClearSelection}
            showAnalyzePopup={selectedLines.size > 0 && !interpretLoading && !interpretData}
          />
        </div>

        <div className="right-panel">
          <div className="main-canvas-wrap">
            <ShaderCanvas
              shader={currentShader}
              className="main-canvas"
            />
            <div className="canvas-label">LIVE OUTPUT</div>
          </div>
          <InterpretPanel
            data={interpretData}
            loading={interpretLoading}
            error={interpretError}
            selectedLines={selectedLines}
            lines={lines}
            onClearSelection={handleClearSelection}
          />
          <VariationsPanel
            data={variationsData}
            loading={variationsLoading}
            error={variationsError}
            currentShader={currentShader}
            paramValue={selectedParamValue}
            onSelectVariation={handleSelectVariation}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
