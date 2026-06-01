import { Platform, Text, TextProps } from "react-native";

export interface StrongProps extends TextProps {
  className?: string;
}

export function Strong({ children, className, style, ...props }: StrongProps) {
  if (Platform.OS === "web") {
    return <strong className={className} style={style as any}>{children}</strong>;
  }
  // style pulled out so it isn't applied twice via {...props}
  return (
    <Text style={[{ fontWeight: "bold" }, style as any]} {...props}>
      {children}
    </Text>
  );
}
