import { Platform, Text, TextProps } from "react-native";

export interface PProps extends TextProps {
  className?: string;
}

export function P({ children, className, style, ...props }: PProps) {
  if (Platform.OS === "web") {
    return <p className={className} style={style as any}>{children}</p>;
  }
  return <Text style={style} {...props}>{children}</Text>;
}
