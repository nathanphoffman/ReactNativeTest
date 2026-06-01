import { useState } from 'react'

var Hello = function () {
	return 'Hello';
};
var f = true;
var Test = function (props) {
	var __left0__ = useState (0);
	var count = __left0__ [0];
	var setCount = __left0__ [1];
	return (
<div className="flex-1 bg-gray-950 items-center justify-center px-6">
            <h1 className="text-white text-2xl font-bold tracking-tight">
               {count} Hello d2 from Pyth don 112212! {(f ? Hello () : '')}
            </h1>
            <p className="text-indigo-400 text-sm mt-2" onPress={(function __lambda__ () {
	return setCount (count + 1);
})}>
                Built via .pyx → Transcrypt → JSX reinsertion
            </p>
        </div>
);
};

export default Test
