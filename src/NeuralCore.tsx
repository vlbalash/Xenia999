import React, { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SPHERE_COLORS, STYLE_PALETTES } from './constants'

interface NeuralCoreProps {
  hasText?: boolean
  basePosition?: [number, number, number]
  isLightingEnabled?: boolean
  onToggleLight?: () => void
  animState?: React.MutableRefObject<{ explode: number }>
  sphereColorIndex?: number
}

// Constellation stars shader
const constVert = `
  uniform float uTime;
  uniform float uExplode;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    float pulse = sin(uTime * 3.0 + position.y * 8.0) * 0.003;
    vec3 p = position + normalize(position) * pulse;

    // Wind: flag-like flutter, strongest near the top of the sphere
    float windWave = sin(position.x * 5.0 + uTime * 2.5) * cos(position.z * 4.0 + uTime * 1.8);
    float windHeight = clamp(position.y * 0.6 + 0.6, 0.0, 1.0);
    p.x += windWave * windHeight * 0.07;
    p.y += windWave * windHeight * 0.025;

    if (uExplode > 0.0) {
      vec3 dir = normalize(position);
      // Unique per-particle random values
      float n  = fract(sin(dot(position.xyz, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
      float n2 = fract(sin(dot(position.xyz, vec3(93.989,  67.345, 15.073))) * 83742.123) * 2.0 - 1.0;
      // Safe tangent avoids NaN at poles
      vec3 tangent = normalize(cross(dir, vec3(0.0, 1.0, 0.0) + dir * 0.01));
      // Quadratic scatter = slow start, then accelerates dramatically
      float scatter = uExplode * uExplode * 60.0;
      p += dir * (n * scatter) + tangent * (n2 * uExplode * 14.0);
    }

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    // Varied dot sizes: most are tiny, occasional larger sparks
    float seam = abs(sin(position.x * 25.0 + position.y * 25.0));
    float n = fract(sin(dot(position.xy, vec2(12.9898, 78.233))) * 43758.5453);
    float dotSize = seam > 0.9 ? 2.5 : mix(0.8, 2.2, n * n);
    gl_PointSize = dotSize * (1.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`
const constFrag = `
  uniform float uTime;
  uniform float uExplode;
  uniform float uMixerX;
  varying vec2 vUv;
  void main() {
    float d = distance(gl_PointCoord, vec2(0.5));
    if (d > 0.5) discard;
    vec3 c = mix(vec3(0.0,0.78,1.0), vec3(1.0,0.2,0.8), sin(uTime*0.4 + vUv.x*6.28)*0.5+0.5);
    float alpha = (1.0 - smoothstep(0.0,0.5,d)) * 0.60;
    // Sparks brighten early in scatter, then fade only in the last 40%
    float brightness = 1.0 + uExplode * (1.0 - uExplode) * 8.0;
    float fadeOut = max(0.0, 1.0 - max(0.0, (uExplode - 0.80) / 0.20));
    // Mixer: left side of crossfader boosts this sphere
    float mixBoost = 1.0 + (1.0 - uMixerX) * 0.7;
    alpha *= fadeOut * mixBoost;
    gl_FragColor = vec4(c * brightness, alpha);
  }
`

function paintFrame(ctx: CanvasRenderingContext2D, _colorIndex: number) {
  const W = 1024, H = 1024
  ctx.clearRect(0, 0, W, H)

  // ── 2. XXX (Top, crisp white) ──
  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '900 160px Orbitron, "Arial Black", Arial'
  ctx.fillStyle = '#e5e7eb'
  ctx.shadowBlur = 0
  ctx.fillText('XXX', W * 0.25, H * 0.5 - 180)
  ctx.restore()

  // ── 3. ENIA (Center, MASKED PURE RED) ──
  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '900 180px Orbitron, "Arial Black", Arial'
  ctx.fillStyle = '#FF0000' 
  ctx.fillText('ENIA', W * 0.25, H * 0.5)
  ctx.restore()

  // ── 4. 999 (Bottom, crisp white) ──
  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '900 160px Orbitron, "Arial Black", Arial'
  ctx.fillStyle = '#e5e7eb'
  ctx.shadowBlur = 0
  ctx.fillText('999', W * 0.25, H * 0.5 + 180)
  ctx.restore()
}

