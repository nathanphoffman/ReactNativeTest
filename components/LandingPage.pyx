# !next: use client
# !js-import: import { useState } from 'react'

@export_default
def LandingPage(props):

    copied, setCopied = useState(False)

    return <jsx>
        <main className="flex-1 min-h-screen bg-gray-950">

            <header className="w-full border-b border-gray-800">
                <nav className="max-w-5xl mx-auto px-6 py-5 flex flex-row justify-between items-center">
                    <span className="text-indigo-400 font-bold text-xl tracking-tight">nathanhoffman.me</span>
                    <div className="flex flex-row gap-6">
                        <a href="#about" className="text-gray-400 text-sm font-medium">About</a>
                        <a href="#skills" className="text-gray-400 text-sm font-medium">Skills</a>
                        <a href="#contact" className="text-gray-400 text-sm font-medium">Contact</a>
                    </div>
                </nav>
            </header>

            <section className="max-w-5xl mx-auto px-6 pt-24 pb-20">
                <h1 className="text-white text-5xl font-bold tracking-tight">
                    Nate Hoffman
                </h1>
                <h2 className="text-indigo-400 text-xl font-medium mt-3">
                    Programmer by day, astronomer by night
                </h2>
                <p className="text-gray-400 text-base leading-relaxed mt-5 max-w-lg">
                    Building cross-platform apps with React Native and Next.js,
                    backed by Python. Clean code. Real products.
                </p>
                <button className="mt-8 bg-indigo-600 px-8 py-4 rounded-xl active:opacity-80"
                        onClick={lambda: setCopied(not copied)}>
                    <span className="text-white font-semibold text-base">
                        {"Copied!" if copied else "Get in touch"}
                    </span>
                </button>
            </section>

            <section className="max-w-5xl mx-auto px-6 py-16 border-t border-gray-800">
                <h2 className="text-white text-2xl font-bold mb-6">Skills</h2>
                <div className="flex flex-row flex-wrap gap-3">
                    <span className="bg-gray-800 text-indigo-300 px-4 py-2 rounded-full text-sm font-medium">React Native</span>
                    <span className="bg-gray-800 text-indigo-300 px-4 py-2 rounded-full text-sm font-medium">Next.js</span>
                    <span className="bg-gray-800 text-indigo-300 px-4 py-2 rounded-full text-sm font-medium">TypeScript</span>
                    <span className="bg-gray-800 text-indigo-300 px-4 py-2 rounded-full text-sm font-medium">Python</span>
                    <span className="bg-gray-800 text-indigo-300 px-4 py-2 rounded-full text-sm font-medium">Expo</span>
                    <span className="bg-gray-800 text-indigo-300 px-4 py-2 rounded-full text-sm font-medium">NativeWind</span>
                    <span className="bg-gray-800 text-indigo-300 px-4 py-2 rounded-full text-sm font-medium">Tailwind CSS</span>
                </div>
            </section>

            <section className="max-w-5xl mx-auto px-6 py-16 border-t border-gray-800">
                <h2 className="text-white text-2xl font-bold mb-3">Contact</h2>
                <p className="text-gray-400 text-base leading-relaxed mb-6">
                    Have a project in mind? Let us build something together.
                </p>
                <button className="bg-gray-800 border border-gray-700 px-6 py-3 rounded-xl active:opacity-80"
                        onClick={lambda: setCopied(not copied)}>
                    <span className="text-indigo-300 font-medium text-sm">
                        {"Email copied!" if copied else "natephiliphoffman@proton.me"}
                    </span>
                </button>
            </section>

            <footer className="w-full border-t border-gray-800 mt-8">
                <div className="max-w-5xl mx-auto px-6 py-8">
                    <p className="text-gray-600 text-sm text-center">
                        Built with React Native, Next.js, and Python.
                    </p>
                </div>
            </footer>

        </main>
    </jsx>
