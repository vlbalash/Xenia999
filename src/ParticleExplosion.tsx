import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useScroll } from '@react-three/drei'

const vertexShader = `
  uniform float uTime;
  uniform float uExplosion;

  attribute vec3 aRandom;

  void main() {

    vec3 dir = normalize(position);
    
    // Non-linear explosion force for dramatic "pop"
    float force = pow(uExplosion, 3.0) * 25.0;
    
    // Streaking effect: particles stretch in the direction of motion
    vec3 newPosition = position + dir * force * (aRandom.x * 0.5 + 0.5);
    
    // Turbulence
    newPosition.x += sin(uTime * 3.0 + aRandom.y * 50.0) * uExplosion * 0.5;
    newPosition.y += cos(uTime * 3.0 + aRandom.z * 50.0) * uExplosion * 0.5;

    vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
    
    // Dynamic size: Big at start, then thin out
    float size = (4.0 + aRandom.y * 15.0);
    gl_PointSize = size * (1.0 + uExplosion * 5.0);
    
    // Distance attenuation
    gl_PointSize *= (1.0 / -mvPosition.z);
    
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = `
  uniform float uExplosion;
  uniform vec3 uColor;

  void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist > 0.5) discard;
    
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    alpha = pow(alpha, 3.0); // Tighter core
    
    // Flash effect
    float flash = smoothstep(0.8, 0.95, uExplosion) * (1.0 - smoothstep(0.95, 1.0, uExplosion));
    vec3 finalColor = mix(uColor, vec3(1.0, 1.0, 1.0), uExplosion * 0.9 + flash);
    
    // Fade out
    alpha *= (1.5 - uExplosion * 1.5);
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`

export default function ParticleExplosion() {
    const pointsRef = useRef<THREE.Points>(null!)
    const scroll = useScroll()
    const count = 15000

    const [positions, randomness] = useMemo(() => {
        const pos = new Float32Array(count * 3)
        const rand = new Float32Array(count * 3)
        for (let i = 0; i < count; i++) {
            // Distribute in a shell
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
        uColor: { value: new THREE.Color('#00ffff') }
    }), [])

    useFrame((state) => {
        const offset = scroll.offset // 0 to 1

        // Aggressive mapping for the final page
        const explosionFactor = Math.pow(Math.max(0, (offset - 0.8) * 5.0), 1.5)

        uniforms.uExplosion.value = THREE.MathUtils.lerp(uniforms.uExplosion.value, explosionFactor, 0.15)
        uniforms.uTime.value = state.clock.elapsedTime

        // Color shifts to a white-hot magenta peak
        if (offset > 0.8) {
            uniforms.uColor.value.lerp(new THREE.Color('#ffffff'), 0.1)
        } else if (offset > 0.5) {
            uniforms.uColor.value.lerp(new THREE.Color('#ff00ff'), 0.05)
        } else {
            uniforms.uColor.value.lerp(new THREE.Color('#00ffff'), 0.05)
        }

        if (pointsRef.current) {
            pointsRef.current.rotation.y += 0.002
            pointsRef.current.rotation.x += 0.001
        }
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
