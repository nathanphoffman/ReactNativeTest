import { Platform, Pressable, View, ViewProps } from "react-native";

export interface DivProps extends ViewProps {
  className?: string;
  onClick?: (e?: any) => void;
}

export function Div({ children, className, style, onClick, ...props }: DivProps) {
  if (Platform.OS === "web") {
    return (
      <div className={className} style={style as any} onClick={onClick}>
        {children}
      </div>
    );
  }
  if (onClick) {
    return (
      <Pressable onPress={onClick as any} style={style} {...props}>
        {children}
      </Pressable>
    );
  }
  return <View style={style} {...props}>{children}</View>;
}
