import { Platform, Pressable, PressableProps } from "react-native";
import { ReactNode } from "react";

export interface ButtonProps extends PressableProps {
  className?: string;
  onClick?: (e?: any) => void;
  type?: "button" | "submit" | "reset";
  children?: ReactNode;
}

export function Button({ children, className, style, onClick, type = "button", ...props }: ButtonProps) {
  if (Platform.OS === "web") {
    // Real <button>: keyboard accessible, form submit/reset, focus ring out of the box
    return (
      <button type={type} onClick={onClick} className={className} style={style as any}>
        {children}
      </button>
    );
  }
  return (
    <Pressable role="button" onPress={onClick as any} style={style} {...props}>
      {children}
    </Pressable>
  );
}
