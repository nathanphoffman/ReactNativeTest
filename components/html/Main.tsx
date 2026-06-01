import { Platform, View, ViewProps } from "react-native";

export interface MainProps extends ViewProps {
  className?: string;
}

export function Main({ children, className, style, ...props }: MainProps) {
  if (Platform.OS === "web") {
    return <main className={className} style={style as any}>{children}</main>;
  }
  return (
    <View role="main" style={style} {...props}>
      {children}
    </View>
  );
}
