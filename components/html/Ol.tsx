import { Platform, View, ViewProps } from "react-native";

export interface OlProps extends ViewProps {
  className?: string;
}

export function Ol({ children, className, style, ...props }: OlProps) {
  if (Platform.OS === "web") {
    return <ol className={className} style={style as any}>{children}</ol>;
  }
  return (
    <View role="list" style={style} {...props}>
      {children}
    </View>
  );
}
