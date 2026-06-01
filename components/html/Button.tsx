import { Pressable, PressableProps } from "react-native";

export interface ButtonProps extends PressableProps {
  className?: string;
  onClick?: (e?: any) => void;
}

export function Button({ children, onClick, ...props }: ButtonProps) {
  return (
    <Pressable role="button" onPress={onClick as any} {...props}>
      {children}
    </Pressable>
  );
}
