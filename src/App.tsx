import { Canvas } from '@react-three/fiber'
import { ScrollControls } from '@react-three/drei'
import Scene from './Scene'
import { AnimatePresence } from 'framer-motion'
import { Overlay } from './Overlay'
import { Suspense, useState, useEffect } from 'react'
import Audio from './Audio'
import Loader from './Loader'

import { Crosshair } from './Crosshair'
import { GlassEffect } from './GlassEffect'
import { Questionnaire } from './Questionnaire'

function App() {
    const [glitch, setGlitch] = useState(false)
    const [showQuestionnaire, setShowQuestionnaire] = useState(false)

    // Expose toggle to window for cards in Overlay
    useEffect(() => {
        (window as any).toggleQuestionnaire = () => setShowQuestionnaire(prev => !prev)
    }, [])

    return (
        <>
            <Canvas>
                <Suspense fallback={null}>
                    <ScrollControls pages={8} damping={0.4}>
                        <Scene glitchActive={glitch} toggleGlitch={() => setGlitch(prev => !prev)} />
                        <Overlay onGlitch={() => setGlitch(prev => !prev)} />
                    </ScrollControls>
                </Suspense>
            </Canvas>
            <Audio />
            <Loader />
            <Crosshair />
            <GlassEffect />
            <AnimatePresence>
                {showQuestionnaire && (
                    <Questionnaire onClose={() => setShowQuestionnaire(false)} />
                )}
            </AnimatePresence>
        </>
    )
}

export default App
