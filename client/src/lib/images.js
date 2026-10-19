const CLOUDINARY_UPLOAD_SEGMENT = "/upload/";

const isCloudinaryImage = (url) => (
  typeof url === "string" &&
  url.includes("res.cloudinary.com") &&
  url.includes(CLOUDINARY_UPLOAD_SEGMENT)
);

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
