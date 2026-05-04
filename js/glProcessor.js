export function initGL(canvas) {
  // Initialize WebGL context and shaders
  const gl = canvas.getContext("webgl");
  if (!gl) {
    console.warn("WebGL not supported");
    return {
      renderFrame() {},
      extractImageData() { return null; }
    };
  }

  // Vertex shader
  // Sets up a full-screen quad and passes texture coordinates
  const vsSource = `
    attribute vec2 aPosition;
    attribute vec2 aTexCoord;
    varying vec2 vTexCoord;
    void main() {
      gl_Position = vec4(aPosition, 0.0, 1.0);
      vTexCoord = aTexCoord;
    }
  `;

  // Fragment shader: color and contrast manipulation
  // Applies color gain and contrast adjustment
  const fsSource = `
    precision mediump float;
    uniform sampler2D uVideo;
    uniform vec3 uGain;
    uniform float uContrast;
    uniform float uBrightness;
    uniform float uBrilliance;
    uniform float uSaturation;
    varying vec2 vTexCoord;

    vec3 applyContrast(vec3 color, float contrast) {
      return clamp((color - 0.5) * contrast + 0.5, 0.0, 1.0);
    }

    vec3 applySaturation(vec3 color, float saturation) {
      float gray = dot(color, vec3(0.299, 0.587, 0.114));
      return mix(vec3(gray), color, saturation);
    }

    void main() {
      vec3 color = texture2D(uVideo, vTexCoord).rgb;
      color *= uGain;
      color = applyContrast(color, uContrast);
      color = applySaturation(color, uSaturation);
      color += vec3(uBrightness); 
      // apply brilliance as a multiplier around 1.0
      color *= (1.0 + uBrilliance);
      color = clamp(color, 0.0, 1.0);
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  // Shader compilation helper with error checking
  function compile(type, source) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, source);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(sh);
      gl.deleteShader(sh);
      throw new Error("Shader compile error: " + log);
    }
    return sh;
  }

  // Compile vertex and fragment shaders, link program
  let vs, fs, program;
  try {
    vs = compile(gl.VERTEX_SHADER, vsSource);
    fs = compile(gl.FRAGMENT_SHADER, fsSource);
    program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error("Program link error: " + log);
    }
    gl.useProgram(program);
  } catch (err) {
    console.error("WebGL shader error:", err.message);
    return {
      renderFrame() {},
      extractImageData() { return null; }
    };
  }

  // Attribute locations for quad vertices and texture coordinates
  const positionLoc = gl.getAttribLocation(program, "aPosition");
  const texCoordLoc = gl.getAttribLocation(program, "aTexCoord");

  // Fullscreen quad
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1, 0, 1,
     1, -1, 1, 1,
    -1,  1, 0, 0,
     1,  1, 1, 0
  ]), gl.STATIC_DRAW);

  // Enable and set up attributes
  gl.enableVertexAttribArray(positionLoc);
  gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(texCoordLoc);
  gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 16, 8);

  // Create texture for video frame
  const videoTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, videoTex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  // Uniform locations
  const uVideoLoc    = gl.getUniformLocation(program, "uVideo");
  const uGainLoc     = gl.getUniformLocation(program, "uGain");
  const uContrastLoc = gl.getUniformLocation(program, "uContrast");
  const uBrightnessLoc = gl.getUniformLocation(program, "uBrightness");
  const uBrillianceLoc = gl.getUniformLocation(program, "uBrilliance");
  const uSaturationLoc = gl.getUniformLocation(program, "uSaturation");

  gl.uniform1i(uVideoLoc, 0); // TEXTURE0

  return {
    setMode() {
      // No-op for color/contrast only
    },

    // Render current video frame with given gain, contrast, brightness, brilliance, and saturation
    renderFrame(videoEl, gain, contrast, brightness, brilliance, saturation) {
      const w = canvas.width, h = canvas.height;
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.uniform3fv(uGainLoc, gain);
      gl.uniform1f(uContrastLoc, contrast);
      gl.uniform1f(uBrightnessLoc, brightness || 0.0);
      gl.uniform1f(uBrillianceLoc, brilliance || 0.0);
      gl.uniform1f(uSaturationLoc, saturation || 1.0);

      // Upload current video frame into videoTex (unit 0)
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, videoTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, videoEl);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },

    // Helper: extract current frame as ImageData for OCR
    extractImageData() {
      // Draw current canvas to a 2D context and get ImageData
      const w = canvas.width, h = canvas.height;
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = w;
      tempCanvas.height = h;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(canvas, 0, 0, w, h);
      return tempCtx.getImageData(0, 0, w, h);
    }
  };
}
