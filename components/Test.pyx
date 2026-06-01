# !js-import: import React from 'react'
# !js-import: import { Div, H1, P } from './html'


def Hello():
    return "Hello"

f = False

@export_default
def Test(props):
    return <jsx>
        <Div className="flex-1 bg-gray-950 items-center justify-center px-6">
            <H1 className="text-white text-2xl font-bold tracking-tight">
                Hello from Python 112212! {Hello() if f else ""}
            </H1>
            <P className="text-indigo-400 text-sm mt-2">
                Built via .pyx → Transcrypt → JSX reinsertion
            </P>
        </Div>
    </jsx>

