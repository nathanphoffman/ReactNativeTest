import { Platform, Text, TextProps } from "react-native";

export interface H4Props extends TextProps {
  className?: string;
}

export function H4({ children, className, style, ...props }: H4Props) {
  if (Platform.OS === "web") {
    return <h4 className={className} style={style as any}>{children}</h4>;
  }
  return (
    <Text role="heading" aria-level={4} style={style} {...props}>
      {children}
    </Text>
  );
}
