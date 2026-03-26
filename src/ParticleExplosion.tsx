import { useRef, useMemo, useState, useEffect, Suspense } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useScroll, Text } from '@react-three/drei'
import { SPHERE_COLORS, STYLE_PALETTES } from './constants'

const vertexShader = `
  uniform float uTime;
  uniform float uExplosion;
  uniform float uScale;
  uniform float uRingMorph;
  uniform float uBurst;
  uniform float uPierce;

  attribute vec3 aRandom;

  varying vec3 vLocalPos;
  varying float vRingKeep;

  void main() {
    vLocalPos = position;
    // Fade out all particles as ring forms — ring defined by torus mesh, not particles
    float smoothMorphEarly = uRingMorph * uRingMorph * (3.0 - 2.0 * uRingMorph);
    vRingKeep = 1.0 - smoothMorphEarly;
    vec3 dir = normalize(position);

    vec3 basePos = position * uScale;

    // Explosion fades out as ring morph takes over
    float force = pow(uExplosion, 3.0) * 12.0 * (1.0 - uRingMorph);
    vec3 explodedPos = basePos + dir * force * (aRandom.x * 0.4 + 0.6);

    // WOW burst: scatter particles outward then snap back
    float burstForce = uBurst * uBurst * 3.5 * (aRandom.x * 0.6 + 0.4);
    explodedPos += dir * burstForce;

    // Ring Morph: project onto XY plane — ring stands vertical, NeuralCore flies through along Z
    // On pierce: ring radius expands as a shockwave, Z spread explodes into a disk
    float ringRadius = (5.0 + aRandom.y * 0.35) + uPierce * uPierce * 9.0;
    vec3 flatPos = vec3(position.x + 0.001, position.y + 0.001, 0.0);
    vec3 ringDir = normalize(flatPos);
    vec3 ringPos = ringDir * ringRadius;
    ringPos.z += (aRandom.z - 0.5) * (0.18 + uPierce * 4.5);

    // Ease in-out the ring morph to avoid abrupt direction changes
    float smoothMorph = uRingMorph * uRingMorph * (3.0 - 2.0 * uRingMorph);
    vec3 morphedPosition = mix(explodedPos, ringPos, smoothMorph);

    // Organic turbulence on all 3 axes — suppressed in ring state to prevent z-flicker
    float turbAmp = 0.05 * (1.0 - smoothMorph * 0.92);
    float tOff = uTime * 2.0;
    morphedPosition.x += sin(tOff + aRandom.y * 100.0) * turbAmp;
    morphedPosition.y += cos(tOff + aRandom.z * 100.0) * turbAmp;
    morphedPosition.z += sin(tOff + aRandom.x * 100.0) * turbAmp;

    // Ring entry: radial shimmer peaks at transition midpoint then settles to zero
    float entryPulse = sin(smoothMorph * 3.14159);
    morphedPosition += ringDir * sin(aRandom.x * 40.0 + uTime * 6.0) * 1.2 * entryPulse;

    vec4 mvPosition = modelViewMatrix * vec4(morphedPosition, 1.0);

    // Exponential size distribution: most particles small, a few large — looks richer
    float sizeFactor = aRandom.y * aRandom.y;
    float size = 2.5 + sizeFactor * 18.0;
    // Ring particles — tight belt, smaller size for crisp edge
    float ringSize = 7.0 + aRandom.y * 6.0;
    float baseSize = mix(size, ringSize, smoothMorph);
    gl_PointSize = baseSize * (1.0 + uExplosion * 3.0 * (1.0 - smoothMorph) + entryPulse * 0.5);
    gl_PointSize *= (1.0 / -mvPosition.z);
    gl_PointSize = max(1.5, gl_PointSize);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = `
  uniform float uExplosion;
  uniform float uRingMorph;
  uniform vec3 uColor;
  uniform int uStyle1;
  uniform int uStyle2;
  uniform float uTransition;
  uniform float uTime;
  uniform float uBurst;
  uniform float uGlobalAlpha;
  uniform float uPierce;
  uniform float uMixerX;
  uniform vec3 uC1A;
  uniform vec3 uC1B;
  uniform vec3 uC1C;
  uniform vec3 uC1D;
  uniform vec3 uC1E;
  uniform vec3 uC2A;
  uniform vec3 uC2B;
  uniform vec3 uC2C;
  uniform vec3 uC2D;
  uniform vec3 uC2E;

  varying vec3 vLocalPos;
  varying float vRingKeep;

  // Vivid 2-color blend — only uses the two brightest palette entries (A and B)
  // Dark 3rd-5th entries are skipped: they vanish on black with AdditiveBlending
  vec3 paletteMix(vec3 cA, vec3 cB, vec3 cC, vec3 cD, vec3 cE, float p) {
      float t = clamp(p, 0.0, 1.0);
      return mix(cA, cB, t * t * (3.0 - 2.0 * t));
  }

  // Per-style geometric pattern → 0..1 drives A↔B color blend
  // All styles now have time animation for a living, breathing look
  float getPattern(int style, vec3 p, float t) {
      // 0: Zebra — scrolling sharp wave bands
      if (style == 0) return smoothstep(-0.1, 0.1, sin(p.y * 30.0 + sin(p.x * 10.0 + p.z * 15.0) * 1.5 + t * 1.2));
      // 1: Tiger — flowing diagonal stripes
      if (style == 1) return smoothstep(0.0, 0.25, sin(p.x * 20.0 + sin(p.y * 15.0) * 3.0 + p.z * 5.0 + t * 2.0));
      // 2: Iguana — pulsing 3-axis facets
      if (style == 2) return sin(p.x * 40.0 + t * 0.5) * sin(p.y * 40.0) * sin(p.z * 40.0 + t * 0.3) * 0.5 + 0.5;
      // 3: Chameleon — fast iridescent color wave
      if (style == 3) return sin(p.x * 6.0 + p.z * 4.0 + t * 3.0) * 0.5 + 0.5;
      // 4: Dolphin — gradient that breathes up and down
      if (style == 4) return smoothstep(-0.35, 0.45, p.y + sin(t * 1.2) * 0.25);
      // 5: Butterfly — wings that shimmer with time
      if (style == 5) return smoothstep(-0.1, 0.1, sin(abs(p.x) * 15.0 + p.y * 10.0 + t * 1.8) * cos(abs(p.x) * 20.0 - p.z * 15.0 + t * 0.9));
      // 6: Colibri — fast iridescent ripple
      if (style == 6) return sin(p.y * 30.0 + t * 4.0) * cos(p.z * 30.0 + t * 2.5) * 0.5 + 0.5;
      // 7: Kohlrabi — radial breathing pulse
      return smoothstep(0.05, 0.55, abs(p.y) + sin(t * 1.5 + p.x * 8.0) * 0.1);
  }

  void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist > 0.5) discard;

    float styleF = getPattern(uStyle1, vLocalPos, uTime * 1.5);
    float styleF2 = getPattern(uStyle2, vLocalPos, uTime * 1.5);
    float factor = mix(styleF, styleF2, uTransition);

    vec3 palette1 = paletteMix(uC1A, uC1B, uC1C, uC1D, uC1E, factor);
    vec3 palette2 = paletteMix(uC2A, uC2B, uC2C, uC2D, uC2E, factor);

    vec3 finalPatternCol = mix(palette1, palette2, uTransition);

    // Style patterns only apply to sphere — ring converges to uniform sky-blue
    vec3 ringBaseColor = vec3(0.055, 0.647, 0.914); // #0ea5e9
    float ringBlend = smoothstep(0.15, 0.85, uRingMorph);
    vec3 styledColor = mix(finalPatternCol, ringBaseColor, ringBlend);

    // Pole-silvering: subtle only, so it doesn't dull vivid palette colors
    float poleBlend = abs(vLocalPos.y) * 0.2 * (1.0 - uRingMorph);
    vec3 mixedColor = mix(styledColor, vec3(0.898, 0.906, 0.922), poleBlend);

    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    alpha = pow(alpha, 1.4); // crisper falloff — particles appear brighter and more solid

    // Per-particle brightness from style pattern — ring locks to full brightness to prevent flicker
    float particleDensity = mix(mix(0.88, 1.0, factor), 1.0, ringBlend);
    // Belt fade: particles off-plane fade out in ring mode
    float beltFade = mix(1.0, 1.0 - smoothstep(0.0, 0.25, abs(vLocalPos.z)), ringBlend);
    alpha *= particleDensity * beltFade;

    // Explosion flash suppressed once ring has formed
    float spherePhase = 1.0 - ringBlend;
    float flash = smoothstep(0.8, 0.95, uExplosion) * (1.0 - smoothstep(0.95, 1.0, uExplosion));
    vec3 finalColor = mix(mixedColor, vec3(1.0, 1.0, 1.0), (uExplosion * 0.85 + flash) * spherePhase);

    // Iridescent shimmer: rainbow fringe at particle edges (view-angle independent)
    float rimFactor = smoothstep(0.2, 0.48, dist);
    float shimAngle = atan(gl_PointCoord.y - 0.5, gl_PointCoord.x - 0.5);
    vec3 iridescence = 0.5 + 0.5 * vec3(
        sin(shimAngle + uTime * 1.5),
        sin(shimAngle + uTime * 1.5 + 2.094),
        sin(shimAngle + uTime * 1.5 + 4.189)
    );
    finalColor = mix(finalColor, finalColor * 0.9 + iridescence * 0.35, rimFactor * 0.18);

    // Color bleed: organic overflow during style transitions — suppressed in ring mode
    float bleedPeak = uTransition * (1.0 - uTransition) * 4.0 * spherePhase;
    if (bleedPeak > 0.01) {
        vec3 shiftedPos = vLocalPos + vec3(
            sin(uTime * 3.0 + vLocalPos.z * 5.0),
            cos(uTime * 2.5 + vLocalPos.x * 5.0),
            sin(uTime * 2.0 + vLocalPos.y * 5.0)
        ) * 0.1 * bleedPeak;
        vec3 bleedCol = mix(uC1A, uC2B, 0.5);
        finalColor = mix(finalColor, bleedCol, bleedPeak * 0.45);
    }

    // Particles fade out completely as ring forms — ring defined by torus mesh only
    alpha *= 1.9 * vRingKeep;

    // WOW burst flash: particles ignite white then cool to new palette
    finalColor = mix(finalColor, vec3(1.0, 1.0, 1.0), pow(uBurst, 0.5) * 0.92);

    // Pierce impact: white flash peaks at midpoint, ring fades to nothing as it expands
    float pierceFlash = sin(uPierce * 3.14159) * 0.9;
    finalColor = mix(finalColor, vec3(1.0, 1.0, 1.0), pierceFlash);
    float pierceFade = 1.0 - pow(uPierce, 0.65);
    alpha *= pierceFade;

    // Global alpha: smooth fade-in on mount, no abrupt pop-in
    alpha *= uGlobalAlpha;

    // Mixer: right side of crossfader boosts this sphere
    alpha *= 1.0 + uMixerX * 0.7;

    gl_FragColor = vec4(finalColor, alpha);
  }
