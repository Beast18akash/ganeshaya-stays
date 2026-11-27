const CLOUDINARY_UPLOAD_SEGMENT = "/upload/";

const hasCloudinaryTransformation = (pathname) => {
  const uploadIndex = pathname.indexOf(CLOUDINARY_UPLOAD_SEGMENT);
  if (uploadIndex === -1) return false;

  const firstSegment = pathname
    .slice(uploadIndex + CLOUDINARY_UPLOAD_SEGMENT.length)
    .split("/")[0];

  return firstSegment.split(",").some((part) => (
    /^(?:a|ar|b|bo|c|dpr|e|f|fl|g|h|o|q|r|so|t|vc|w|x|y|z)_/.test(part) ||
    /^(?:f_auto|q_auto|dpr_auto)$/.test(part)
  ));
};

const isCloudinaryImage = (url) => (
  typeof url === "string" &&
  url.includes("res.cloudinary.com") &&
  url.includes(CLOUDINARY_UPLOAD_SEGMENT)
);

export const optimizeCloudinaryUrl = (url, width = 800) => {
  if (typeof url !== "string" || !url.trim()) return url;

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname !== "res.cloudinary.com" || !isCloudinaryImage(url)) {
      return url;
    }

    if (hasCloudinaryTransformation(parsedUrl.pathname)) return url;

    const boundedWidth = Math.max(1, Math.round(Number(width) || 800));
    return url.replace(
      CLOUDINARY_UPLOAD_SEGMENT,
      `${CLOUDINARY_UPLOAD_SEGMENT}f_auto,q_auto,w_${boundedWidth},c_limit/`,
    );
  } catch {
    return url;
  }
};

export const getRoomImageUrl = (url, { width, height, crop = "fill" } = {}) => {
  if (!isCloudinaryImage(url)) return url;

  const transformations = ["f_auto", "q_auto:good", "dpr_auto"];

  if (width) transformations.push(`w_${Math.round(width)}`);
  if (height) transformations.push(`h_${Math.round(height)}`, `c_${crop}`);

  return url.replace(
    CLOUDINARY_UPLOAD_SEGMENT,
    `${CLOUDINARY_UPLOAD_SEGMENT}${transformations.join(",")}/`,
  );
};

export const getRoomImageSrcSet = (url, widths, options) => {
  if (!isCloudinaryImage(url)) return undefined;

  return widths
    .map((width) => `${getRoomImageUrl(url, { ...options, width })} ${width}w`)
    .join(", ");
};
