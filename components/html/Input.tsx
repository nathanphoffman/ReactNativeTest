import { TextInput, TextInputProps } from "react-native";

export interface InputProps extends TextInputProps {
  className?: string;
}

export function Input(props: InputProps) {
  return <TextInput accessibilityRole="none" {...props} />;
}
