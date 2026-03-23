import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import * as THREE from 'three'
import { extend } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import { ReactThreeFiber } from '@react-three/fiber'

import { Explosion } from './Explosion'

declare module '@react-three/fiber' {
  interface IntrinsicElements {
    asteroidMaterial: ReactThreeFiber.Object3DNode<THREE.ShaderMaterial, typeof AsteroidMaterial>
  }
}

// Custom shader material for the asteroid to give it a glowing, somewhat unstable look
const AsteroidMaterial = shaderMaterial(
  {
    time: 0,
    color1: new THREE.Color('#f59e0b'), // Amber 500 (ENIA style)
    color2: new THREE.Color('#ea580c'), // Orange 600
    noiseScale: 1.5,
    opacity: 0.8, // Slightly translucent to let core shine through
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    uniform float time;
    uniform float noiseScale;

    // Simplex 3D Noise 
    // by Ian McEwan, Ashima Arts
    vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

    float snoise(vec3 v){ 
        const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
        const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

        // First corner
        vec3 i  = floor(v + dot(v, C.yyy) );
        vec3 x0 = v - i + dot(i, C.xxx) ;

        // Other corners
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min( g.xyz, l.zxy );
        vec3 i2 = max( g.xyz, l.zxy );

        //  x0 = x0 - 0.0 + 0.0 * C 
        vec3 x1 = x0 - i1 + 1.0 * C.xxx;
        vec3 x2 = x0 - i2 + 2.0 * C.xxx;
        vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

        // Permutations
        i = mod(i, 289.0 ); 
        vec4 p = permute( permute( permute( 
                    i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
                + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

        // Gradients
        // ( N*N points uniformly over a square, mapped onto an octahedron.)
        float n_ = 1.0/7.0; // N=7
        vec3  ns = n_ * D.wyz - D.xzx;

        vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);

        vec4 b0 = vec4( x.xy, y.xy );
        vec4 b1 = vec4( x.zw, y.zw );

        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));

        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);

        //Normalise gradients
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;

        // Mix final noise value
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                    dot(p2,x2), dot(p3,x3) ) );
    }

    // Fractal Brownian Motion for more rocky detail
    float fbm(vec3 x) {
        float v = 0.0;
        float a = 0.5;
        vec3 shift = vec3(100);
        for (int i = 0; i < 4; ++i) {
            v += a * snoise(x);
            x = x * 2.0 + shift;
            a *= 0.5;
        }
        return v;
    }

    void main() {
      vUv = uv;
      vNormal = normal;
      vPosition = position;
      
      // Calculate noise-based displacement with FBM for rocky feel
      float noise = fbm(position * noiseScale + time * 0.2);
      vec3 newPosition = position + normal * noise * 0.4; // More pronounced displacement
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `,
  // Fragment Shader
  `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    uniform float time;
    uniform vec3 color1;
    uniform vec3 color2;
    uniform float noiseScale;
    uniform float opacity;
    uniform float explosionFactor; // New uniform for cracks effect

    // Re-declare noise function for fragment shader
    vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
    float snoise(vec3 v){ 
        const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
        const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i  = floor(v + dot(v, C.yyy) );
        vec3 x0 = v - i + dot(i, C.xxx) ;
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min( g.xyz, l.zxy );
        vec3 i2 = max( g.xyz, l.zxy );
        vec3 x1 = x0 - i1 + 1.0 * C.xxx;
        vec3 x2 = x0 - i2 + 2.0 * C.xxx;
        vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
        i = mod(i, 289.0 ); 
        vec4 p = permute( permute( permute( 
                    i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
                + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
        float n_ = 1.0/7.0; 
        vec3  ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z *ns.z); 
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ ); 
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4( x.xy, y.xy );
        vec4 b1 = vec4( x.zw, y.zw );
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
    }

    float fbm(vec3 x) {
        float v = 0.0;
        float a = 0.5;
        vec3 shift = vec3(100);
        for (int i = 0; i < 4; ++i) {
            v += a * snoise(x);
            x = x * 2.0 + shift;
            a *= 0.5;
        }
        return v;
    }

    void main() {
      // Create a swirling noise pattern
      float n = fbm(vPosition * 2.5 + time * 0.5);
      
      // Mix between the two colors based on noise
      vec3 rockColor = mix(color1, color2, n * 0.5 + 0.5);

      // Darken the deep crevices
      rockColor *= smoothstep(-0.2, 0.8, n);
      
      // CRACKS EFFECT: Glowing paths as it heats up for explosion
      float cracks = smoothstep(0.4, 0.0, abs(n - 0.2));
      vec3 crackColor = vec3(1.0, 0.3, 0.0) * cracks * explosionFactor * 12.0; // ORANGE MAGMA
      
      vec3 finalColor = rockColor + crackColor;
      
      gl_FragColor = vec4(finalColor, opacity);
    }
  `
)
extend({ AsteroidMaterial })

const PARTICLE_COUNT = 20000 // 20,000 white round particles for a nova burst

export function Asteroid() {
    const groupRef = useRef<THREE.Group>(null!)
    const meshRef = useRef<THREE.Mesh>(null!)
    const lightRef = useRef<THREE.PointLight>(null!)
    const pointsRef = useRef<THREE.Points>(null!)
    const materialRef = useRef<THREE.ShaderMaterial>(null!)
    const scroll = useScroll()
    const [manualExp, setManualExp] = useState(false)
    const [isExplosionActive, setIsExplosionActive] = useState(false)
    const [isBigExplosion, setIsBigExplosion] = useState(false)
    const manualExpTimeRef = useRef(0)
    const soundPlayedRef = useRef(false)
    const maxExpRef = useRef(0) // Track max explosion to prevent backwards rewind

    useEffect(() => {
        const handleManual = (e: Event) => {
            const detail = (e as CustomEvent).detail
            setManualExp(true)
            manualExpTimeRef.current = Date.now()
            setIsBigExplosion(detail?.isBig || false)
        }
        window.addEventListener('manual-explosion-trigger', handleManual)
        return () => window.removeEventListener('manual-explosion-trigger', handleManual)
    }, [])

    // Create a perfectly smooth radial gradient texture to completely avoid squares
    const particleTexture = useMemo(() => {
        const canvas = document.createElement('canvas')
        canvas.width = 64
        canvas.height = 64
        const ctx = canvas.getContext('2d')
        if (ctx) {
            const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
            gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)')
            gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)')
            gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.05)')
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
            ctx.fillStyle = gradient
            ctx.fillRect(0, 0, 64, 64)
        }
        return new THREE.CanvasTexture(canvas)
    }, [])

    // Prepare scattered explosion geometry targets and base (assembled) positions
    const { basePositions, targetPositions, colors, sizes } = useMemo(() => {
        const base = new Float32Array(PARTICLE_COUNT * 3)
        const target = new Float32Array(PARTICLE_COUNT * 3)
        const cols = new Float32Array(PARTICLE_COUNT * 3)
        const sz = new Float32Array(PARTICLE_COUNT)

        // Pure white nova palette — thousands of white spheres
        const palette = [
            [1.0, 0.7, 0.0],          // Vivid Orange
            [1.0, 0.9, 0.2],          // Bright Amber
            [1.0, 1.0, 1.0],          // Pure white core flash
            [1.0, 0.5, 0.0],          // Deep Orange
            [1.0, 0.8, 0.4],          // Soft Amber
            [1.0, 1.0, 0.8],          // Ivory white
        ]

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            // Distribute particles across a sphere surface (the asteroid surface)
            const u = Math.random()
            const v = Math.random()
            const theta = u * 2.0 * Math.PI
            const phi = Math.acos(2.0 * v - 1.0)

            // Tight cluster on surface for a sharp burst
            const r = 0.6 + Math.random() * 0.5

            const nx = Math.sin(phi) * Math.cos(theta)
            const ny = Math.sin(phi) * Math.sin(theta)
            const nz = Math.cos(phi)

            base[i * 3 + 0] = nx * r
            base[i * 3 + 1] = ny * r
            base[i * 3 + 2] = nz * r

            // --- Explosion targets: radiate from absolute center (0,0,0) ---
            // Two classes: fast high-energy shrapnel vs slow drifting micro-dust
            const isFast = Math.random() > 0.6
            // Expansive full-screen explosion speeds
            const speed = isFast
                ? (15 + Math.random() * 30)   // Fast shrapnel flying out to edges
                : (5 + Math.random() * 15)    // Drifting dust pushing far out

            // Fully random direction from center - true spherical burst
            const scatterX = (Math.random() - 0.5) * 10
            const scatterY = (Math.random() - 0.5) * 10
            const scatterZ = (Math.random() - 0.5) * 10

            // Slight downward gravity drift for slower dust
            const drift = isFast ? -(Math.random() * 1) : -(Math.random() * 3 + 0.5)

            target[i * 3 + 0] = nx * speed + scatterX
            target[i * 3 + 1] = ny * speed + scatterY + drift
            target[i * 3 + 2] = nz * speed + scatterZ

            // Colors: white/blush palette
            const c = palette[Math.floor(Math.random() * palette.length)]
            cols[i * 3 + 0] = c[0]
            cols[i * 3 + 1] = c[1]
            cols[i * 3 + 2] = c[2]

            // Varied sizes for visual richness — larger on average
            sz[i] = 0.004 + Math.random() * 0.016
        }
        return { basePositions: base, targetPositions: target, colors: cols, sizes: sz }
    }, [])

    // Typed array to hold the animated positions every frame so we can update freely
    const currentPositions = useMemo(() => new Float32Array(basePositions), [basePositions])

    useFrame((state, delta) => {
        if (!groupRef.current) return

        const clampedScroll = Math.max(0, Math.min(1, scroll.offset))

        // Reset manual explosion if we scroll back to the very top (healing the asteroid)
        if (clampedScroll < 0.01) {
            if (manualExp) {
                setManualExp(false)
                setIsBigExplosion(false)
                soundPlayedRef.current = false
            }
            if (maxExpRef.current > 0.0) {
                // Pick a new random color when the asteroid is restored
                if (materialRef.current) {
                    const h1 = Math.random() // Random base hue
                    materialRef.current.uniforms.color1.value.setHSL(h1, 0.9, 0.5)
                    materialRef.current.uniforms.color2.value.setHSL((h1 + 0.1) % 1.0, 0.9, 0.3)
                }
            }
            maxExpRef.current = 0 // Allow assembly at top
        }

        // ── 0. Assembly progress (scroll 0.0 -> 0.4) ──
        const assembleProgress = Math.min(1, clampedScroll / 0.4)
        const easeAssemble = Math.pow(assembleProgress, 3) // Slower start, snap into place

        // 1. Position the entire group (Asteroid + Core + Particles)
        // Group moves toward center and then orbits
        // const moveProgress = Math.min(clampedScroll, 0.80) / 0.80 
        
        // Target base center
        const baseX = 0
        const baseZ = 0
        
        // Elliptical orbit calculation when nearing the bottom
        const orbitRadiusX = 2.5
        const orbitRadiusZ = 1.8
        const orbitSpeed = state.clock.elapsedTime * 0.8
        
        const orbitX = Math.cos(orbitSpeed) * orbitRadiusX
        const orbitZ = Math.sin(orbitSpeed) * orbitRadiusZ
        
        // Blend from initial side position to orbiting position
        const startX = 2.0
        const startZ = -1.5
        
        // If we are deep enough into the scroll, we orbit. Otherwise we move to center.
        const orbitInfluence = Math.max(0, (clampedScroll - 0.5) / 0.3) // 0 at 0.5, 1 at 0.8
        
        const targetX = THREE.MathUtils.lerp(startX, baseX + orbitX, orbitInfluence)
        const targetZ = THREE.MathUtils.lerp(startZ, baseZ + orbitZ, orbitInfluence)
        
        groupRef.current.position.z = THREE.MathUtils.damp(groupRef.current.position.z, targetZ, 2, delta)
        groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, targetX, 2, delta)
        groupRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.5 // More vertical float

        // Asteroid Group slow rotation
        groupRef.current.rotation.x += delta * 0.2
        groupRef.current.rotation.y += delta * 0.3

        // 2. Explosion progress (scroll 0.82 -> 1.0 or manual trigger)
        let expProgress = Math.max(0, (clampedScroll - 0.82) / 0.18)
        
        // Manual explosion override (fast progress)
        if (manualExp) {
            const elapsed = (Date.now() - manualExpTimeRef.current) / 1000
            const manualProgress = Math.min(1, elapsed / 1.5) // 1.5s for full manual explosion
            expProgress = Math.max(expProgress, manualProgress)
        }

        // Prevent rewinding the explosion when scrolling back up
        if (expProgress > maxExpRef.current) maxExpRef.current = expProgress
        else expProgress = maxExpRef.current

        // easeOutQuint: violent burst, then slow drift
        const easeFirework = 1 - Math.pow(1 - expProgress, 5)

        // Update explosion active state for the secondary system
        const shouldBeActive = expProgress > 0.01
        if (shouldBeActive !== isExplosionActive) setIsExplosionActive(shouldBeActive)

        // Trigger sound once
        if (shouldBeActive && !soundPlayedRef.current) {
            window.dispatchEvent(new Event('play-explosion-boom'))
            soundPlayedRef.current = true
        }
        if (!shouldBeActive) soundPlayedRef.current = false

        // Combine assembly and explosion for particle positions
        // Before 0.80, we lerp from targetPositions (scattered) to basePositions (assembled)
        // After 0.80, we lerp from basePositions (assembled) to targetPositions (scattered)

        // Update Asteroid Shader Material
        if (meshRef.current && materialRef.current) {
            // @ts-expect-error - custom material instance
            materialRef.current.time += delta
            
            // Heat up before kaboom
            // @ts-expect-error - custom material instance
            materialRef.current.explosionFactor = expProgress < 0.1 ? expProgress * 10 : 1.0

            // Shell fades away fast as explosion starts, starts translucent
            const shellOpacity = Math.max(0, 0.8 - expProgress * 6.0)
            // @ts-ignore
            materialRef.current.opacity = shellOpacity
            meshRef.current.visible = shellOpacity > 0.01
        }

        // Explosion point light: brief white flash at origin
        if (lightRef.current) {
            // Sharp spike at very start, vanishes quickly
            const lightFlash = expProgress < 0.1
                ? (expProgress / 0.1)
                : Math.max(0, 1 - (expProgress - 0.1) / 0.2)
            lightRef.current.intensity = Math.max(0, lightFlash * 150) // Brighter flash
        }

        // Update Explosion points
        if (pointsRef.current) {
            const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                if (expProgress > 0) {
                    // Exploding
                    posAttr.array[i * 3 + 0] = THREE.MathUtils.lerp(basePositions[i * 3 + 0], targetPositions[i * 3 + 0], easeFirework)
                    posAttr.array[i * 3 + 1] = THREE.MathUtils.lerp(basePositions[i * 3 + 1], targetPositions[i * 3 + 1], easeFirework)
                    posAttr.array[i * 3 + 2] = THREE.MathUtils.lerp(basePositions[i * 3 + 2], targetPositions[i * 3 + 2], easeFirework)
                } else {
                    // Assembling
                    posAttr.array[i * 3 + 0] = THREE.MathUtils.lerp(targetPositions[i * 3 + 0] * 0.5, basePositions[i * 3 + 0], easeAssemble)
                    posAttr.array[i * 3 + 1] = THREE.MathUtils.lerp(targetPositions[i * 3 + 1] * 0.5, basePositions[i * 3 + 1], easeAssemble)
                    posAttr.array[i * 3 + 2] = THREE.MathUtils.lerp(targetPositions[i * 3 + 2] * 0.5, basePositions[i * 3 + 2], easeAssemble)
                }
            }
            posAttr.needsUpdate = true

            // Opacity curve: ramps up instantly, then smoothly fades out
            // We want it to be fully visible the moment the asteroid disappears (expProgress ~ 0.1)
            const pOpacity = expProgress < 0.05
                ? (expProgress / 0.05) // 0 to 1 super fast
                : (1 - (expProgress - 0.05) / 0.95) // 1 to 0 gradually
            
            // Shader material update for particles
            const ptMat = pointsRef.current.material as THREE.ShaderMaterial
            if (ptMat.uniforms && ptMat.uniforms.opacity) {
                ptMat.uniforms.opacity.value = pOpacity * 1.0 // Make it slightly more dense
            }
            pointsRef.current.visible = pOpacity > 0.01
        }
    })

    const chargeStartRef = useRef<number | null>(null)
    const isChargingRef = useRef(false)

    const fireShot = (isTargetHit: boolean) => {
        if (!chargeStartRef.current) return
        const charge = Math.min(1, (Date.now() - chargeStartRef.current) / 1500)
        chargeStartRef.current = null
        isChargingRef.current = false

        window.dispatchEvent(new Event('play-charge-stop'))
        window.dispatchEvent(new CustomEvent('laser-beam', { detail: { charge } }))
        window.dispatchEvent(new CustomEvent('play-plasma-shot', { detail: { charge } }))
        window.dispatchEvent(new Event('gallery-shot-flash'))

        if (isTargetHit) {
            // Trigger the explosion with 'isBig' if charge is nearly maxed
            window.dispatchEvent(new CustomEvent('manual-explosion-trigger', { 
                detail: { isBig: charge > 0.85 } 
            }))
            
            // Siphon Core Data (Reward instead of interruption)
            window.dispatchEvent(new CustomEvent('siphon-data', {
                detail: { 
                    message: 'CORE_MANIFEST_EXTRACTED',
                    color: '#8b5cf6' 
                }
            }))
        }
    }

    return (
        <group ref={groupRef}>
            {/* Bright White explosion light — brief spike at detonation */}
            <pointLight ref={lightRef} intensity={0} color="#ffffff" distance={40} decay={1.5} />



            {/* Glowing Outer Asteroid Shell */}
            <mesh 
                ref={meshRef}
                onPointerDown={(e) => {
                    e.stopPropagation()
                    chargeStartRef.current = Date.now()
                    isChargingRef.current = true
                    window.dispatchEvent(new Event('play-charge-start'))
                }}
                onPointerUp={(e) => {
                    e.stopPropagation()
                    if (isChargingRef.current) fireShot(true)
                }}
                onPointerMissed={() => {
                    if (isChargingRef.current) fireShot(false)
                }}
            >
                <icosahedronGeometry args={[1, 12]} /> {/* Higher detail for rockier look */}
                {/* @ts-expect-error - custom material instance */}
                <asteroidMaterial ref={materialRef} transparent depthWrite={false} toneMapped={false} />
            </mesh>

            {/* Secondary vibrant explosion system — Now supports 'isBig' for randomized color bursts */}
            <Explosion active={isExplosionActive} isBig={isBigExplosion} />

            {/* Assembling/Disassembling Particles */}
            <points ref={pointsRef}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={PARTICLE_COUNT} array={currentPositions} itemSize={3} />
                    <bufferAttribute attach="attributes-color" count={PARTICLE_COUNT} array={colors} itemSize={3} />
                    <bufferAttribute attach="attributes-size" count={PARTICLE_COUNT} array={sizes} itemSize={1} />
                </bufferGeometry>
                <shaderMaterial
                    transparent
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    uniforms={{
                        opacity: { value: 0 },
                        particleTexture: { value: particleTexture }
                    }}
                    vertexShader={`
                        attribute float size;
                        varying vec3 vColor;
                        void main() {
                            vColor = color;
                            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                            gl_PointSize = size * (600.0 / -mvPosition.z);
                            gl_Position = projectionMatrix * mvPosition;
                        }
                    `}
                    fragmentShader={`
                        uniform float opacity;
                        uniform sampler2D particleTexture;
                        varying vec3 vColor;
                        void main() {
                            // High performance radial disk
                            vec2 coord = gl_PointCoord - vec2(0.5);
                            float dist = length(coord);
                            if (dist > 0.5) discard;
                            float alpha = smoothstep(0.5, 0.4, dist);
                            gl_FragColor = vec4(vColor, alpha * opacity);
                        }
                    `}
                    vertexColors
                />
            </points>
        </group>
    )
}
