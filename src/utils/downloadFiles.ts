import JSZip from "jszip";

export function getBatchDownloadName(fileCount: number): string {
  return `ptool_images_${fileCount}.zip`;
}

export function dedupeFileName(name: string, usedNames: Set<string>): string {
  if (!usedNames.has(name)) {
    usedNames.add(name);
    return name;
  }

  const dot = name.lastIndexOf(".");
  const base = dot >= 0 ? name.slice(0, dot) : name;
  const ext = dot >= 0 ? name.slice(dot) : "";
  let counter = 1;
  let candidate = `${base} (${counter})${ext}`;

  while (usedNames.has(candidate)) {
    counter += 1;
    candidate = `${base} (${counter})${ext}`;
  }

  usedNames.add(candidate);
  return candidate;
}

export function triggerBlobDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener";
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function downloadFiles(files: File[]): Promise<void> {
  if (!files.length) return;

  if (files.length === 1) {
    triggerBlobDownload(files[0], files[0].name);
    return;
  }

  const zip = new JSZip();
  const usedNames = new Set<string>();

  for (const file of files) {
    zip.file(dedupeFileName(file.name, usedNames), file);
  }

  const blob = await zip.generateAsync({ type: "blob" });
  triggerBlobDownload(blob, getBatchDownloadName(files.length));
}
