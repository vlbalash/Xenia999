import { Canvas } from '@react-three/fiber'
import { ScrollControls } from '@react-three/drei'
import Scene from './Scene'
import { Overlay } from './Overlay'
import { Suspense } from 'react'
import Audio from './Audio'

function App() {
    return (
        <>
            <Canvas>
                <Suspense fallback={null}>
                    <ScrollControls pages={8} damping={0.2}>
                        <Scene />
                        <Overlay />
                    </ScrollControls>
                </Suspense>
            </Canvas>
            <Audio />
        </>
    )
}

export default App
