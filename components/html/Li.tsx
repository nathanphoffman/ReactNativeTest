import { Platform, Pressable, View, ViewProps } from "react-native";

export interface LiProps extends ViewProps {
  className?: string;
  onClick?: (e?: any) => void;
}

export function Li({ children, className, style, onClick, ...props }: LiProps) {
  if (Platform.OS === "web") {
    return (
      <li className={className} style={style as any} onClick={onClick}>
        {children}
      </li>
    );
  }
  if (onClick) {
    return (
      <Pressable role="listitem" onPress={onClick as any} style={style} {...props}>
        {children}
      </Pressable>
    );
  }
  return (
    <View role="listitem" style={style} {...props}>
      {children}
    </View>
  );
}
