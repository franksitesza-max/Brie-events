(() => {
  "use strict";

  const mount = document.querySelector("[data-molten-metal]");
  const section = document.querySelector("[data-molten-section]");
  if (!mount || !section) return;

  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    powerPreference: "low-power",
    premultipliedAlpha: false,
    preserveDrawingBuffer: false
  });

  if (!gl) {
    mount.classList.add("molten-metal-fallback");
    return;
  }

  const vertexSource = `#version 300 es
    precision highp float;
    void main() {
      vec2 point = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
      gl_Position = vec4(point * 2.0 - 1.0, 0.0, 1.0);
    }
  `;

  const fragmentSource = `#version 300 es
    precision highp float;

    uniform vec2 uResolution;
    uniform float uTime;
    uniform vec2 uPointer;
    out vec4 outputColor;

    float hash(vec2 point) {
      return fract(sin(dot(point, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      float time = uTime * 0.24;
      vec2 point = 4.5 * ((gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y) - 0.5;
      point += (uPointer - 0.5) * 0.28;

      vec2 field = point;
      float glow = 0.0;
      float radius = length(point + vec2(sin(time), sin(time * 0.3 + 5.0)) * 0.5);
      float distanceFromCenter = length(point);
      float rotation = distanceFromCenter + time + point.x * 0.72;
      float cosine = cos(rotation);
      mat2 warp = mat2(
        cos(rotation - sin(time / 5.0)),
        sin(rotation),
        -sin(cosine - time),
        cosine
      ) * -0.22;

      for (float iteration = 0.0; iteration < 3.0; iteration++) {
        point *= warp;
        float phase = radius - time / (iteration + 3.0);
        field -= point + vec2(
          cos(phase - field.x - radius) + sin(phase + field.y),
          sin(phase - field.y) + cos(phase + field.x) + radius
        );
        glow += 0.205 / max(length(vec2(sin(field.x + phase), cos(field.y + phase))), 0.001);
      }

      glow /= 6.0;
      float intensity = max(glow - 0.052, 0.0) * 1.42;
      float gradient = clamp(intensity, 0.0, 1.0);

      vec3 shadow = vec3(0.12, 0.015, 0.035);
      vec3 roseGold = vec3(0.74, 0.255, 0.31);
      vec3 champagne = vec3(1.0, 0.86, 0.62);
      vec3 color = mix(shadow, roseGold, smoothstep(0.0, 0.5, gradient));
      color = mix(color, champagne, smoothstep(0.5, 1.0, gradient));

      float grain = (hash(gl_FragCoord.xy + uTime) - 0.5) * 0.022;
      outputColor = vec4(max(color + grain, 0.0), 1.0);
    }
  `;

  const compileShader = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };

  const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) {
    mount.classList.add("molten-metal-fallback");
    return;
  }

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    mount.classList.add("molten-metal-fallback");
    return;
  }

  mount.appendChild(canvas);
  gl.useProgram(program);
  gl.bindVertexArray(gl.createVertexArray());

  const resolutionLocation = gl.getUniformLocation(program, "uResolution");
  const timeLocation = gl.getUniformLocation(program, "uTime");
  const pointerLocation = gl.getUniformLocation(program, "uPointer");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const pointerTarget = [0.5, 0.5];
  const pointerCurrent = [0.5, 0.5];
  const startedAt = performance.now();
  let frame = 0;
  let visible = true;

  const resize = () => {
    const bounds = mount.getBoundingClientRect();
    const density = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = Math.max(1, Math.round(bounds.width * density));
    const height = Math.max(1, Math.round(bounds.height * density));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
  };

  const draw = now => {
    resize();
    pointerCurrent[0] += (pointerTarget[0] - pointerCurrent[0]) * 0.04;
    pointerCurrent[1] += (pointerTarget[1] - pointerCurrent[1]) * 0.04;
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
    gl.uniform1f(timeLocation, (now - startedAt) * 0.001);
    gl.uniform2f(pointerLocation, pointerCurrent[0], pointerCurrent[1]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (!reducedMotion.matches && visible && !document.hidden) {
      frame = requestAnimationFrame(draw);
    } else {
      frame = 0;
    }
  };

  const start = () => {
    if (frame || !visible || document.hidden) return;
    frame = requestAnimationFrame(draw);
  };

  const stop = () => {
    if (!frame) return;
    cancelAnimationFrame(frame);
    frame = 0;
  };

  const updateMotion = () => {
    stop();
    if (reducedMotion.matches) {
      draw(startedAt + 1400);
    } else {
      start();
    }
  };

  const onPointerMove = event => {
    if (reducedMotion.matches) return;
    const bounds = section.getBoundingClientRect();
    pointerTarget[0] = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
    pointerTarget[1] = Math.min(1, Math.max(0, 1 - (event.clientY - bounds.top) / bounds.height));
  };

  const onPointerLeave = () => {
    pointerTarget[0] = 0.5;
    pointerTarget[1] = 0.5;
  };

  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    visible ? updateMotion() : stop();
  });
  const resizeObserver = new ResizeObserver(() => {
    resize();
    if (reducedMotion.matches) draw(startedAt + 1400);
  });

  section.addEventListener("pointermove", onPointerMove, { passive: true });
  section.addEventListener("pointerleave", onPointerLeave, { passive: true });
  document.addEventListener("visibilitychange", updateMotion);
  reducedMotion.addEventListener("change", updateMotion);
  visibilityObserver.observe(section);
  resizeObserver.observe(mount);
  updateMotion();
})();