import { Platform, View, ViewProps } from "react-native";

export interface HeaderProps extends ViewProps {
  className?: string;
}

export function Header({ children, className, style, ...props }: HeaderProps) {
  if (Platform.OS === "web") {
    return <header className={className} style={style as any}>{children}</header>;
  }
  return (
    <View role="banner" style={style} {...props}>
      {children}
    </View>
  );
}
