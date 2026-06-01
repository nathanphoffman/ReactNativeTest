import { Text, TextProps } from "react-native";

export interface PProps extends TextProps {
  className?: string;
}

export function P({ children, ...props }: PProps) {
  return <Text {...props}>{children}</Text>;
}
