import { Platform, View, ViewProps } from "react-native";

export interface NavProps extends ViewProps {
  className?: string;
}

export function Nav({ children, className, style, ...props }: NavProps) {
  if (Platform.OS === "web") {
    return <nav className={className} style={style as any}>{children}</nav>;
  }
  return (
    <View role="navigation" style={style} {...props}>
      {children}
    </View>
  );
}
