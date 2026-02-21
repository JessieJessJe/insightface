import { useCallback } from 'react';

// Simple GLSL syntax highlighting
function highlightLine(line, lineIdx, onParamClick, activeParam) {
  const tokens = [];
  let remaining = line;
  let keyIdx = 0;

  const patterns = [
    { regex: /^(\/\/.*)/, cls: 'tok-comment' },
    { regex: /^(float|vec[234]|int|mat[234]|void|bool|for|if|else|return|in|out|uniform|precision|highp|mediump|lowp|attribute)\b/, cls: 'tok-keyword' },
    { regex: /^(sin|cos|tan|length|normalize|clamp|mix|smoothstep|max|min|pow|abs|dot|reflect|cross|exp|sqrt|step|mod|fract|floor|ceil|sign|atan)\b/, cls: 'tok-builtin' },
    { regex: /^(mainImage|scene|getNormal|sdSphere|sdPlane|smin)\b/, cls: 'tok-function' },
    { regex: /^(iResolution|iTime|fragColor|fragCoord|gl_FragColor|gl_FragCoord)\b/, cls: 'tok-uniform' },
  ];

  // Regex for numeric literals (the clickable params)
  const numRegex = /^(-?\d+\.?\d*)/;

  while (remaining.length > 0) {
    let matched = false;

    // Try syntax patterns
    for (const { regex, cls } of patterns) {
      const m = remaining.match(regex);
      if (m) {
        tokens.push(
          <span key={keyIdx++} className={cls}>{m[1]}</span>
        );
        remaining = remaining.slice(m[1].length);
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Try numeric literal (clickable)
      const numMatch = remaining.match(numRegex);
      if (numMatch && (tokens.length === 0 || remaining === line || /[\s(,=+\-*/]/.test(remaining.charAt(0) === '-' ? ' ' : line.charAt(line.length - remaining.length - 1)))) {
        const val = numMatch[1];
        const paramId = `${lineIdx}-${line.length - remaining.length}`;
        const isActive = activeParam === paramId;
        tokens.push(
          <span
            key={keyIdx++}
            className={`tok-number ${isActive ? 'tok-number-active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onParamClick(paramId, val, line, lineIdx);
            }}
            title="Click to explore variations"
          >
            {val}
          </span>
        );
        remaining = remaining.slice(val.length);
        matched = true;
      }
    }

    if (!matched) {
      // Default: single character
      tokens.push(<span key={keyIdx++}>{remaining[0]}</span>);
      remaining = remaining.slice(1);
    }
  }

  return tokens;
}

export default function CodePanel({ lines, onHoverLine, onLeaveLine, hoveredLine, selectedLines, onSelectLine, onParamClick, activeParam }) {
  const handleClick = useCallback((idx, e) => {
    onSelectLine(idx, e.shiftKey);
  }, [onSelectLine]);

  return (
    <div className="code-panel">
      <div className="code-header">
        <span className="code-dot red" />
        <span className="code-dot yellow" />
        <span className="code-dot green" />
        <span className="code-filename">scene.glsl</span>
      </div>
      <pre className="code-body">
        {lines.map((line, idx) => {
          const isSelected = selectedLines.has(idx);
          const isHovered = hoveredLine === idx;
          return (
            <div
              key={idx}
              className={`code-line${isSelected ? ' code-line-selected' : ''}${isHovered && !isSelected ? ' code-line-hovered' : ''}`}
              onMouseEnter={() => onHoverLine(idx)}
              onMouseLeave={onLeaveLine}
              onClick={(e) => handleClick(idx, e)}
            >
              <span className="line-number">{String(idx + 1).padStart(2, ' ')}</span>
              <span className="line-content">
                {highlightLine(line, idx, onParamClick, activeParam)}
              </span>
            </div>
          );
        })}
      </pre>
    </div>
  );
}
