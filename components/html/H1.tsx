import { Platform, Text, TextProps } from "react-native";

export interface H1Props extends TextProps {
  className?: string;
}

export function H1({ children, className, style, ...props }: H1Props) {
  if (Platform.OS === "web") {
    return <h1 className={className} style={style as any}>{children}</h1>;
  }
  return (
    <Text role="heading" aria-level={1} style={style} {...props}>
      {children}
    </Text>
  );
}
