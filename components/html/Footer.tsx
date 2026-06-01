import { Platform, View, ViewProps } from "react-native";

export interface FooterProps extends ViewProps {
  className?: string;
}

export function Footer({ children, className, style, ...props }: FooterProps) {
  if (Platform.OS === "web") {
    return <footer className={className} style={style as any}>{children}</footer>;
  }
  return (
    <View role="contentinfo" style={style} {...props}>
      {children}
    </View>
  );
}
