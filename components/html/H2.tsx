import { Platform, Text, TextProps } from "react-native";

export interface H2Props extends TextProps {
  className?: string;
}

export function H2({ children, className, style, ...props }: H2Props) {
  if (Platform.OS === "web") {
    return <h2 className={className} style={style as any}>{children}</h2>;
  }
  return (
    <Text role="heading" aria-level={2} style={style} {...props}>
      {children}
    </Text>
  );
}
