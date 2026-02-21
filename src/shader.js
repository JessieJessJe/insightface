import DEMO_SHADER from './sample.glsl?raw';

export { DEMO_SHADER };

// Parse shader into lines for the code panel
export function getShaderLines(shader) {
  return shader.split('\n');
}