export default function NeuralCore({
  hasText = true,
  basePosition = [-2.5, 0, 0],
  isLightingEnabled = false,
  onToggleLight,
  animState,
  sphereColorIndex = 0
}: NeuralCoreProps) {
  const meshRef  = useRef<THREE.Mesh>(null!)
  const dotsRef  = useRef<THREE.Points>(null!)
  const uniforms = useMemo(() => ({
      uTime: { value: 0 }, 
      uExplode: { value: 0 },
      uColor: { value: new THREE.Color(SPHERE_COLORS[sphereColorIndex].hex) },
      uStyle1: { value: sphereColorIndex },
      uStyle2: { value: sphereColorIndex },
      uTransition: { value: 0.0 },
      // New style uniforms
      uC1A: { value: new THREE.Color(STYLE_PALETTES[sphereColorIndex][0]) },
      uC1B: { value: new THREE.Color(STYLE_PALETTES[sphereColorIndex][1]) },
      uC1C: { value: new THREE.Color(STYLE_PALETTES[sphereColorIndex][2]) },
      uC1D: { value: new THREE.Color(STYLE_PALETTES[sphereColorIndex][3]) },
      uC1E: { value: new THREE.Color(STYLE_PALETTES[sphereColorIndex][4]) },
      uS1: { value: SPHERE_COLORS[sphereColorIndex].sharpness || 0.1 },
      uC2A: { value: new THREE.Color(STYLE_PALETTES[sphereColorIndex][0]) },
      uC2B: { value: new THREE.Color(STYLE_PALETTES[sphereColorIndex][1]) },
      uC2C: { value: new THREE.Color(STYLE_PALETTES[sphereColorIndex][2]) },
      uC2D: { value: new THREE.Color(STYLE_PALETTES[sphereColorIndex][3]) },
      uC2E: { value: new THREE.Color(STYLE_PALETTES[sphereColorIndex][4]) },
      uS2: { value: SPHERE_COLORS[sphereColorIndex].sharpness || 0.1 },
      uMixerX: { value: 0.5 },
  }), [])

  const targetColorRef = useRef(new THREE.Color(SPHERE_COLORS[sphereColorIndex].hex))
  
  // Transition state
  const prevColorIndexRef = useRef(sphereColorIndex)
  const isTransitioningRef = useRef(false)
  const transitionStartRef = useRef(0)

  useEffect(() => {
    targetColorRef.current.set(SPHERE_COLORS[sphereColorIndex].hex)
    
    if (sphereColorIndex !== prevColorIndexRef.current) {
      // Style 1 (Outgoing)
      const s1 = SPHERE_COLORS[prevColorIndexRef.current]
      const p1 = STYLE_PALETTES[prevColorIndexRef.current]
      uniforms.uC1A.value.set(p1[0])
      uniforms.uC1B.value.set(p1[1])
      uniforms.uC1C.value.set(p1[2])
      uniforms.uC1D.value.set(p1[3])
      uniforms.uC1E.value.set(p1[4])
      uniforms.uS1.value = s1.sharpness || 0.1

      // Style 2 (Incoming)
      const s2 = SPHERE_COLORS[sphereColorIndex]
      const p2 = STYLE_PALETTES[sphereColorIndex]
      uniforms.uC2A.value.set(p2[0])
      uniforms.uC2B.value.set(p2[1])
      uniforms.uC2C.value.set(p2[2])
      uniforms.uC2D.value.set(p2[3])
      uniforms.uC2E.value.set(p2[4])
      uniforms.uS2.value = s2.sharpness || 0.1

      uniforms.uStyle1.value = prevColorIndexRef.current
      uniforms.uStyle2.value = sphereColorIndex
      uniforms.uTransition.value = 0.0
      isTransitioningRef.current = true
      transitionStartRef.current = performance.now()
      prevColorIndexRef.current = sphereColorIndex
    }
  }, [sphereColorIndex, uniforms])

  // ── Mixer crossfader ────────────────────────────────────────────────────
  useEffect(() => {
    const onMixer = (e: Event) => {
      uniforms.uMixerX.value = (e as CustomEvent).detail.x
    }
    window.addEventListener('mixer-move', onMixer)
    return () => window.removeEventListener('mixer-move', onMixer)
  }, [uniforms])

  // ── Drag state ──────────────────────────────────────────────────────────
  const isDragging = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })
  // Initial rotation adjusted to show the 'belly' with the text on load.
  const rotY = useRef(0) 
  const rotX = useRef(0)

  const handlePointerDown = (e: any) => {
    e.stopPropagation()
    isDragging.current = true
    lastPos.current = { x: e.clientX, y: e.clientY }
    if (e.target?.setPointerCapture) e.target.setPointerCapture(e.pointerId)
  }

  const handlePointerUp = (e: any) => {
    isDragging.current = false
    if (e.target?.releasePointerCapture) e.target.releasePointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: any) => {
    if (!isDragging.current) return
    const deltaX = e.clientX - lastPos.current.x
    const deltaY = e.clientY - lastPos.current.y
    rotY.current += deltaX * 0.005
    rotX.current += deltaY * 0.005
    lastPos.current = { x: e.clientX, y: e.clientY }
  }

  // ── Create canvas + texture synchronously before first render ──────────────
  const { texture, ctx } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width  = 1024
    canvas.height = 1024
    const ctx = canvas.getContext('2d')!
    paintFrame(ctx, sphereColorIndex)         // paint immediately → not black on load
    const texture = new THREE.CanvasTexture(canvas)
    texture.anisotropy = 8
    return { texture, ctx, canvas }
  }, [])

  // ── FontFace pre-load (upgrades from fallback fonts once ready) ────────────
  const [fontsLoaded, setFontsLoaded] = useState(false)
  useEffect(() => {
    if (typeof FontFace === 'undefined') {
        setFontsLoaded(true)
        return
    }
    
    // Using FontSource CDN for more reliable direct access to .woff2 files
    const orbitronUrl = 'https://cdn.jsdelivr.net/npm/@fontsource/orbitron@5.0.17/files/orbitron-latin-700-normal.woff2'
    const petitUrl = 'https://cdn.jsdelivr.net/npm/@fontsource/petit-formal-script@5.0.8/files/petit-formal-script-latin-400-normal.woff2'

    let mounted = true
    Promise.all([
      new FontFace('Orbitron', `url(${orbitronUrl})`, { weight: '700' }).load(),
      new FontFace('Petit Formal Script', `url(${petitUrl})`).load(),
    ]).then(fonts => {
      fonts.forEach(f => document.fonts.add(f))
      if (mounted) setFontsLoaded(true)
    }).catch((err) => {
      console.warn('Font loading failed, using fallbacks:', err)
      if (mounted) setFontsLoaded(true)
    })
    return () => { mounted = false }
  }, [])

  useEffect(() => {
     if (fontsLoaded && hasText) {
         paintFrame(ctx, sphereColorIndex)
         texture.needsUpdate = true
     }
  }, [fontsLoaded, hasText, ctx, texture, sphereColorIndex])

  // ── Constellation particle geometry ───────────────────────────────────────
  const count = 23000
  const [cPos, cUv] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const uvs = new Float32Array(count * 2)
    for (let i = 0; i < count; i++) {
      const phi   = Math.acos(-1 + (2 * i) / count)
      const theta = Math.sqrt(count * Math.PI) * phi
      const r = 0.92 + Math.random() * 0.08
      pos[i*3]   = Math.cos(theta) * Math.sin(phi) * r
      pos[i*3+1] = Math.sin(theta) * Math.sin(phi) * r
      pos[i*3+2] = Math.cos(phi) * r
      uvs[i*2]   = theta / (Math.PI * 2)
      uvs[i*2+1] = phi   /  Math.PI
    }
    return [pos, uvs]
  }, [])

  // ── Render loop ─────────────────────────────────────────────────────────
  useFrame(state => {
    const t = state.clock.elapsedTime
    uniforms.uTime.value = t
    uniforms.uColor.value.lerp(targetColorRef.current, 0.05)

    if (isTransitioningRef.current) {
      const now = performance.now()
      const elapsed = (now - transitionStartRef.current) / 1000.0 // seconds
      const duration = 0.5 // 0.5 sec fade
      let progress = elapsed / duration
      if (progress >= 1.0) {
        progress = 1.0
        isTransitioningRef.current = false
        uniforms.uStyle1.value = uniforms.uStyle2.value
        uniforms.uTransition.value = 0.0
      } else {
         progress = progress * progress * (3.0 - 2.0 * progress) // smoothstep
         uniforms.uTransition.value = progress
      }
    }

    // Update explosion uniform
    if (animState) {
        uniforms.uExplode.value = animState.current.explode
    }

    if (meshRef.current) {
      meshRef.current.rotation.y = rotY.current
      meshRef.current.rotation.x = rotX.current
      if (animState) {
          // Text sphere fades in the second half of disintegration — particles scatter first, then mesh dissolves
          const e = animState.current.explode
          const textFade = Math.max(0, 1.0 - Math.max(0, (e - 0.10) / 0.25))
          ;(meshRef.current.material as THREE.Material).opacity = textFade
      }
    }
    if (dotsRef.current) {
      dotsRef.current.rotation.y = rotY.current
      dotsRef.current.rotation.x = rotX.current
    }
  })

  return (
    <group position={basePosition} rotation={[0.2, 0, 0.6]}>
      {/* Invisible click zone */}
      {onToggleLight && (
        <mesh
          scale={[1.4, 0.85, 0.85]}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerMove={handlePointerMove}
          onPointerOut={(e: any) => { handlePointerUp(e) }}
          onClick={e => { e.stopPropagation(); onToggleLight && onToggleLight() }}
          onPointerOver={() => {}}
        >
          <sphereGeometry args={[1.15, 16, 16]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}

      {/* Text sphere — sphereGeometry has equirectangular UVs */}
      <mesh ref={meshRef} scale={[1.4, 0.85, 0.85]} renderOrder={-1}>
        <sphereGeometry args={[0.97, 64, 64]} />
        <meshBasicMaterial 
          map={texture} 
          transparent 
          opacity={1} 
          alphaTest={0.1}
          depthWrite={true} 
          toneMapped={false}
          onBeforeCompile={(shader) => {
            shader.uniforms.uC1A = uniforms.uC1A
            shader.uniforms.uC1B = uniforms.uC1B
            shader.uniforms.uC1C = uniforms.uC1C
            shader.uniforms.uC1D = uniforms.uC1D
            shader.uniforms.uC1E = uniforms.uC1E
            shader.uniforms.uS1  = uniforms.uS1
            shader.uniforms.uC2A = uniforms.uC2A
            shader.uniforms.uC2B = uniforms.uC2B
            shader.uniforms.uC2C = uniforms.uC2C
            shader.uniforms.uC2D = uniforms.uC2D
            shader.uniforms.uC2E = uniforms.uC2E
            shader.uniforms.uS2  = uniforms.uS2
            // Restore missing base uniforms (required for wave/explosion/color animation)
            shader.uniforms.uTime = uniforms.uTime
            shader.uniforms.uExplode = uniforms.uExplode
            shader.uniforms.uColor = uniforms.uColor
            shader.uniforms.uStyle1 = uniforms.uStyle1
            shader.uniforms.uStyle2 = uniforms.uStyle2
            shader.uniforms.uTransition = uniforms.uTransition

            // Safely inject uniforms via <common> chunk
            const commonTarget = "#include <common>"
            const commonWith = commonTarget + "\n" +
              "uniform float uTime;\n" +
              "uniform float uExplode;\n" +
              "uniform vec3 uColor;\n" +
              "uniform int uStyle1;\n" +
              "uniform int uStyle2;\n" +
              "uniform float uTransition;\n" +
              "uniform vec3 uC1A; uniform vec3 uC1B; uniform vec3 uC1C; uniform vec3 uC1D; uniform vec3 uC1E; uniform float uS1;\n" +
              "uniform vec3 uC2A; uniform vec3 uC2B; uniform vec3 uC2C; uniform vec3 uC2D; uniform vec3 uC2E; uniform float uS2;\n" +
              "float stylePattern(int style, vec2 uv, float t) {\n" +
              "    if (style == 0) return smoothstep(-0.05, 0.05, sin((uv.y - uv.x * 0.3) * 22.0));\n" +
              "    else if (style == 1) return smoothstep(0.1, 0.3, sin(uv.x * 14.0 + sin(uv.y * 10.0) * 2.5));\n" +
              "    else if (style == 2) return sin(uv.x * 28.0) * sin(uv.y * 28.0) * 0.5 + 0.5;\n" +
              "    else if (style == 3) return sin(uv.x * 6.0 + uv.y * 4.0 + t * 0.8) * 0.5 + 0.5;\n" +
              "    else if (style == 4) return smoothstep(0.2, 0.8, uv.y);\n" +
              "    else if (style == 5) return sin(abs(uv.x - 0.5) * 20.0 + uv.y * 6.0) * 0.5 + 0.5;\n" +
              "    else if (style == 6) return sin(uv.y * 20.0 + t * 2.0) * cos(uv.x * 15.0) * 0.5 + 0.5;\n" +
              "    else return smoothstep(0.35, 0.65, uv.y + sin(uv.x * 10.0 + t) * 0.1);\n" +
              "}\n" +
              "\n// Vivid cosine palette — amplitude 1.0 forces channels to true 0/1 at primaries\n" +
              "vec3 cospalette(float t) {\n" +
              "    return clamp(vec3(0.5) + vec3(1.0) * cos(6.28318 * (t + vec3(0.0, 0.333, 0.667))), 0.0, 1.0);\n" +
              "}\n"
            shader.vertexShader = shader.vertexShader.replace(commonTarget, commonWith)
            shader.fragmentShader = shader.fragmentShader.replace(commonTarget, commonWith)
            
            // Vertex replacement
            const replaceTarget = "#include <begin_vertex>"
            const replaceWith = replaceTarget + "\n" +
              "// Waving flag effect using vertex displacement\n" +
              "float wave = sin(position.x * 4.0 + uTime * 2.5) * sin(position.y * 5.0 + uTime * 2.0) * 0.07;\n" +
              "transformed += normalize(position) * wave;\n" +
              "// Explosion logic\n" +
              "if (uExplode > 0.0) {\n" +
              "   float n = fract(sin(dot(position.xyz, vec3(12.9898, 78.233, 45.164))) * 43758.5453) * 2.0 - 1.0;\n" +
              "   transformed += normalize(position) * (n * uExplode * 8.0);\n" +
              "}\n"
              
            shader.vertexShader = shader.vertexShader.replace(replaceTarget, replaceWith)

             // Fragment replacement to isolate pure red and colorize it
            const fragReplaceTarget = "#include <map_fragment>"
            const fragReplaceWith = `
#include <map_fragment>
#ifdef USE_MAP
    // Isolate the red ENIA text mask
    float redMask = smoothstep(0.4, 0.6, diffuseColor.r) *
                    (1.0 - smoothstep(0.1, 0.4, diffuseColor.g)) *
                    (1.0 - smoothstep(0.1, 0.4, diffuseColor.b));

    vec2 uv = vMapUv;

    // ENIA: smooth independent color cycle via cosine palette
    // Slow drift + gentle spatial spread — no fract-wrap sharp edges
    float eniaPhase =
        uTime * 0.07                               // slow overall drift
        + uv.x * 0.28 + uv.y * 0.18               // gentle spatial gradient (less abrupt)
        + sin(uTime * 0.18 + uv.x * 3.14) * 0.08  // soft horizontal wave
        + cos(uTime * 0.12 + uv.y * 3.14) * 0.06; // soft vertical wave
    vec3 eniaColor = cospalette(eniaPhase);
    // No gamma lift — dark channels must stay dark for maximum saturation
    // Multiply stops at 1.0 to stay below bloom threshold
    eniaColor *= 1.0;

    // Replace red mask with vivid hue color
    diffuseColor.rgb -= vec3(redMask, 0.0, 0.0);
    diffuseColor.rgb = max(diffuseColor.rgb, vec3(0.0));
    diffuseColor.rgb += eniaColor * redMask;
#endif
            `
            shader.fragmentShader = shader.fragmentShader.replace(fragReplaceTarget, fragReplaceWith)
          }}
        />
      </mesh>

      {/* Subtle glow when lit */}
      {isLightingEnabled && (
        <pointLight color="#22d3ee" intensity={3} distance={5} />
      )}

      {/* Constellation dots */}
      <points ref={dotsRef} scale={[1.4, 0.85, 0.85]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={count} array={cPos} itemSize={3} />
          <bufferAttribute attach="attributes-uv"       count={count} array={cUv}  itemSize={2} />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={constVert}
          fragmentShader={constFrag}
          uniforms={uniforms}
          transparent depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}
