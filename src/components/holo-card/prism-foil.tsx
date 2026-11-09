import { useEffect, useRef } from "react";

const MAX_DPR = 2;
const VERTEX = "attribute vec2 a;void main(){gl_Position=vec4(a,0.0,1.0);}";

/** A triangle tessellation in three orientations: each facet takes its colour from the angle between light and view. */
const FRAGMENT = `
precision highp float;
uniform vec2 u_res;
uniform vec2 u_pointer;
uniform float u_active;

const vec2 CARD = vec2(1200.0, 630.0);
const vec3 STOCK = vec3(0.106, 0.099, 0.094);
const float TAU = 6.28318;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453);
}

vec3 hue(float t) {
  return 0.5 + 0.5 * cos(TAU * (t + vec3(0.0, 0.33, 0.67)));
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = vec2(uv.x, 1.0 - uv.y) * CARD;
  vec2 light = (u_pointer - 0.5) * vec2(1.5, 1.1);
  vec2 view = (p / CARD - 0.5) * vec2(0.62, 0.33);
  vec2 h = light - view + vec2(0.24, -0.16);

  vec2 q = vec2(p.x - p.y * 0.57735, p.y * 1.1547) / 26.0;
  vec2 id = floor(q);
  vec2 f = fract(q);
  float up = step(f.x + f.y, 1.0);
  float facet = mod(id.x + id.y * 2.0 + up, 3.0);
  float edge = min(min(f.x, f.y), abs(1.0 - f.x - f.y) * 0.707);
  float angle = 0.8 + (facet - 1.0) * 0.5 + up * 0.25;
  vec2 grooves = vec2(cos(angle), sin(angle));

  vec3 c = hue(abs(dot(grooves, h + (facet - 1.0) * 0.05)) * 1500.0 / 900.0);
  c += 0.4 * exp(-pow(dot(grooves, h) - 0.2, 2.0) * 40.0);
  c *= mix(0.72, 1.0, smoothstep(0.0, 0.1, edge)) * 0.72;

  float luma = dot(c, vec3(0.3, 0.59, 0.11));
  c = mix(c, luma * vec3(0.96, 0.98, 1.05), 0.38);
  float gleam = exp(-dot(h, h) * 1.6);
  float amount = (0.2 + 0.34 * gleam) * mix(0.85, 1.15, u_active);
  float grain = (hash(p) - 0.5) * 0.012;
  gl_FragColor = vec4(STOCK + c * amount + grain, 1.0);
}
`;

const compile = (gl: WebGLRenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type);
  if (!shader) {
    return null;
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
};

const buildProgram = (gl: WebGLRenderingContext) => {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!(vertex && fragment && program)) {
    return null;
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  return gl.getProgramParameter(program, gl.LINK_STATUS) ? program : null;
};

const lightAxis = (card: HTMLElement, name: string) => {
  const percent = card.style.getPropertyValue(name);
  return percent ? Number(percent.replace("%", "")) / 100 : 0.5;
};

/** Draws only when useTilt moves the light, so a card at rest costs nothing. Returns how to stop, or nothing without WebGL. */
const startFoil = (canvas: HTMLCanvasElement, card: HTMLElement) => {
  const gl = canvas.getContext("webgl", {
    antialias: false,
    powerPreference: "low-power",
  });
  const program = gl ? buildProgram(gl) : null;
  if (!(gl && program)) {
    return;
  }
  gl.useProgram(program);
  const triangle = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, triangle);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW
  );
  const position = gl.getAttribLocation(program, "a");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const res = gl.getUniformLocation(program, "u_res");
  const pointer = gl.getUniformLocation(program, "u_pointer");
  const active = gl.getUniformLocation(program, "u_active");

  let frame = 0;
  const draw = () => {
    frame = 0;
    gl.uniform2f(pointer, lightAxis(card, "--px"), lightAxis(card, "--py"));
    gl.uniform1f(active, Number(card.style.getPropertyValue("--active")));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const schedule = () => {
    if (!frame) {
      frame = requestAnimationFrame(draw);
    }
  };

  const resize = new ResizeObserver(() => {
    const scale = Math.min(window.devicePixelRatio, MAX_DPR);
    canvas.width = Math.round(canvas.clientWidth * scale);
    canvas.height = Math.round(canvas.clientHeight * scale);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(res, canvas.width, canvas.height);
    schedule();
  });
  resize.observe(canvas);
  const lightMoved = new MutationObserver(schedule);
  lightMoved.observe(card, { attributes: true, attributeFilter: ["style"] });

  return () => {
    cancelAnimationFrame(frame);
    resize.disconnect();
    lightMoved.disconnect();
    gl.deleteBuffer(triangle);
    gl.deleteProgram(program);
  };
};

/** The prismatic tier's foil. Where WebGL is missing, the card keeps its plain stock. */
export const PrismFoil = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const card = canvas?.closest<HTMLElement>(".holo");
    return canvas && card ? startFoil(canvas, card) : undefined;
  }, []);
  return <canvas ref={canvasRef} className="holo-prism" />;
};
