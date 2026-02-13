import React from "react";

/**
 * Renders a PNG so its visible pixels take a single color.
 * Uses CSS mask: the image is the mask, the background is the color.
 * Best for single-color logos (e.g. white on transparent). Multi-color PNGs
 * will appear as one flat color.
 */
interface TintedImageProps {
  src: string;
  color: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
}

export default function TintedImage({
  src,
  color,
  alt = "",
  width,
  height,
  style = {},
  className,
}: TintedImageProps) {
  const wrapperStyles: React.CSSProperties = {
    position: "relative",
    display: "inline-block",
    width: width ?? "100%",
    height: height ?? undefined,
    ...style,
  };

  const maskStyles: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    backgroundColor: color,
    maskImage: `url(${src})`,
    maskSize: "contain",
    maskPosition: "center",
    maskRepeat: "no-repeat",
    WebkitMaskImage: `url(${src})`,
    WebkitMaskSize: "contain",
    WebkitMaskPosition: "center",
    WebkitMaskRepeat: "no-repeat",
  };

  return (
    <span
      role="img"
      aria-label={alt}
      className={className}
      style={wrapperStyles}
    >
      {/* Hidden img provides intrinsic dimensions for the mask */}
      <img
        src={src}
        alt=""
        aria-hidden
        style={{
          display: "block",
          width: width ?? "100%",
          height: height ?? "auto",
          opacity: 0,
          pointerEvents: "none",
        }}
      />
      <span style={maskStyles} />
    </span>
  );
}
