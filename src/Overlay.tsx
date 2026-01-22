import { Scroll } from '@react-three/drei'

const Section = (props: any) => {
    return (
        <section className={`h-screen w-screen flex flex-col justify-center p-10 ${props.right ? "items-end text-right" : "items-start text-left"}`}
            style={{
                opacity: props.opacity
            }}>
            <div className="w-1/2 flex items-center justify-center">
                <div className="max-w-md w-full">
                    <div className="bg-white/5 backdrop-blur-md rounded-lg p-8 border border-white/10 shadow-2xl">
                        {props.children}
                    </div>
                </div>
            </div>
        </section>
    )
}

export const Overlay = () => {
    return (
        <Scroll html>
            <div className="w-screen">
                <Section opacity={1}>
                    <h1 className="font-mono text-xs tracking-[0.5em] text-cyan-400 mb-4 uppercase">Identity</h1>
                    <h2 className="text-6xl font-thin tracking-tighter mb-4">
                        XENIA_
                        <span className="font-bold">999</span>
                    </h2>
                    <p className="text-gray-400 font-light leading-relaxed">
                        THE ARCHITECTURE OF TOMORROW.<br />
                        Digital Architect creating immersive void-scapes.
                    </p>
                </Section>

                <Section right opacity={1}>
                    <h1 className="font-mono text-xs tracking-[0.5em] text-purple-400 mb-4 uppercase">Growth & Data</h1>
                    <h2 className="text-5xl font-bold mb-2">500% <span className="text-xl font-thin">YoY</span></h2>
                    <p className="text-gray-400 font-light">
                        Scaling dynamic infrastructure across the neural web.
                        <br />React / Three.js / WebGL
                    </p>
                </Section>

                <Section opacity={1}>
                    <h1 className="font-mono text-xs tracking-[0.5em] text-green-400 mb-4 uppercase">Global Reach</h1>
                    <h2 className="text-5xl font-thin mb-4">
                        90+ <span className="font-bold">Countries</span>
                    </h2>
                    <p className="text-gray-400 font-light">
                        Connecting consciousness through digital pathways.
                    </p>
                </Section>

                <Section right opacity={1}>
                    <h1 className="font-mono text-xs tracking-[0.5em] text-pink-400 mb-4 uppercase">Collaboration</h1>
                    <h2 className="text-5xl font-thin mb-8">
                        Create the <br /><span className="font-bold italic">Impossible</span>
                    </h2>
                    <a href="https://invoice.easystaff.io/cust_log?freel_id=1f0b7f2f-e0fe-6ac4-963a-83690f805e19" target="_blank" rel="noopener noreferrer">
                        <button className="px-8 py-4 bg-white text-black font-bold tracking-widest hover:bg-cyan-400 hover:text-black transition-colors duration-300 uppercase text-sm">
                            Initialize Partnership
                        </button>
                    </a>
                </Section>
            </div>
        </Scroll>
    )
}
