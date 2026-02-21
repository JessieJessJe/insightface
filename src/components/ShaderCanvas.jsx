import { useEffect, useRef } from 'react';
import { ShaderRenderer } from '../renderer';

export default function ShaderCanvas({ shader, width, height, className, style }) {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = width || canvas.clientWidth;
    canvas.height = height || canvas.clientHeight;

    if (!rendererRef.current) {
      rendererRef.current = new ShaderRenderer(canvas);
    }

    const success = rendererRef.current.compile(shader);
    if (success) {
      rendererRef.current.start();
    }

    return () => {
      if (rendererRef.current) {
        rendererRef.current.stop();
      }
    };
  }, [shader, width, height]);

  // Handle resize
  useEffect(() => {
    if (!width && !height) {
      const canvas = canvasRef.current;
      const obs = new ResizeObserver(entries => {
        for (const entry of entries) {
          canvas.width = entry.contentRect.width;
          canvas.height = entry.contentRect.height;
        }
      });
      obs.observe(canvas);
      return () => obs.disconnect();
    }
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        display: 'block',
        ...style,
      }}
    />
  );
}
