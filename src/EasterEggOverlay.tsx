import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

// Data Fragment Types
const FRAGMENTS = [
    {
        id: 0,
        title: 'NETWORK_ALPHA',
        color: '#00ffff',
        bg: 'radial-gradient(circle at center, #001133 0%, #000000 100%)',
        art: (
            <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, border: '2px solid #00ffff', borderRadius: '50%', opacity: 0.5, animation: 'pulse 2s infinite' }}></div>
                <div style={{ position: 'absolute', top: '20%', left: '20%', width: '60%', height: '60%', border: '1px dashed #00ffff', transform: 'rotate(45deg)' }}></div>
                <div style={{ position: 'absolute', inset: 0, background: 'conic-gradient(from 0deg, transparent 0%, #00ffff 20%, transparent 40%)', animation: 'spin 4s linear infinite' }}></div>
            </div>
        )
    },
    {
        id: 1,
        title: 'STRUCTURE_BETA',
        color: '#ff00ff',
        bg: 'linear-gradient(45deg, #1a001a 0%, #000000 100%)',
        art: (
            <div style={{ width: '100%', height: '100%', position: 'relative', display: 'grid', placeItems: 'center' }}>
                <div style={{ width: 100, height: 100, border: '4px solid #ff00ff', transform: 'rotate(45deg)', boxShadow: '0 0 20px #ff00ff' }}></div>
                <div style={{ width: 60, height: 60, background: '#ff00ff', transform: 'rotate(45deg)', opacity: 0.5 }}></div>
            </div>
        )
    },
    {
        id: 2,
        title: 'CORE_GAMMA',
        color: '#ffff00',
        bg: 'radial-gradient(circle at center, #333300 0%, #000000 100%)',
        art: (
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} style={{
                        position: 'absolute',
                        left: '50%', top: '50%',
                        width: `${(i + 1) * 20}%`,
                        height: '2px',
                        background: '#ffff00',
                        transform: `translate(-50%, -50%) rotate(${i * 36}deg)`,
                        boxShadow: '0 0 10px #ffff00'
                    }} />
                ))}
                <div style={{ position: 'absolute', inset: 20, border: '2px solid #ffff00', borderRadius: 8 }}></div>
            </div>
        )
    }
]

export default function EasterEggOverlay() {
    const [fragment, setFragment] = useState<number | null>(null)
    const [systemOverload, setSystemOverload] = useState(false)

    useEffect(() => {
        const onFragment = (e: any) => {
            setFragment(e.detail.typeId)
            setTimeout(() => setFragment(null), 3000)
        }
        const on999 = () => setSystemOverload(true)

        window.addEventListener('show-data-fragment', onFragment)
        window.addEventListener('trigger-999', on999)
        return () => {
            window.removeEventListener('show-data-fragment', onFragment)
            window.removeEventListener('trigger-999', on999)
        }
    }, [])

    return (
        <>
            <AnimatePresence>
                {fragment !== null && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0, y: 100 }}
                        transition={{ type: 'spring', damping: 15 }}
                        style={{
                            position: 'fixed',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: 300,
                            height: 400,
                            background: '#000',
                            border: `2px solid ${FRAGMENTS[fragment].color}`,
                            zIndex: 100000,
                            borderRadius: 16,
                            boxShadow: `0 0 50px ${FRAGMENTS[fragment].color}40`,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        {/* Header */}
                        <div style={{ padding: 16, background: FRAGMENTS[fragment].color, color: '#000', fontWeight: 'bold', fontFamily: 'monospace' }}>
                            DATA FRAGMENT RECOVERED
                        </div>

                        {/* Art */}
                        <div style={{ flex: 1, background: FRAGMENTS[fragment].bg, position: 'relative' }}>
                            {FRAGMENTS[fragment].art}
                        </div>

                        {/* Footer */}
                        <div style={{ padding: 12, borderTop: `1px solid ${FRAGMENTS[fragment].color}40`, color: FRAGMENTS[fragment].color, fontFamily: 'monospace', fontSize: 12 }}>
                            ID: {FRAGMENTS[fragment].title}
                        </div>
                    </motion.div>
                )}

                {systemOverload && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(255, 215, 0, 0.1)',
                            zIndex: 99999,
                            pointerEvents: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column'
                        }}
                    >
                        <motion.h1
                            initial={{ scale: 0.5, letterSpacing: '0em' }}
                            animate={{ scale: 1.5, letterSpacing: '0.5em' }}
                            transition={{ duration: 1, ease: 'backOut' }}
                            style={{
                                color: '#FFD700',
                                fontSize: '4rem',
                                fontWeight: '900',
                                fontFamily: 'monospace',
                                textShadow: '0 0 30px #FFD700',
                                textAlign: 'center'
                            }}
                        >
                            SYSTEM<br />OVERLOAD
                        </motion.h1>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1 }}
                            style={{
                                marginTop: 20,
                                padding: '16px 32px',
                                border: '2px solid #FFD700',
                                background: 'rgba(0,0,0,0.8)',
                                color: '#FFD700',
                                fontFamily: 'monospace',
                                fontSize: '1.2rem',
                                pointerEvents: 'auto',
                                cursor: 'pointer'
                            }}
                            onClick={() => window.open('https://t.me/XXXENIA999', '_blank')}
                        >
                            ACCESS SECRET UPLINK [@XXXENIA999]
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes pulse { 50% { opacity: 1; } }
      `}</style>
        </>
    )
}
