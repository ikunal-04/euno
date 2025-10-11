import React, { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle, Transform, Vec3, Camera } from 'ogl';

type MetaBallsProps = {
  gradientColors?: string[];
  speed?: number;
  enableMouseInteraction?: boolean;
  hoverSmoothness?: number;
  animationSize?: number;
  ballCount?: number;
  clumpFactor?: number;
  cursorBallSize?: number;
  enableTransparency?: boolean;
  cloudiness?: number;
};

function parseHexColor(hex: string): [number, number, number] {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;
  return [r, g, b];
}

function fract(x: number): number {
  return x - Math.floor(x);
}

function hash31(p: number): number[] {
  let r = [p * 0.1031, p * 0.103, p * 0.0973].map(fract);
  const r_yzx = [r[1], r[2], r[0]];
  const dotVal = r[0] * (r_yzx[0] + 33.33) + r[1] * (r_yzx[1] + 33.33) + r[2] * (r_yzx[2] + 33.33);
  for (let i = 0; i < 3; i++) {
    r[i] = fract(r[i] + dotVal);
  }
  return r;
}

function hash33(v: number[]): number[] {
  let p = [v[0] * 0.1031, v[1] * 0.103, v[2] * 0.0973].map(fract);
  const p_yxz = [p[1], p[0], p[2]];
  const dotVal = p[0] * (p_yxz[0] + 33.33) + p[1] * (p_yxz[1] + 33.33) + p[2] * (p_yxz[2] + 33.33);
  for (let i = 0; i < 3; i++) {
    p[i] = fract(p[i] + dotVal);
  }
  const p_xxy = [p[0], p[0], p[1]];
  const p_yxx = [p[1], p[0], p[0]];
  const p_zyx = [p[2], p[1], p[0]];
  const result: number[] = [];
  for (let i = 0; i < 3; i++) {
    result[i] = fract((p_xxy[i] + p_yxx[i]) * p_zyx[i]);
  }
  return result;
}

const vertex = `#version 300 es
precision highp float;
layout(location = 0) in vec2 position;
void main() {
    gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `#version 300 es
precision highp float;
uniform vec3 iResolution;
uniform float iTime;
uniform vec3 iMouse;
uniform vec3 iGradientColors[5];
uniform int iGradientColorCount;
uniform float iAnimationSize;
uniform int iBallCount;
uniform float iCursorBallSize;
uniform vec3 iMetaBalls[50];
uniform bool enableTransparency;
uniform float iCloudiness;
out vec4 outColor;

// Enhanced 2D Simplex Noise with multiple octaves for more natural cloud patterns
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

