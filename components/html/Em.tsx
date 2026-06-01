import { Platform, Text, TextProps } from "react-native";

export interface EmProps extends TextProps {
  className?: string;
}

export function Em({ children, className, style, ...props }: EmProps) {
  if (Platform.OS === "web") {
    return <em className={className} style={style as any}>{children}</em>;
  }
  // style pulled out so it isn't applied twice via {...props}
  return (
    <Text style={[{ fontStyle: "italic" }, style as any]} {...props}>
      {children}
    </Text>
  );
}
