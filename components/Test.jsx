import React from 'react'
import { View, Text } from 'react-native'

var Test = function (props) {
	return (
<View style={{ flex: 1, backgroundColor: '#030712', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#ffffff', fontSize: 24, fontWeight: 'bold' }}>
                Hello from Python 223352!
            </Text>
            <Text style={{ color: '#818cf8', fontSize: 14, marginTop: 8 }}>
                Built via .pyx → Transcrypt → JSX reinsertion
            </Text>
        </View>
);
};

export default Test
