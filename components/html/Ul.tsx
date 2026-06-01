import { Platform, View, ViewProps } from "react-native";

export interface UlProps extends ViewProps {
  className?: string;
}

export function Ul({ children, className, style, ...props }: UlProps) {
  if (Platform.OS === "web") {
    return <ul className={className} style={style as any}>{children}</ul>;
  }
  return (
    <View role="list" style={style} {...props}>
      {children}
    </View>
  );
}
