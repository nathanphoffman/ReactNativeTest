import { Image, ImageProps, Platform } from "react-native";

export interface ImgProps extends Omit<ImageProps, "source"> {
  className?: string;
  src?: string;
  alt?: string;
  source?: ImageProps["source"];
}

export function Img({ src, alt, source, className, style, ...props }: ImgProps) {
  if (Platform.OS === "web") {
    // Real <img>: alt="" correctly marks decorative images, src is a real attribute
    return (
      <img src={src} alt={alt ?? ""} className={className} style={style as any} />
    );
  }
  // source is destructured out of ...props so it can't overwrite the computed value below
  return (
    <Image
      source={src ? { uri: src } : source}
      accessible={!!alt}
      accessibilityLabel={alt}
      style={style}
      {...props}
    />
  );
}
