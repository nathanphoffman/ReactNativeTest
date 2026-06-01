import { Platform, TextInput, TextInputProps } from "react-native";

export interface TextareaProps extends Omit<TextInputProps, "onChange"> {
  className?: string;
  onChange?: (e: { target: { value: string } }) => void;
}

export function Textarea({ onChange, className, style, value, placeholder, ...props }: TextareaProps) {
  if (Platform.OS === "web") {
    // Real <textarea>: resize handle, form association, rows/cols work correctly
    return (
      <textarea
        value={value as string | undefined}
        placeholder={placeholder}
        onChange={onChange as any}
        className={className}
        style={style as any}
      />
    );
  }
  return (
    <TextInput
      multiline
      value={value}
      placeholder={placeholder}
      onChangeText={onChange ? (text) => onChange({ target: { value: text } }) : undefined}
      style={style}
      {...props}
    />
  );
}
