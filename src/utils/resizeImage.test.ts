import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getResizedFileName,
  isValidDimension,
  resizeImageFile,
} from "./resizeImage";

// 1x1 红色 PNG
const TINY_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function tinyPngFile(name = "photo.png"): File {
  const bytes = Uint8Array.from(atob(TINY_PNG_BASE64), (c) => c.charCodeAt(0));
  return new File([bytes], name, { type: "image/png" });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("isValidDimension", () => {
  it("accepts positive integers", () => {
    expect(isValidDimension(1)).toBe(true);
    expect(isValidDimension(100)).toBe(true);
  });

  it("rejects invalid values", () => {
    expect(isValidDimension(0)).toBe(false);
    expect(isValidDimension(-1)).toBe(false);
    expect(isValidDimension(1.5)).toBe(false);
    expect(isValidDimension(NaN)).toBe(false);
  });
});

describe("getResizedFileName", () => {
  it("inserts dimensions before extension", () => {
    expect(getResizedFileName("a.jpg", 200, 100)).toBe("a_200x100.jpg");
  });

  it("handles names without extension", () => {
    expect(getResizedFileName("photo", 50, 50)).toBe("photo_50x50.png");
  });
});

describe("resizeImageFile", () => {
  it("rejects invalid dimensions", async () => {
    await expect(resizeImageFile(tinyPngFile(), 0, 100)).rejects.toThrow(
      "宽高必须是正整数",
    );
  });

  it("returns a resized file with updated name", async () => {
    class MockImage {
      onload: (() => void) | null = null;
      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal("Image", MockImage);

    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D);

    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
      (callback) => {
        callback?.(new Blob(["resized"], { type: "image/png" }));
      },
    );

    const result = await resizeImageFile(tinyPngFile("cat.png"), 32, 24);

    expect(result.name).toBe("cat_32x24.png");
    expect(result.type).toBe("image/png");
    expect(result.size).toBeGreaterThan(0);
  });
});
