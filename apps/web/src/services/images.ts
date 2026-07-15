const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];

export function validateImageFile(file: File) {
  if (!allowedImageTypes.includes(file.type)) throw new Error("请选择 JPG、PNG 或 WebP 图片。");
  if (file.size > 8 * 1024 * 1024) throw new Error("原图不能超过 8MB。");
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("图片读取失败，请换一张再试。"));
    };
    image.src = url;
  });
}

function canvasBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("图片压缩失败。")), "image/webp", quality);
  });
}

export async function compressImageForUpload(file: File, maxSide = 1200) {
  validateImageFile(file);
  const image = await loadImage(file);
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("当前浏览器无法处理图片。");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  let blob = await canvasBlob(canvas, 0.82);
  if (blob.size > 1.5 * 1024 * 1024) blob = await canvasBlob(canvas, 0.68);
  if (blob.size > 1.5 * 1024 * 1024) blob = await canvasBlob(canvas, 0.55);
  if (blob.size > 1.5 * 1024 * 1024) throw new Error("压缩后图片仍超过 1.5MB，请换一张更小的图片。");
  return new File([blob], "showcase.webp", { type: "image/webp" });
}
