import { Text, TextProps } from "react-native";

export interface H1Props extends TextProps {
  className?: string;
}

export function H1({ children, ...props }: H1Props) {
  return (
    <Text role="heading" aria-level={1} {...props}>
      {children}
    </Text>
  );
}
