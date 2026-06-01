import { Platform, View, ViewProps } from "react-native";

export interface HrProps extends ViewProps {
  className?: string;
}

export function Hr({ className, style, ...props }: HrProps) {
  if (Platform.OS === "web") {
    return <hr className={className} style={style as any} />;
  }
  return (
    <View
      role="separator"
      style={[{ height: 1, backgroundColor: "#ccc", width: "100%" }, style as any]}
      {...props}
    />
  );
}
