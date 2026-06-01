import React from 'react'
import { Div, H1, P } from './html'

var Hello = function () {
	return 'Hello';
};
export var f = false;
var Test = function (props) {
	return (
<Div className="flex-1 bg-gray-950 items-center justify-center px-6">
            <H1 className="text-white text-2xl font-bold tracking-tight">
                Hello from Python 112212! {Hello() if f else ""}
            </H1>
            <P className="text-indigo-400 text-sm mt-2">
                Built via .pyx → Transcrypt → JSX reinsertion
            </P>
        </Div>
);
};

export default Test
