import { TextInput, TextInputProps } from "react-native";

export interface InputProps extends TextInputProps {
  className?: string;
  onChange?: (e: { target: { value: string } }) => void;
}

export function Input({ onChange, ...props }: InputProps) {
  return (
    <TextInput
      accessibilityRole="none"
      onChangeText={onChange ? (text) => onChange({ target: { value: text } }) : undefined}
      {...props}
    />
  );
}
