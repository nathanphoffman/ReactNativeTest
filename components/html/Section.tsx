import { Platform, View, ViewProps } from "react-native";

export interface SectionProps extends ViewProps {
  className?: string;
}

export function Section({ children, className, style, ...props }: SectionProps) {
  if (Platform.OS === "web") {
    return <section className={className} style={style as any}>{children}</section>;
  }
  return (
    <View role="region" style={style} {...props}>
      {children}
    </View>
  );
}
