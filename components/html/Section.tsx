import { View, ViewProps } from "react-native";

export interface SectionProps extends ViewProps {
  className?: string;
}

export function Section({ children, ...props }: SectionProps) {
  return (
    <View role="region" {...props}>
      {children}
    </View>
  );
}
