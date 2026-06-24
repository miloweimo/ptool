export function isValidDimension(value: number): boolean {
  return Number.isFinite(value) && value > 0 && Math.round(value) === value;
}

export function getResizedFileName(
  originalName: string,
  width: number,
  height: number,
): string {
  const dot = originalName.lastIndexOf(".");
  const base = dot >= 0 ? originalName.slice(0, dot) : originalName;
  const ext = dot >= 0 ? originalName.slice(dot) : ".png";
  return `${base}_${width}x${height}${ext}`;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("图片加载失败"));
    };
    image.src = url;
  });
}

export async function resizeImageFile(
  file: File,
  width: number,
  height: number,
): Promise<File> {
  if (!isValidDimension(width) || !isValidDimension(height)) {
    throw new Error("宽高必须是正整数");
  }

  const image = await loadImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("无法创建画布");
  }

  ctx.drawImage(image, 0, 0, width, height);

  const mimeType = file.type || "image/png";
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) =>
        result ? resolve(result) : reject(new Error("图片转换失败")),
      mimeType,
      0.92,
    );
  });

  return new File([blob], getResizedFileName(file.name, width, height), {
    type: mimeType,
    lastModified: Date.now(),
  });
}
