import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useScroll } from '@react-three/drei'

const vertexShader = `
  varying vec2 vUv;
  varying float vLife;
  uniform float uTime;
  uniform float uExplosion;

  attribute vec3 aRandom;

  void main() {
    vUv = uv;
    
    // Spread life/randomness
    vLife = aRandom.x;

    // Calculate direction from center
    vec3 dir = normalize(position);
    
    // Explosion force
    float force = pow(uExplosion, 2.5) * 15.0;
    
    // Add velocity-based stretching (streak effect)
    // We can simulate this by moving the vertex along the direction based on explosion
    vec3 newPosition = position + dir * force * aRandom.x;
    
    // Add some noise/turbulence
    newPosition.x += sin(uTime * 2.0 + aRandom.y * 20.0) * uExplosion * 0.2;
    newPosition.y += cos(uTime * 2.0 + aRandom.z * 20.0) * uExplosion * 0.2;

    vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
    
    // Size attenuation
    // Bigger at the start of explosion, then fade
    float size = (3.0 + aRandom.y * 10.0);
    gl_PointSize = size * (1.0 + uExplosion * 3.0);
    gl_PointSize *= (1.0 / -mvPosition.z);
    
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = `
  varying vec2 vUv;
  varying float vLife;
  uniform float uExplosion;
  uniform vec3 uColor;

  void main() {
    // Round particles with soft edges (glow)
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist > 0.5) discard;
    
    // Inner core vs outer glow
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    alpha = pow(alpha, 2.0); // Sharper glow
    
    // Fade out as they explode
    alpha *= (1.2 - uExplosion);
    
    // Color shift: Cyan -> white -> Magenta
    vec3 finalColor = mix(uColor, vec3(1.0), uExplosion * 0.8);
    
    gl_FragColor = vec4(finalColor, alpha);
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
