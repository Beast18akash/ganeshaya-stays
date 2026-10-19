import { useDesktopMedia } from "../hooks/useDesktopMedia";

const AuthVisual = ({ alt, image, imageSet, width, height, children }) => {
  const isDesktop = useDesktopMedia();

  if (!isDesktop) return null;

  return (
    <section className="relative min-h-screen overflow-hidden">
      <picture>
        <source type="image/webp" srcSet={imageSet} sizes="(min-width: 1280px) 51vw, 50vw" />
        <img
          src={image}
          alt={alt}
          width={width}
          height={height}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </picture>
      <div className="absolute inset-0 bg-linear-to-t from-[#06141f]/95 via-[#0b263b]/20 to-[#06141f]/15" />
      {children}
    </section>
  );
};

export default AuthVisual;
