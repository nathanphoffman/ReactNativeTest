import { useState } from 'react'
import { Div, H1, P } from './html'

var Hello = function () {
	return 'Hello';
};
var f = true;
var Test = function (props) {
	var __left0__ = useState (0);
	var count = __left0__ [0];
	var setCount = __left0__ [1];
	return (
<Div className="flex-1 bg-gray-950 items-center justify-center px-6">
            <H1 className="text-white text-2xl font-bold tracking-tight">
               {count} Hello d2 from Pyth don 112212! {(f ? Hello () : '')}
            </H1>
            <P className="text-indigo-400 text-sm mt-2" onPress={(function __lambda__ () {
	return setCount (count + 1);
})}>
                Built via .pyx → Transcrypt → JSX reinsertion
            </P>
        </Div>
);
};

export default Test
