// Lightweight WebGL renderer for Shadertoy-style shaders
export class ShaderRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!this.gl) throw new Error('WebGL not supported');
    this.program = null;
    this.startTime = performance.now();
    this.animFrame = null;
    this.setupQuad();
  }

  setupQuad() {
    const gl = this.gl;
    const vertices = new Float32Array([-1,-1, 1,-1, -1,1, 1,1]);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  }

  compile(fragmentSource) {
    const gl = this.gl;
    
    const vertSrc = `
      attribute vec2 a_pos;
      void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
    `;
    
    // Wrap Shadertoy-style code into proper GLSL
    const fragSrc = `
      precision highp float;
      uniform vec2 iResolution;
      uniform float iTime;
      
      ${fragmentSource}
      
      void main() {
        mainImage(gl_FragColor, gl_FragCoord.xy);
      }
    `;

    const vs = this.createShader(gl.VERTEX_SHADER, vertSrc);
    const fs = this.createShader(gl.FRAGMENT_SHADER, fragSrc);
    
    if (!vs || !fs) return false;

    if (this.program) gl.deleteProgram(this.program);
    
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Link error:', gl.getProgramInfoLog(program));
      return false;
    }
    
    this.program = program;
    gl.useProgram(program);
    
    const pos = gl.getAttribLocation(program, 'a_pos');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    
    this.uResolution = gl.getUniformLocation(program, 'iResolution');
    this.uTime = gl.getUniformLocation(program, 'iTime');
    
    return true;
  }

  createShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  render = () => {
    const gl = this.gl;
    if (!this.program) return;
    
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.uniform2f(this.uResolution, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.uTime, (performance.now() - this.startTime) / 1000);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
    this.animFrame = requestAnimationFrame(this.render);
  }

  start() {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    this.render();
  }

  stop() {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
  }

  destroy() {
    this.stop();
    if (this.program) this.gl.deleteProgram(this.program);
  }
}
