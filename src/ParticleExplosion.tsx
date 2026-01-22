import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useScroll } from '@react-three/drei'

const vertexShader = `
  varying vec2 vUv;
  varying float vPull;
  uniform float uTime;
  uniform float uExplosion;

  attribute vec3 aRandom;

  void main() {
    vUv = uv;
    
    // Calculate direction from center
    vec3 dir = normalize(position);
    
    // Explosion force based on uExplosion (0 to 1)
    // Particles move away from center with some randomness
    float force = pow(uExplosion, 2.0) * 10.0;
    vec3 newPosition = position + dir * force * aRandom.x;
    
    // Add some noise/turbulence
    newPosition.x += sin(uTime + aRandom.y * 10.0) * uExplosion * 0.5;
    newPosition.y += cos(uTime + aRandom.z * 10.0) * uExplosion * 0.5;

    vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
    
    // Size attenuation (bigger as they explode outward)
    gl_PointSize = (2.0 + aRandom.x * 5.0) * (1.0 + uExplosion * 2.0);
    gl_PointSize *= (1.0 / -mvPosition.z);
    
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = `
  varying vec2 vUv;
  uniform float uExplosion;
  uniform vec3 uColor;

  void main() {
    // Round particles
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist > 0.5) discard;
    
    // Glow effect
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    
    // Color shift on explosion
    vec3 color = mix(uColor, vec3(1.0), uExplosion * 0.5);
    
    gl_FragColor = vec4(color, alpha * (1.0 - uExplosion * 0.5));
  }
`

export default function ParticleExplosion() {
    const pointsRef = useRef<THREE.Points>(null!)
    const scroll = useScroll()
    const count = 5000

    const [positions, randomness] = useMemo(() => {
        const pos = new Float32Array(count * 3)
        const rand = new Float32Array(count * 3)
        for (let i = 0; i < count; i++) {
            // Start as a sphere
            const phi = Math.acos(-1 + (2 * i) / count)
            const theta = Math.sqrt(count * Math.PI) * phi
            const x = Math.cos(theta) * Math.sin(phi)
            const y = Math.sin(theta) * Math.sin(phi)
            const z = Math.cos(phi)

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
        uColor: { value: new THREE.Color('#00ffff') }
    }), [])

    useFrame((state) => {
        const offset = scroll.offset // 0 to 1

        // Trigger explosion only at the very end (Singularity)
        // From 0.85 to 1.0 mapped to 0 to 1
        const explosionFactor = Math.max(0, (offset - 0.85) * 6.66)

        uniforms.uExplosion.value = THREE.MathUtils.lerp(uniforms.uExplosion.value, explosionFactor, 0.1)
        uniforms.uTime.value = state.clock.elapsedTime

        // Colors transition to magenta
        if (offset > 0.5) {
            uniforms.uColor.value.lerp(new THREE.Color('#ff00ff'), 0.05)
        } else {
            uniforms.uColor.value.lerp(new THREE.Color('#00ffff'), 0.05)
        }

        // Rotate the system
        pointsRef.current.rotation.y += 0.001
        pointsRef.current.rotation.x += 0.0005
    })

    return (
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
    )
}
