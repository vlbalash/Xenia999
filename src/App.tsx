import { Canvas } from '@react-three/fiber'
import { ScrollControls } from '@react-three/drei'
import Scene from './Scene'
import { Overlay } from './Overlay'
import { Suspense, useState, useEffect } from 'react'
import Audio from './Audio'
import { Crosshair } from './Crosshair'
import { Preloader } from './components/Preloader'
import { Logbook } from './components/passport/Logbook'
import { ScoreHUD } from './ScoreHUD'
import { BurstOverlay } from './BurstOverlay'
import { AudioButton } from './components/AudioButton'
import { SiphonHUD } from './SiphonHUD'

/**
 * App — root layout.
 * - Graceful degradation: Mobiles skip WebGL entirely.
 */
function App() {
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    useEffect(() => {
        if (isMobile) {
            // Auto-unlock combat discount for mobile users who can't play the micro-game
            setTimeout(() => {
                window.dispatchEvent(new Event('discount-unlocked'))
                window.dispatchEvent(new CustomEvent('siphon-data', { 
                    detail: { message: 'Mobile Vanguard Detected', color: '#22d3ee' } 
                }))
            }, 500)
        }
    }, [isMobile])

    if (isMobile) {
        return (
            <div className="w-full min-h-screen bg-stone-900 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_center,#22d3ee_0%,transparent_60%)]" />
                
                <div className="z-10 flex flex-col items-center">
                    <h1 className="text-4xl font-black font-syncopate tracking-[0.3em] text-white mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                        XXXENIA999
                    </h1>
                    <p className="text-stone-300 font-inter mb-12 max-w-sm text-sm leading-relaxed tracking-wide">
                        Premium WebGL & AI infrastructures. Engineered for conversion, built for scale.
                    </p>
                    
                    <button
                       onClick={() => window.dispatchEvent(new Event('open-logbook'))}
                       className="bg-cyan-500 hover:bg-cyan-400 text-stone-900 font-orbitron font-black text-sm tracking-[0.3em] px-8 py-5 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.4)] z-10 transition-all active:scale-95 border border-cyan-300/50"
                    >
                        INITIALIZE PROTOCOL
                    </button>
                </div>
                
                <Logbook />
            </div>
        )
    }

    return (
        <>
            <Preloader />
            <Canvas>
                <Suspense fallback={null}>
                    <ScrollControls pages={6} damping={0.35}>
                        <Scene />
                        <Overlay />
                    </ScrollControls>
                </Suspense>
            </Canvas>
            <Audio />
            <Crosshair />
            <Logbook />

            <AudioButton />
            <ScoreHUD />
            <SiphonHUD />
            <BurstOverlay />
        </>
    )
}

export default App
