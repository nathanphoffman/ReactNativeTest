import { Platform, View, ViewProps } from "react-native";

export interface FormProps extends ViewProps {
  className?: string;
  onSubmit?: (e?: any) => void;
}

export function Form({ children, className, style, onSubmit, ...props }: FormProps) {
  if (Platform.OS === "web") {
    // Real <form>: Enter-key submit, native validation, form association work correctly
    return (
      <form onSubmit={onSubmit} className={className} style={style as any}>
        {children}
      </form>
    );
  }
  // onSubmit has no native trigger on mobile — consumers must call it manually
  return (
    <View role="form" style={style} {...props}>
      {children}
    </View>
  );
}
