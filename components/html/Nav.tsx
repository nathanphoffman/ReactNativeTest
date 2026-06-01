import { View, ViewProps } from "react-native";

export interface NavProps extends ViewProps {
  className?: string;
}

export function Nav({ children, ...props }: NavProps) {
  return (
    <View role="navigation" {...props}>
      {children}
    </View>
  );
}
