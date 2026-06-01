import { Platform, Text, TextProps } from "react-native";

export interface SpanProps extends TextProps {
  className?: string;
}

export function Span({ children, className, style, ...props }: SpanProps) {
  if (Platform.OS === "web") {
    return <span className={className} style={style as any}>{children}</span>;
  }
  return <Text style={style} {...props}>{children}</Text>;
}
