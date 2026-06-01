import { Platform, Text, TextProps } from "react-native";

export interface LabelProps extends TextProps {
  className?: string;
  htmlFor?: string;
}

export function Label({ children, className, style, htmlFor, ...props }: LabelProps) {
  if (Platform.OS === "web") {
    // Real <label>: clicking it focuses the associated input via htmlFor
    return (
      <label htmlFor={htmlFor} className={className} style={style as any}>
        {children}
      </label>
    );
  }
  // htmlFor has no native equivalent — label is purely visual on mobile
  return <Text style={style} {...props}>{children}</Text>;
}
