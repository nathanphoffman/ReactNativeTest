import type { ReactNode } from "react";
import { Linking, Platform, Pressable, PressableProps, Text } from "react-native";

export interface AProps extends Omit<PressableProps, "children"> {
  className?: string;
  href?: string;
  onClick?: (e?: any) => void;
  children?: ReactNode;
}

export function A({ children, href, onClick, className, style, ...props }: AProps) {
  if (Platform.OS === "web") {
    // Real <a> tag: href works natively (right-click, hover preview, crawlers)
    // onClick lets callers call e.preventDefault() to intercept navigation
    return (
      <a href={href} onClick={onClick} className={className} style={style as any}>
        {children}
      </a>
    );
  }
  const handlePress = onClick ?? (href ? () => Linking.openURL(href) : undefined);
  return (
    <Pressable role="link" onPress={handlePress as any} style={style} {...props}>
      <Text>{children}</Text>
    </Pressable>
  );
}
