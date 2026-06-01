import { Platform, Text, TextProps } from "react-native";

export interface H6Props extends TextProps {
  className?: string;
}

export function H6({ children, className, style, ...props }: H6Props) {
  if (Platform.OS === "web") {
    return <h6 className={className} style={style as any}>{children}</h6>;
  }
  return (
    <Text role="heading" aria-level={6} style={style} {...props}>
      {children}
    </Text>
  );
}
