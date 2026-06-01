import { Pressable, View, ViewProps } from "react-native";

export interface DivProps extends ViewProps {
  className?: string;
  onClick?: (e?: any) => void;
}

export function Div({ children, onClick, ...props }: DivProps) {
  if (onClick) {
    return (
      <Pressable onPress={onClick as any} {...props}>
        {children}
      </Pressable>
    );
  }
  return <View {...props}>{children}</View>;
}
