# !next: use client
# !js-import: import { useState } from 'react'
# !js-import: import TestReact from './TestReact'

def Hello():
    return "Hello"

f = True

@export_default
def Test(props):

    count, setCount = useState(0)

    return <jsx>
        <div className="flex-1 bg-gray-950 items-center justify-center px-6">
            <h1 className="text-white text-2xl font-bold tracking-tight">
               {count} Hello d2 from Pyth don 112212! {Hello() if f else ""}
            </h1>
    
            <p className="text-indigo-400 text-sm mt-2" onClick={lambda: setCount(count + 1)}>
                Built via .pyx → Transcrypt → JSX reinsertion   
            <TestReact></TestReact>
        
            </p>
            
        </div>
         
    </jsx>
