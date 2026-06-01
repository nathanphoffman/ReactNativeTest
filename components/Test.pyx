# !js-import: import React from 'react'
# !js-import: import { View, Text } from 'react-native'


def Test(props):
    return <jsx>
        <View style={{ flex: 1, backgroundColor: '#030712', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#ffffff', fontSize: 24, fontWeight: 'bold' }}>
                Hello from Python 2232352!
            </Text>
            <Text style={{ color: '#818cf8', fontSize: 14, marginTop: 8 }}>
                Built via .pyx → Transcrypt → JSX reinsertion
            </Text>
        </View>
    </jsx>


# !js-export: export default Test
