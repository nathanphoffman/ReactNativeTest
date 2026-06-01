import { Platform, Text, TextProps } from "react-native";

export interface H5Props extends TextProps {
  className?: string;
}

export function H5({ children, className, style, ...props }: H5Props) {
  if (Platform.OS === "web") {
    return <h5 className={className} style={style as any}>{children}</h5>;
  }
  return (
    <Text role="heading" aria-level={5} style={style} {...props}>
      {children}
    </Text>
  );
}
