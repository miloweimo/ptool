import { afterEach, describe, expect, it, vi } from "vitest";
import {
  dedupeFileName,
  downloadFiles,
  getBatchDownloadName,
  triggerBlobDownload,
} from "./downloadFiles";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getBatchDownloadName", () => {
  it("includes file count in zip name", () => {
    expect(getBatchDownloadName(3)).toBe("ptool_images_3.zip");
  });
});

describe("dedupeFileName", () => {
  it("returns original name when unused", () => {
    const used = new Set<string>();
    expect(dedupeFileName("a.png", used)).toBe("a.png");
    expect(used.has("a.png")).toBe(true);
  });

  it("appends suffix for duplicate names", () => {
    const used = new Set<string>(["a.png"]);
    expect(dedupeFileName("a.png", used)).toBe("a (1).png");
    expect(dedupeFileName("a.png", used)).toBe("a (2).png");
  });
});

describe("triggerBlobDownload", () => {
  it("creates a temporary download link", () => {
    const click = vi.fn();
    const anchor = document.createElement("a");
    anchor.click = click;

    vi.spyOn(document, "createElement").mockReturnValue(anchor);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    triggerBlobDownload(new Blob(["x"]), "test.png");

    expect(anchor.download).toBe("test.png");
    expect(anchor.href).toBe("blob:mock");
    expect(click).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock");
  });
});

describe("downloadFiles", () => {
  it("does nothing for empty list", async () => {
    const createElement = vi.spyOn(document, "createElement");
    await downloadFiles([]);
    expect(createElement).not.toHaveBeenCalled();
  });

  it("downloads a single file directly", async () => {
    const click = vi.fn();
    const anchor = document.createElement("a");
    anchor.click = click;

    vi.spyOn(document, "createElement").mockReturnValue(anchor);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:single");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    await downloadFiles([new File(["x"], "one.png", { type: "image/png" })]);

    expect(anchor.download).toBe("one.png");
    expect(click).toHaveBeenCalledOnce();
  });

  it("downloads multiple files as a zip", async () => {
    const click = vi.fn();
    const anchor = document.createElement("a");
    anchor.click = click;

    vi.spyOn(document, "createElement").mockReturnValue(anchor);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:zip");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    await downloadFiles([
      new File(["a"], "a.png", { type: "image/png" }),
      new File(["b"], "b.png", { type: "image/png" }),
    ]);

    expect(anchor.download).toBe("ptool_images_2.zip");
    expect(click).toHaveBeenCalledOnce();
  });
});
