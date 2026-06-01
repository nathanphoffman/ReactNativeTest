import { useState } from "react";
import { Button, Div, H1, H2, Input, P, Section } from "../components/html";

export default function HomeScreen() {
  const [email, setEmail] = useState("");

  return (
    <Div className="flex-1 bg-gray-950 items-center justify-center px-6">
      <Section className="w-full max-w-sm gap-5">
        <Div className="gap-2">
          <H1 className="text-white text-4xl font-bold tracking-tight">
            Hello World 2
          </H1>
          <H2 className="text-indigo-400 text-lg font-medium">
            Expo Router + NativeWind v4
          </H2>
        </Div>

        <P className="text-gray-400 text-base leading-relaxed">
          A React Native starter with HTML-mirroring components, TypeScript, and
          utility-first styling baked in.
        </P>

        <Div className="gap-3">
          <Input
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-base placeholder:text-gray-500"
            placeholder="Enter your email"
            placeholderTextColor="#6b7280"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Button
            className="w-full bg-indigo-600 py-4 rounded-xl items-center active:opacity-80"
            onPress={() => console.log("Submitted:", email)}
          >
            <P className="text-white font-semibold text-base">Submit</P>
          </Button>
        </Div>
      </Section>
    </Div>
  );
}
