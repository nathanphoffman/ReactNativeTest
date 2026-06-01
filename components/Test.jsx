import React from 'react'
import { Div, H1, P } from './html'

var Hello = function () {
	return 'Hello';
};
var f = true;
var Test = function (props) {
	return (
<Div className="flex-1 bg-gray-950 items-center justify-center px-6">
            <H1 className="text-white text-2xl font-bold tracking-tight">
                Hello 2 from Python 112212! {(f ? Hello () : '')}
            </H1>
            <P className="text-indigo-400 text-sm mt-2">
                Built via .pyx → Transcrypt → JSX reinsertion
            </P>
        </Div>
);
};

export default Test
