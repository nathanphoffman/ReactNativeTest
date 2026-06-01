import { Platform, Text, TextProps } from "react-native";

export interface H3Props extends TextProps {
  className?: string;
}

export function H3({ children, className, style, ...props }: H3Props) {
  if (Platform.OS === "web") {
    return <h3 className={className} style={style as any}>{children}</h3>;
  }
  return (
    <Text role="heading" aria-level={3} style={style} {...props}>
      {children}
    </Text>
  );
}
