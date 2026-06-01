import { Platform, View, ViewProps } from "react-native";

export interface AsideProps extends ViewProps {
  className?: string;
}

export function Aside({ children, className, style, ...props }: AsideProps) {
  if (Platform.OS === "web") {
    return <aside className={className} style={style as any}>{children}</aside>;
  }
  return (
    <View role="complementary" style={style} {...props}>
      {children}
    </View>
  );
}
