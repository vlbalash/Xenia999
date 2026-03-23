import { Canvas } from '@react-three/fiber'
import { ScrollControls } from '@react-three/drei'
import Scene from './Scene'
import { Suspense, useState, useEffect } from 'react'
import Audio from './Audio'
import { BriefingSystem } from './BriefingSystem'
import { Dashboard } from './Dashboard'
import MixerCursor from './MixerCursor'
import ScrollIndicator from './ScrollIndicator'

import { SPHERE_COLORS } from './constants'

function App() {
    const [briefingOpen, setBriefingOpen] = useState(false)
    const [sphereColorIndex, setSphereColorIndex] = useState(0)
    const [isCoreLightOn, setIsCoreLightOn] = useState(false)

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | null = null
        const handler = () => {
            // Delay so the particle explosion is visible before briefing opens
            timer = setTimeout(() => setBriefingOpen(true), 650)
        }
        window.addEventListener('auto-open-briefing', handler)
        return () => {
            window.removeEventListener('auto-open-briefing', handler)
            if (timer) clearTimeout(timer)
        }
    }, [])

    const handleToggleAudio = () => {
        window.dispatchEvent(new CustomEvent('toggle-neural-audio'))
    }

    const handleNextColor = () => {
        setSphereColorIndex(i => (i + 1) % SPHERE_COLORS.length)
    }

    return (
        <>
            {/* Premium HTML Dashboard — above everything */}
            <Dashboard
                isOpen={briefingOpen}
                onActivate={() => setBriefingOpen(true)}
                onToggleAudio={handleToggleAudio}
                onNextColor={handleNextColor}
                currentColor={SPHERE_COLORS[sphereColorIndex]}
            />

            <Canvas>
                <Suspense fallback={null}>
                    <ScrollControls pages={briefingOpen ? 0 : 12} damping={0.2}>
                        <Scene
                            briefingOpen={briefingOpen}
                            isCoreLightOn={isCoreLightOn}
                            onToggleCoreLight={() => setIsCoreLightOn(v => !v)}
                            sphereColorIndex={sphereColorIndex}
                        />
                    </ScrollControls>
                </Suspense>
            </Canvas>
            <Audio />
            <MixerCursor />
            {!briefingOpen && <ScrollIndicator />}

            {briefingOpen && (
                <BriefingSystem onClose={() => setBriefingOpen(false)} />
            )}
        </>
    )
}

export default App
