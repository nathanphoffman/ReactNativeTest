import { Text, TextProps } from "react-native";

export interface H2Props extends TextProps {
  className?: string;
}

export function H2({ children, ...props }: H2Props) {
  return (
    <Text role="heading" aria-level={2} {...props}>
      {children}
    </Text>
  );
}
