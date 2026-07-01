import {
  dedupeFileName,
  downloadFiles,
  getBatchDownloadName,
} from "./downloadFiles";
import { formatError } from "./formatError";

type SaveDialogFn = (options: {
  defaultPath: string;
  filters: { name: string; extensions: string[] }[];
}) => Promise<string | null>;

type WriteFileFn = (path: string, data: Uint8Array) => Promise<void>;

export type SaveFilesDeps = {
  isTauri: boolean;
  save?: SaveDialogFn;
  writeFile?: WriteFileFn;
};

function getExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot >= 0 ? fileName.slice(dot + 1).toLowerCase() : "png";
}

async function buildZipBlob(files: File[]): Promise<Blob> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const usedNames = new Set<string>();

  for (const file of files) {
    zip.file(dedupeFileName(file.name, usedNames), file);
  }

  return zip.generateAsync({ type: "blob" });
}

export async function saveFilesViaTauri(
  files: File[],
  deps: { save: SaveDialogFn; writeFile: WriteFileFn },
): Promise<void> {
  if (!files.length) return;

  const isBatch = files.length > 1;
  const defaultPath = isBatch
    ? getBatchDownloadName(files.length)
    : files[0].name;
  const filters = isBatch
    ? [{ name: "ZIP 压缩包", extensions: ["zip"] }]
    : [{ name: "图片", extensions: [getExtension(files[0].name)] }];

  let targetPath: string | null;
  try {
    targetPath = await deps.save({ defaultPath, filters });
  } catch (error) {
    throw new Error(`打开保存对话框失败: ${formatError(error)}`);
  }
  if (!targetPath) return;

  const blob = isBatch ? await buildZipBlob(files) : files[0];
  const bytes = new Uint8Array(await blob.arrayBuffer());
  try {
    await deps.writeFile(targetPath, bytes);
  } catch (error) {
    throw new Error(
      `写入文件失败 (${targetPath}): ${formatError(error)}`,
    );
  }
}

async function defaultTauriDeps(): Promise<{
  save: SaveDialogFn;
  writeFile: WriteFileFn;
}> {
  const { save } = await import("@tauri-apps/plugin-dialog");
  const { writeFile } = await import("@tauri-apps/plugin-fs");
  return { save, writeFile };
}

export async function saveFiles(
  files: File[],
  deps?: Partial<SaveFilesDeps>,
): Promise<void> {
  if (!files.length) return;

  const isTauri = deps?.isTauri ?? "__TAURI_INTERNALS__" in window;

  if (isTauri) {
    const { save, writeFile } =
      deps?.save && deps?.writeFile
        ? { save: deps.save, writeFile: deps.writeFile }
        : await defaultTauriDeps();

    await saveFilesViaTauri(files, { save, writeFile });
    return;
  }

  await downloadFiles(files);
}