`

function AnimatedCursiveText({ visible, position }: { visible: boolean, position: [number, number, number] }) {
    const textRef = useRef<any>(null)

    useFrame((_, delta) => {
        if (textRef.current) {
            const targetOpacity = visible ? 0.85 : 0.0
            textRef.current.fillOpacity = THREE.MathUtils.lerp(textRef.current.fillOpacity || 0, targetOpacity, delta * 3.0)
        }
    })

    return (
        <Text
            ref={textRef}
            position={position}
            fontSize={0.15}
            color="#ff69b4"
            anchorX="center"
            anchorY="middle"
            material-side={THREE.FrontSide}
            font="https://cdn.jsdelivr.net/npm/@fontsource/petit-formal-script@5.0.8/files/petit-formal-script-latin-400-normal.woff"
            fillOpacity={0} // Start invisible
        >
            with soul
        </Text>
    )
}

const smoothstep = (min: number, max: number, value: number) => {
    const x = Math.max(0, Math.min(1, (value - min) / (max - min)))
    return x * x * (3 - 2 * x)
}

export default function ParticleExplosion({ colorIndex = 0 }: { colorIndex?: number }) {
    const pointsRef = useRef<THREE.Points>(null)
    const textGroupRef = useRef<THREE.Group>(null)
    const scroll = useScroll()

    const count = 22000
    const [clicks, setClicks] = useState(0)
    const scaleRef = useRef(1.0)
    const targetScaleRef = useRef(1.0)
    const completedRef = useRef(false)
    const ringSpinRef = useRef(0)
    const autoRevealRef = useRef(false)

    const [positions, randomness] = useMemo(() => {
        const pos = new Float32Array(count * 3)
        const rand = new Float32Array(count * 3)
        for (let i = 0; i < count; i++) {
            const phi = Math.acos(-1 + (2 * i) / count)
            const theta = Math.sqrt(count * Math.PI) * phi

            const radius = 0.8 + Math.random() * 0.4
            const x = Math.cos(theta) * Math.sin(phi) * radius
            const y = Math.sin(theta) * Math.sin(phi) * radius
            const z = Math.cos(phi) * radius

            pos[i * 3] = x
            pos[i * 3 + 1] = y
            pos[i * 3 + 2] = z

            rand[i * 3] = Math.random()
            rand[i * 3 + 1] = Math.random()
            rand[i * 3 + 2] = Math.random()
        }
        return [pos, rand]
    }, [])

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uExplosion: { value: 0 },
        uColor: { value: new THREE.Color(SPHERE_COLORS[colorIndex].hex) },
        uScale: { value: 1.0 },
        uStyle1: { value: colorIndex },
        uStyle2: { value: colorIndex },
        uTransition: { value: 1.0 },
        uRingMorph: { value: 0.0 },
        uC1A: { value: new THREE.Color() },
        uC1B: { value: new THREE.Color() },
        uC1C: { value: new THREE.Color() },
        uC1D: { value: new THREE.Color() },
        uC1E: { value: new THREE.Color() },
        uC2A: { value: new THREE.Color() },
        uC2B: { value: new THREE.Color() },
        uC2C: { value: new THREE.Color() },
        uC2D: { value: new THREE.Color() },
        uC2E: { value: new THREE.Color() },
        uBurst: { value: 0.0 },
        uGlobalAlpha: { value: 0.0 },
        uPierce: { value: 0.0 },
        uMixerX: { value: 0.5 },
    }), [])

    const targetColorRef = useRef(new THREE.Color(SPHERE_COLORS[colorIndex].hex))

    // ── Mixer crossfader ─────────────────────────────────────────────────────
    useEffect(() => {
        const onMixer = (e: Event) => {
            uniforms.uMixerX.value = (e as CustomEvent).detail.x
        }
        window.addEventListener('mixer-move', onMixer)
        return () => window.removeEventListener('mixer-move', onMixer)
    }, [uniforms])

    // ── Impact: burst spike ───────────────────────────────────────────────────
    useEffect(() => {
        const onImpact = () => {
            uniforms.uBurst.value = 1.4
        }
        window.addEventListener('particle-impact', onImpact)
        return () => window.removeEventListener('particle-impact', onImpact)
    }, [uniforms])

    // ── WOW: burst + color/style change when external colorIndex prop changes ────
    useEffect(() => {
        targetColorRef.current.set(SPHERE_COLORS[colorIndex].hex)
        // Big scale spike for WOW effect
        targetScaleRef.current = 1.85
        // Smoothly transition the style definition
        uniforms.uStyle1.value = uniforms.uStyle2.value
        uniforms.uStyle2.value = colorIndex
        uniforms.uTransition.value = 0.0
        // Trigger burst + white ignition flash
        uniforms.uBurst.value = 1.0
        uniforms.uColor.value.set('#ffffff')
    }, [colorIndex])


    const handlePointerDown = (e: any) => {
        e.stopPropagation()
        setClicks(c => c + 1)
        targetScaleRef.current = 1.25 + Math.random() * 0.3 // Blast scale
    }

    useFrame((state, delta) => {
        const offset = scroll.offset

        uniforms.uTime.value = state.clock.elapsedTime

        // Smooth fade-in on mount
        if (uniforms.uGlobalAlpha.value < 1.0) {
            uniforms.uGlobalAlpha.value = Math.min(1.0, uniforms.uGlobalAlpha.value + delta * 1.2)
        }

        // Decay burst
        if (uniforms.uBurst.value > 0.0) {
            uniforms.uBurst.value = Math.max(0.0, uniforms.uBurst.value - delta * 2.2)
        }

        // Style transition
        if (uniforms.uTransition.value < 1.0) {
            uniforms.uTransition.value = Math.min(1.0, uniforms.uTransition.value + delta * 3.5)
        }

        // Sync palette uniforms
        const pL1 = STYLE_PALETTES[uniforms.uStyle1.value]
        const pL2 = STYLE_PALETTES[uniforms.uStyle2.value]
        uniforms.uC1A.value.set(pL1[0]); uniforms.uC1B.value.set(pL1[1]); uniforms.uC1C.value.set(pL1[2]); uniforms.uC1D.value.set(pL1[3]); uniforms.uC1E.value.set(pL1[4])
        uniforms.uC2A.value.set(pL2[0]); uniforms.uC2B.value.set(pL2[1]); uniforms.uC2C.value.set(pL2[2]); uniforms.uC2D.value.set(pL2[3]); uniforms.uC2E.value.set(pL2[4])

        uniforms.uColor.value.lerp(targetColorRef.current, 0.04)

        // Scale spring
        scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, targetScaleRef.current, 0.1)
        uniforms.uScale.value = scaleRef.current
        if (targetScaleRef.current > 1.0) {
            targetScaleRef.current = THREE.MathUtils.lerp(targetScaleRef.current, 1.0, delta * 3.0)
        }
        if (pointsRef.current) {
            const s = targetScaleRef.current
            pointsRef.current.scale.x = THREE.MathUtils.lerp(pointsRef.current.scale.x, s, 0.1)
            pointsRef.current.scale.y = pointsRef.current.scale.x
            pointsRef.current.scale.z = pointsRef.current.scale.x
        }

        // Reset to initial state when scrolled back to top
        if (completedRef.current && offset < 0.05) {
            completedRef.current = false
            ringSpinRef.current = 0
            if (autoRevealRef.current) { setClicks(0); autoRevealRef.current = false }
        }

        if (completedRef.current) {
            // ── COMPLETED STATE: ring spins, "with soul" visible ──────────────────
            uniforms.uRingMorph.value = 1.0
            // Lerp to resting state — no visual pop
            uniforms.uExplosion.value = THREE.MathUtils.lerp(uniforms.uExplosion.value, 0.0, delta * 2.0)
            uniforms.uPierce.value    = THREE.MathUtils.lerp(uniforms.uPierce.value,    0.0, delta * 2.0)

            ringSpinRef.current += delta * 0.45
            if (pointsRef.current) {
                pointsRef.current.rotation.x = THREE.MathUtils.lerp(pointsRef.current.rotation.x, 0, delta * 1.5)
                pointsRef.current.rotation.y = THREE.MathUtils.lerp(pointsRef.current.rotation.y, 0, delta * 1.5)
                pointsRef.current.rotation.z = ringSpinRef.current
            }
            if (textGroupRef.current) {
                textGroupRef.current.rotation.y -= delta * 0.3
            }
        } else {
            // ── SCROLL-DRIVEN STATE ───────────────────────────────────────────────
            const explosionFactor = Math.min(1.0, Math.pow(Math.max(0, (offset - 0.30) * 7.0), 1.3))
            uniforms.uExplosion.value = THREE.MathUtils.lerp(uniforms.uExplosion.value, explosionFactor, 0.1)

            const ringFactor = smoothstep(0.52, 0.72, offset)
            uniforms.uRingMorph.value = THREE.MathUtils.lerp(uniforms.uRingMorph.value, ringFactor, 0.06)

            // Pierce shockwave synced to NeuralCore entering ring (offset 0.818 = pierce phase start)
            const pierceTarget = smoothstep(0.818, 1.0, offset)
            uniforms.uPierce.value = THREE.MathUtils.lerp(uniforms.uPierce.value, pierceTarget, 0.07)

            // Trigger completion when pierce is nearly done
            if (uniforms.uPierce.value > 0.88) {
                completedRef.current = true
                if (clicks < 2) { setClicks(2); autoRevealRef.current = true }
            }

            if (pointsRef.current) {
                const burstSpin = uniforms.uBurst.value * 0.025
                pointsRef.current.rotation.y += 0.002 + burstSpin
                pointsRef.current.rotation.x += 0.001 + burstSpin * 0.5
            }

            if (textGroupRef.current) {
                textGroupRef.current.rotation.y -= delta * 0.3
            }
        }
    })

    return (
        <group>
            {/* Invisible clickable sphere */}
            <mesh
                onPointerDown={handlePointerDown} // Changed from onClick to onPointerDown
                onPointerOver={() => {}}
                onPointerOut={() => {}}
            >
                <sphereGeometry args={[1.1, 16, 16]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
            
            {/* Glass Tube Belt - color follows active theme */}
            <group ref={textGroupRef}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[1.15, 0.08, 16, 100]} />
                    <meshBasicMaterial color="#0ea5e9" transparent opacity={0.22} depthWrite={false} blending={THREE.AdditiveBlending} />
                </mesh>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[1.15, 0.03, 16, 100]} />
                    <meshBasicMaterial color="#e5e7eb" transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} />
                </mesh>

                {/* Ring of repeating texts for marquee effect */}
                {[0, 1, 2].map((i) => {
                    const baseAngle = (i / 3) * Math.PI * 2
                    const radius = 1.15
                    return (
                        <group key={i} rotation={[0, baseAngle, 0]}>
                            {/* Primary Text Segment */}
                            <Suspense fallback={null}>
                                <Text
                                    position={[0, 0, radius]}
                                    fontSize={0.09}
                                    color="#2dd4bf"
                                    anchorX="center"
                                    anchorY="middle"
                                    fillOpacity={1}
                                    letterSpacing={0.18}
                                    material-side={THREE.DoubleSide}
                                    font="https://cdn.jsdelivr.net/npm/@fontsource/orbitron@5.0.17/files/orbitron-latin-700-normal.woff2"
                                >
                                    WEBSITE DEVELOPMENT
                                </Text>
                            </Suspense>

                            {/* Cursive Reveal Interleaved Segment */}
                            <group rotation={[0, 0, 0]}>
                                <AnimatedCursiveText
                                    visible={clicks >= 2}
                                    position={[0, -0.05, radius]}
                                />
                            </group>
                        </group>
                    )
                })}
            </group>

            <points ref={pointsRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        count={count}
                        array={positions}
                        itemSize={3}
                    />
                    <bufferAttribute
                        attach="attributes-aRandom"
                        count={count}
                        array={randomness}
                        itemSize={3}
                    />
                </bufferGeometry>
                <shaderMaterial
                    vertexShader={vertexShader}
                    fragmentShader={fragmentShader}
                    uniforms={uniforms}
                    transparent
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </points>
        </group>
    )
}
