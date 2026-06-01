import { Pressable, PressableProps } from "react-native";

export interface ButtonProps extends PressableProps {
  className?: string;
}

export function Button({ children, ...props }: ButtonProps) {
  return (
    <Pressable role="button" {...props}>
      {children}
    </Pressable>
  );
}
