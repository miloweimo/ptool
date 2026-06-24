import { afterEach, describe, expect, it, vi } from "vitest";
import { getBatchDownloadName } from "./downloadFiles";
import { saveFiles, saveFilesViaTauri } from "./saveFiles";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("saveFilesViaTauri", () => {
  it("writes a single file when user picks a path", async () => {
    const save = vi.fn().mockResolvedValue("/tmp/one.png");
    const writeFile = vi.fn().mockResolvedValue(undefined);
    const file = new File(["x"], "one.png", { type: "image/png" });

    await saveFilesViaTauri([file], { save, writeFile });

    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultPath: "one.png",
        filters: [{ name: "图片", extensions: ["png"] }],
      }),
    );
    expect(writeFile).toHaveBeenCalledWith(
      "/tmp/one.png",
      expect.any(Uint8Array),
    );
  });

  it("writes a zip when saving multiple files", async () => {
    const save = vi.fn().mockResolvedValue("/tmp/batch.zip");
    const writeFile = vi.fn().mockResolvedValue(undefined);

    await saveFilesViaTauri(
      [
        new File(["a"], "a.png", { type: "image/png" }),
        new File(["b"], "b.png", { type: "image/png" }),
      ],
      { save, writeFile },
    );

    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultPath: getBatchDownloadName(2),
        filters: [{ name: "ZIP 压缩包", extensions: ["zip"] }],
      }),
    );
    expect(writeFile).toHaveBeenCalledWith(
      "/tmp/batch.zip",
      expect.any(Uint8Array),
    );
  });

  it("does nothing when user cancels the dialog", async () => {
    const save = vi.fn().mockResolvedValue(null);
    const writeFile = vi.fn();

    await saveFilesViaTauri(
      [new File(["x"], "one.png", { type: "image/png" })],
      { save, writeFile },
    );

    expect(writeFile).not.toHaveBeenCalled();
  });
});

describe("saveFiles", () => {
  it("uses browser download outside Tauri", async () => {
    const click = vi.fn();
    const anchor = document.createElement("a");
    anchor.click = click;

    vi.spyOn(document, "createElement").mockReturnValue(anchor);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:single");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    await saveFiles(
      [new File(["x"], "one.png", { type: "image/png" })],
      { isTauri: false },
    );

    expect(anchor.download).toBe("one.png");
    expect(click).toHaveBeenCalledOnce();
  });

  it("uses native dialog inside Tauri", async () => {
    const save = vi.fn().mockResolvedValue("/tmp/one.png");
    const writeFile = vi.fn().mockResolvedValue(undefined);

    await saveFiles(
      [new File(["x"], "one.png", { type: "image/png" })],
      { isTauri: true, save, writeFile },
    );

    expect(save).toHaveBeenCalledOnce();
    expect(writeFile).toHaveBeenCalledOnce();
  });
});
