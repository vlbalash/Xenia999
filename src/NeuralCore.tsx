import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshDistortMaterial, Sphere, useScroll } from '@react-three/drei'
import * as THREE from 'three'

/* ──────── Fresnel shader for edge glow ──────── */
const fresnelVertexShader = `
varying vec3 vNormal;
varying vec3 vViewDir;
void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
}
`
const fresnelFragmentShader = `
uniform vec3 uColor;
uniform float uIntensity;
uniform float uPower;
varying vec3 vNormal;
varying vec3 vViewDir;
void main() {
    float fresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), uPower);
    gl_FragColor = vec4(uColor * fresnel * uIntensity, fresnel * 0.8);
}
`

interface NeuralCoreProps {
    envMap?: THREE.Texture
}

export default function NeuralCore({ envMap }: NeuralCoreProps) {
    const meshRef = useRef<THREE.Mesh>(null!)
    const materialRef = useRef<React.ElementRef<typeof MeshDistortMaterial>>(null!)
    const fresnelRef = useRef<THREE.ShaderMaterial>(null!)
    const innerRef = useRef<THREE.Mesh>(null!)
    const glowMeshRef = useRef<THREE.Mesh>(null!)
    const scroll = useScroll()
    const breathRef = useRef(0)
    const audioPeakRef = useRef(0) // Audio reactivity intensity (0..1)

    // Cached color instances to avoid GC pressure in useFrame
    const baseColor = useMemo(() => new THREE.Color(), [])
    const colorA = useMemo(() => new THREE.Color(), [])
    const colorB = useMemo(() => new THREE.Color(), [])

    // Listen to audio peak events from Audio.tsx
    useEffect(() => {
        const handlePeak = (e: Event) => {
            const detail = (e as CustomEvent).detail
            audioPeakRef.current = Math.min(1, detail.intensity)
        }
        window.addEventListener('audio-glitch-peak', handlePeak)
        return () => window.removeEventListener('audio-glitch-peak', handlePeak)
    }, [])

    // Fresnel uniforms
    const fresnelUniforms = useMemo(() => ({
        uColor: { value: new THREE.Color('#00ffff') },
        uIntensity: { value: 2.0 },
        uPower: { value: 3.5 },
    }), [])

    useFrame((state, delta) => {
        if (!meshRef.current || !materialRef.current) return

        const offset = scroll.offset
        const time = state.clock.elapsedTime

        // ── Breathing pulse ──
        breathRef.current = Math.sin(time * 1.2) * 0.06 + Math.sin(time * 2.7) * 0.02

        // ── Audio reactivity — decay the peak smoothly ──
        const audioPeak = audioPeakRef.current
        audioPeakRef.current *= 0.92 // Smooth decay

        // Mouse Interaction (Stretching & Tilt)
        const targetX = state.pointer.y * 0.3
        const targetY = state.pointer.x * 0.3

        // Calculate distance from center for "Stretch" effect
        const mouseDist = Math.sqrt(state.pointer.x ** 2 + state.pointer.y ** 2)
        const stretchFactor = Math.max(0, 1 - mouseDist * 2) // Close to center = high stretch

        // Apply stretch: pull towards mouse
        const stretchX = state.pointer.x * stretchFactor * 0.5
        const stretchY = state.pointer.y * stretchFactor * 0.5

        meshRef.current.rotation.x = THREE.MathUtils.damp(meshRef.current.rotation.x, targetX + delta * 0.2 + stretchY, 4, delta)
        meshRef.current.rotation.y = THREE.MathUtils.damp(meshRef.current.rotation.y, targetY + delta * 0.3 + (offset * 2) - stretchX, 4, delta)

        // Deform scale based on stretch
        const baseScale = 1 + breathRef.current
        meshRef.current.scale.set(
            baseScale + Math.abs(stretchX) * 0.5,
            baseScale + Math.abs(stretchY) * 0.5,
            baseScale + stretchFactor * 0.2
        )

        if (offset < 0.33) {
            const t = offset / 0.33
            baseColor.lerpColors(colorA.set('#00ffff'), colorB.set('#8a2be2'), t)
            materialRef.current.distort = THREE.MathUtils.lerp(0.4, 0.6, t) + audioPeak * 0.6
            materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(0.5, 1.0, t) + audioPeak * 3
            meshRef.current.scale.setScalar(1 + breathRef.current + audioPeak * 0.3)
        } else if (offset < 0.70) {
            const t = (offset - 0.33) / 0.37
            baseColor.lerpColors(colorA.set('#8a2be2'), colorB.set('#ff00ff'), t)
            materialRef.current.distort = THREE.MathUtils.lerp(0.6, 1.0, t) + audioPeak * 0.6
            materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(1.0, 2.0, t) + audioPeak * 3
            meshRef.current.scale.setScalar(THREE.MathUtils.lerp(1, 1.5, t) + breathRef.current + audioPeak * 0.3)
        } else {
            const t = (offset - 0.70) / 0.30
            baseColor.lerpColors(colorA.set('#ff00ff'), colorB.set('cyan'), t)
            materialRef.current.distort = THREE.MathUtils.lerp(1.0, 0.3, t) + audioPeak * 0.6
            materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(2.0, 1.0, t) + audioPeak * 3
            meshRef.current.scale.setScalar(THREE.MathUtils.lerp(1.5, 0.8, t) + audioPeak * 0.3)
        }

        // ── Update Fresnel glow ──
        if (fresnelRef.current) {
            fresnelRef.current.uniforms.uColor.value.copy(baseColor)
            const fresnelPulse = 1.2 + Math.sin(time * 2.0) * 0.3
            fresnelRef.current.uniforms.uIntensity.value = THREE.MathUtils.lerp(
                fresnelRef.current.uniforms.uIntensity.value,
                fresnelPulse,
                0.05
            )
        }

        // ── Sync glow mesh and inner wireframe ──
        if (glowMeshRef.current) {
            glowMeshRef.current.position.copy(meshRef.current.position)
            glowMeshRef.current.rotation.copy(meshRef.current.rotation)
            glowMeshRef.current.scale.copy(meshRef.current.scale).multiplyScalar(1.08)
        }

        if (innerRef.current) {
            innerRef.current.position.copy(meshRef.current.position)
            innerRef.current.rotation.x = meshRef.current.rotation.x * -0.7 + time * 0.15
            innerRef.current.rotation.y = meshRef.current.rotation.y * -0.7 + time * 0.2
            innerRef.current.scale.setScalar(meshRef.current.scale.x * 0.85)
        }

        // materialRef.current.color.copy(baseColor)
        // materialRef.current.emissive.copy(baseColor).multiplyScalar(0.5)
    })

    return (
        <group>
            <Sphere args={[1, 64, 64]} ref={meshRef}>
                <MeshDistortMaterial
                    ref={materialRef}
                    speed={5}
                    distort={1.0}
                    radius={1}
                    color="#ffffff"
                    metalness={1.0}
                    roughness={0.0}
                    clearcoat={1.0}
                    clearcoatRoughness={0.0}
                    envMap={envMap}
                />
            </Sphere>

            <mesh ref={glowMeshRef}>
                <sphereGeometry args={[1, 64, 64]} />
                <shaderMaterial
                    ref={fresnelRef}
                    vertexShader={fresnelVertexShader}
                    fragmentShader={fresnelFragmentShader}
                    uniforms={fresnelUniforms}
                    transparent
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>
        </group>
    )
}
