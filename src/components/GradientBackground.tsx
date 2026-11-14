"use client";

import { useEffect, useRef } from "react";

const VERT = `
attribute vec2 a;
void main() { gl_Position = vec4(a, 0.0, 1.0); }
`;

// Domain-warped noise in sunset colours. The pointer bends the field and casts a warm
// light; clicks send out a soft ripple. Tuned dark so text stays readable on top.
const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uScroll;
uniform vec2 uClick;
uniform float uClickAge;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float ar = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * ar, uv.y);
  vec2 m = vec2(uMouse.x * ar, uMouse.y);
  vec2 d = p - m;
  float near = exp(-dot(d, d) * 4.0);
  float t = uTime * 0.045;

  vec2 q = vec2(fbm(p * 1.3 + t), fbm(p * 1.3 - t + 3.1));
  vec2 r = vec2(
    fbm(p * 1.5 + q * 1.9 + vec2(1.7, 9.2) + t * 1.2 - d * near * 1.4),
    fbm(p * 1.5 + q * 1.9 + vec2(8.3, 2.8) - t + d * near * 1.4)
  );
  float f = fbm(p * 1.1 + r * 1.6 + vec2(0.0, uScroll * 0.12));

  vec3 ink     = vec3(0.039, 0.027, 0.078);
  vec3 plum    = vec3(0.165, 0.070, 0.250);
  vec3 violet  = vec3(0.424, 0.169, 0.851);
  vec3 magenta = vec3(1.000, 0.239, 0.545);
  vec3 coral   = vec3(1.000, 0.416, 0.239);
  vec3 amber   = vec3(1.000, 0.702, 0.278);

  vec3 col = mix(ink, plum, smoothstep(0.15, 0.75, f));
  col = mix(col, violet, smoothstep(0.45, 0.85, r.x) * 0.55);
  col = mix(col, magenta, smoothstep(0.45, 0.95, r.y * f * 1.8) * 0.5);
  col = mix(col, coral, smoothstep(0.55, 0.95, q.y * r.y * 1.6) * 0.38);

  // pointer light
  col += amber * near * 0.32 + magenta * exp(-dot(d, d) * 1.1) * 0.14;

  // click ripple
  vec2 c = vec2(uClick.x * ar, uClick.y);
  float ring = length(p - c) - uClickAge * 0.9;
  col += mix(amber, magenta, 0.5) * exp(-ring * ring * 90.0) * exp(-uClickAge * 1.8) * 0.35;

  col = mix(ink, col, 0.74);
  col *= 1.0 - 0.3 * length(uv - 0.5);
  gl_FragColor = vec4(col, 1.0);
}
`;

export default function GradientBackground() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const gl = c.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) return; // CSS fallback gradient stays visible

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = u("uRes"), uTime = u("uTime"), uMouse = u("uMouse"), uScroll = u("uScroll");
    const uClick = u("uClick"), uClickAge = u("uClickAge");

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const SCALE = 0.5; // render at half res; it's a soft gradient so upscaling is invisible
    const resize = () => {
      c.width = Math.max(1, Math.round(window.innerWidth * SCALE));
      c.height = Math.max(1, Math.round(window.innerHeight * SCALE));
      gl.viewport(0, 0, c.width, c.height);
      gl.uniform2f(uRes, c.width, c.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const mouse = { x: 0.5, y: 0.6 };
    const target = { x: 0.5, y: 0.6 };
    const click = { x: -5, y: -5, at: -100 };
    const onMove = (e: PointerEvent) => {
      target.x = e.clientX / window.innerWidth;
      target.y = 1 - e.clientY / window.innerHeight;
    };
    const onDown = (e: PointerEvent) => {
      click.x = e.clientX / window.innerWidth;
      click.y = 1 - e.clientY / window.innerHeight;
      click.at = performance.now();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });

    let raf = 0;
    const start = performance.now();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      // Skip work while the hero video fully covers the viewport
      const hero = document.getElementById("home");
      if (hero && window.scrollY < hero.offsetHeight - window.innerHeight * 1.05) return;
      mouse.x += (target.x - mouse.x) * 0.06;
      mouse.y += (target.y - mouse.y) * 0.06;
      gl.uniform1f(uTime, reduce ? 0 : (now - start) / 1000);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform1f(uScroll, window.scrollY / window.innerHeight);
      gl.uniform2f(uClick, click.x, click.y);
      gl.uniform1f(uClickAge, (now - click.at) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
    };
  }, []);

  return (
    <canvas
      ref={canvas}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
      style={{
        background:
          "radial-gradient(60% 50% at 20% 30%, rgba(108,43,217,.25), transparent 70%), radial-gradient(50% 45% at 80% 70%, rgba(255,61,139,.18), transparent 70%), #0a0714",
      }}
    />
  );
}