// Fractal Brownian Motion for layered cloud effect
float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for(int i = 0; i < 4; i++) {
        value += amplitude * snoise(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}
 
float getMetaBallValue(vec2 c, float r, vec2 p) {
    vec2 d = p - c;
    float dist2 = dot(d, d);
    return (r * r) / (dist2 + 0.1); 
}

vec3 lerpColor(vec3 color1, vec3 color2, float t) {
    return color1 + (color2 - color1) * smoothstep(0.0, 1.0, t);
}
 
void main() {
    vec2 fc = gl_FragCoord.xy;
    float scale = iAnimationSize / iResolution.y;
    vec2 coord = (fc - iResolution.xy * 0.5) * scale;
    
    // Create multi-layered turbulence for realistic cloud/sky effect
    float timeFlow = iTime * 0.03;
    
    // Primary large-scale cloud movement
    vec2 displacement1 = vec2(
        fbm(coord * 0.08 + vec2(timeFlow, 0.0)),
        fbm(coord * 0.08 + vec2(0.0, timeFlow) + vec2(5.2, 1.3))
    );
    
    // Secondary fine detail turbulence
    vec2 displacement2 = vec2(
        snoise(coord * 0.2 + iTime * 0.08 + vec2(3.5, 1.2)),
        snoise(coord * 0.2 + iTime * 0.08 + vec2(8.3, 4.7))
    );
    
    // Combine displacements with different weights for natural cloud flow
    vec2 totalDisplacement = displacement1 * iCloudiness + displacement2 * (iCloudiness * 0.3);
    vec2 distortedCoord = coord + totalDisplacement;

    vec2 mouseW = (iMouse.xy - iResolution.xy * 0.5) * scale;
    float total = 0.0;
    
    for (int i = 0; i < 50; i++) {
        if (i >= iBallCount) break;
        total += getMetaBallValue(iMetaBalls[i].xy, iMetaBalls[i].z, distortedCoord);
    }
    total += getMetaBallValue(mouseW, iCursorBallSize, distortedCoord);
    
    // Enhanced gradient mapping for sky/cloud transitions
    float normalizedTotal = clamp(total * 0.12, 0.0, 1.8);
    
    // Add subtle noise variation to the gradient for more organic appearance
    float noiseVariation = fbm(distortedCoord * 0.5 + iTime * 0.02) * 0.1;
    normalizedTotal = clamp(normalizedTotal + noiseVariation, 0.0, 1.8);

    vec3 finalGradientColor = vec3(0.0);
    if (iGradientColorCount == 1) {
        finalGradientColor = iGradientColors[0];
    } else {
        float gradientIndex = normalizedTotal * float(iGradientColorCount - 1);
        int idx1 = int(floor(gradientIndex));
        int idx2 = min(idx1 + 1, iGradientColorCount - 1);
        float t = fract(gradientIndex);
        
        // Smooth color blending
        finalGradientColor = lerpColor(iGradientColors[idx1], iGradientColors[idx2], t);
    }

    // Soft alpha for cloud-like edges
    float alpha = smoothstep(0.6, 1.4, total); 

    outColor = vec4(finalGradientColor, enableTransparency ? alpha : 1.0);
}
`;

type BallParams = {
  st: number;
  dtFactor: number;
  baseScale: number;
  toggle: number;
  radius: number;
};

const MetaBalls: React.FC<MetaBallsProps> = ({
  gradientColors = ['#0A2A70', '#0179fe', '#5D7DCA', '#a8e3ff', '#FFFFFF'],
  speed = 0.3,
  enableMouseInteraction = true,
  hoverSmoothness = 0.05,
  animationSize = 30,
  ballCount = 15,
  clumpFactor = 1,
  cursorBallSize = 3,
  enableTransparency = false,
  cloudiness = 2.5
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const dpr = 1;
    const renderer = new Renderer({
      dpr,
      alpha: true,
      premultipliedAlpha: false
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, enableTransparency ? 0 : 1);
    container.appendChild(gl.canvas);

    const camera = new Camera(gl, {
      left: -1, right: 1, top: 1, bottom: -1, near: 0.1, far: 10
    });
    camera.position.z = 1;

    const geometry = new Triangle(gl);
    
    const maxGradientColors = 5;
    const glGradientColors: Vec3[] = [];
    const actualGradientColors = gradientColors.slice(0, maxGradientColors);
    actualGradientColors.forEach(hexColor => {
      const [r, g, b] = parseHexColor(hexColor);
      glGradientColors.push(new Vec3(r, g, b));
    });

    while (glGradientColors.length < maxGradientColors) {
      glGradientColors.push(new Vec3(0, 0, 0));
    }

    const metaBallsUniform: Vec3[] = [];
    for (let i = 0; i < 50; i++) {
      metaBallsUniform.push(new Vec3(0, 0, 0));
    }

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new Vec3(0, 0, 0) },
        iMouse: { value: new Vec3(0, 0, 0) },
        iGradientColors: { value: glGradientColors },
        iGradientColorCount: { value: actualGradientColors.length },
        iAnimationSize: { value: animationSize },
        iBallCount: { value: ballCount },
        iCursorBallSize: { value: cursorBallSize },
        iMetaBalls: { value: metaBallsUniform },
        enableTransparency: { value: enableTransparency },
        iCloudiness: { value: cloudiness }
      }
    });

    const mesh = new Mesh(gl, { geometry, program });
    const scene = new Transform();
    mesh.setParent(scene);

    const maxBalls = 50;
    const effectiveBallCount = Math.min(ballCount, maxBalls);
    const ballParams: BallParams[] = [];
    for (let i = 0; i < effectiveBallCount; i++) {
      const idx = i + 1;
      const h1 = hash31(idx);
      const st = h1[0] * (2 * Math.PI);
      const dtFactor = 0.1 * Math.PI + h1[1] * (0.4 * Math.PI - 0.1 * Math.PI);
      const baseScale = 5.0 + h1[1] * (10.0 - 5.0);
      const h2 = hash33(h1);
      const toggle = Math.floor(h2[0] * 2.0);
      const radiusVal = 0.5 + h2[2] * (2.0 - 0.5);
      ballParams.push({ st, dtFactor, baseScale, toggle, radius: radiusVal });
    }

    const mouseBallPos = { x: 0, y: 0 };
    let pointerInside = false;
    let pointerX = 0;
    let pointerY = 0;

    function resize() {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width * dpr, height * dpr);
      gl.canvas.style.width = `${width}px`;
      gl.canvas.style.height = `${height}px`;
      program.uniforms.iResolution.value.set(gl.canvas.width, gl.canvas.height, 0);
    }
    window.addEventListener('resize', resize);
    resize();

    function onPointerMove(e: PointerEvent) {
      if (!enableMouseInteraction || !container) return;
      const rect = container.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      pointerX = (px / rect.width) * gl.canvas.width;
      pointerY = (1 - py / rect.height) * gl.canvas.height;
    }
    function onPointerEnter() { pointerInside = true; }
    function onPointerLeave() { pointerInside = false; }
    if (enableMouseInteraction) {
      container.addEventListener('pointermove', onPointerMove);
      container.addEventListener('pointerenter', onPointerEnter);
      container.addEventListener('pointerleave', onPointerLeave);
    }

    const startTime = performance.now();
    let animationFrameId: number;
    function update(t: number) {
      animationFrameId = requestAnimationFrame(update);
      const elapsed = (t - startTime) * 0.001;
      program.uniforms.iTime.value = elapsed;

      for (let i = 0; i < effectiveBallCount; i++) {
        const p = ballParams[i];
        const dt = elapsed * speed * p.dtFactor;
        const th = p.st + dt;
        const x = Math.cos(th);
        const y = Math.sin(th + dt * p.toggle);
        const posX = x * p.baseScale * clumpFactor;
        const posY = y * p.baseScale * clumpFactor;
        metaBallsUniform[i].set(posX, posY, p.radius);
      }

      let targetX, targetY;
      if (enableMouseInteraction && pointerInside) { 
        targetX = pointerX;
        targetY = pointerY;
      } else {
        const cx = gl.canvas.width * 0.5;
        const cy = gl.canvas.height * 0.5;
        const rx = gl.canvas.width * 0.15;
        const ry = gl.canvas.height * 0.15;
        targetX = cx + Math.cos(elapsed * speed * 0.5) * rx; 
        targetY = cy + Math.sin(elapsed * speed * 0.5) * ry;
      }
      mouseBallPos.x += (targetX - mouseBallPos.x) * hoverSmoothness;
      mouseBallPos.y += (targetY - mouseBallPos.y) * hoverSmoothness;
      program.uniforms.iMouse.value.set(mouseBallPos.x, mouseBallPos.y, 0);

      renderer.render({ scene, camera });
    }
    animationFrameId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      if (enableMouseInteraction) {
        container.removeEventListener('pointermove', onPointerMove);
        container.removeEventListener('pointerenter', onPointerEnter);
        container.removeEventListener('pointerleave', onPointerLeave);
      }
      container.removeChild(gl.canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [
    gradientColors, speed, enableMouseInteraction, hoverSmoothness, 
    animationSize, ballCount, clumpFactor, cursorBallSize, 
    enableTransparency, cloudiness
  ]);

  return <div ref={containerRef} className="w-full h-full relative" />;
};

export default MetaBalls;