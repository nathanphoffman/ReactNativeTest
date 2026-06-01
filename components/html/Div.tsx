import { View, ViewProps } from "react-native";

export interface DivProps extends ViewProps {
  className?: string;
}

export function Div({ children, ...props }: DivProps) {
  return <View {...props}>{children}</View>;
}
