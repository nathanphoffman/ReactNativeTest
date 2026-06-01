import { Platform, View, ViewProps } from "react-native";

export interface ArticleProps extends ViewProps {
  className?: string;
}

export function Article({ children, className, style, ...props }: ArticleProps) {
  if (Platform.OS === "web") {
    return <article className={className} style={style as any}>{children}</article>;
  }
  return (
    <View role="article" style={style} {...props}>
      {children}
    </View>
  );
}
