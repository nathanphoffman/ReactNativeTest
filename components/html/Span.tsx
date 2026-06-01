import { Text, TextProps } from "react-native";

export interface SpanProps extends TextProps {
  className?: string;
}

export function Span({ children, ...props }: SpanProps) {
  return <Text {...props}>{children}</Text>;
}
