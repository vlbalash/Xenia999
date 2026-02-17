import { useRef, useMemo } from 'react'
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

export default function NeuralCore() {
    const meshRef = useRef<THREE.Mesh>(null!)
    const materialRef = useRef<any>(null!)
    const fresnelRef = useRef<THREE.ShaderMaterial>(null!)
    const innerRef = useRef<THREE.Mesh>(null!)
    const glowMeshRef = useRef<THREE.Mesh>(null!)
    const scroll = useScroll()
    const breathRef = useRef(0)

    // Fresnel uniforms
    const fresnelUniforms = useMemo(() => ({
        uColor: { value: new THREE.Color('#00ffff') },
        uIntensity: { value: 1.5 },
        uPower: { value: 2.5 },
    }), [])

    useFrame((state, delta) => {
        if (!meshRef.current || !materialRef.current) return

        const offset = scroll.offset
        const time = state.clock.elapsedTime

        // ── Breathing pulse ──
        breathRef.current = Math.sin(time * 1.2) * 0.06 + Math.sin(time * 2.7) * 0.02

        // Mouse Interaction (Subtle tilt)
        const targetX = state.pointer.y * 0.3
        const targetY = state.pointer.x * 0.3

        meshRef.current.rotation.x = THREE.MathUtils.damp(meshRef.current.rotation.x, targetX + delta * 0.2, 4, delta)
        meshRef.current.rotation.y = THREE.MathUtils.damp(meshRef.current.rotation.y, targetY + delta * 0.3 + (offset * 2), 4, delta)

        const baseColor = new THREE.Color()

        if (offset < 0.33) {
            const t = offset / 0.33
            baseColor.lerpColors(new THREE.Color('#00ffff'), new THREE.Color('#8a2be2'), t)
            materialRef.current.distort = THREE.MathUtils.lerp(0.4, 0.6, t)
            materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(0.5, 1.0, t)
            meshRef.current.scale.setScalar(1 + breathRef.current)
        } else if (offset < 0.70) {
            const t = (offset - 0.33) / 0.37
            baseColor.lerpColors(new THREE.Color('#8a2be2'), new THREE.Color('#ff00ff'), t)
            materialRef.current.distort = THREE.MathUtils.lerp(0.6, 1.0, t)
            materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(1.0, 2.0, t)
            meshRef.current.scale.setScalar(THREE.MathUtils.lerp(1, 1.5, t) + breathRef.current)
        } else {
            const t = (offset - 0.70) / 0.30
            baseColor.lerpColors(new THREE.Color('#ff00ff'), new THREE.Color('cyan'), t)
            materialRef.current.distort = THREE.MathUtils.lerp(1.0, 0.3, t)
            materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(2.0, 1.0, t)
            meshRef.current.scale.setScalar(THREE.MathUtils.lerp(1.5, 0.8, t))
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

        materialRef.current.color.copy(baseColor)
        materialRef.current.emissive.copy(baseColor).multiplyScalar(0.5)
    })

    return (
        <group>
            <mesh ref={innerRef}>
                <icosahedronGeometry args={[1, 1]} />
                <meshBasicMaterial
                    color="white"
                    wireframe
                    transparent
                    opacity={0.2}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>

            <Sphere args={[1, 64, 64]} ref={meshRef}>
                <MeshDistortMaterial
                    ref={materialRef}
                    speed={2}
                    distort={0.4}
                    radius={1}
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
