import { describe, expect, it } from "vitest";
import { formatError } from "./formatError";

describe("formatError", () => {
  it("reads Error message", () => {
    expect(formatError(new Error("写入失败"))).toBe("写入失败");
  });

  it("reads string errors", () => {
    expect(formatError("permission denied")).toBe("permission denied");
  });

  it("reads object message field", () => {
    expect(formatError({ message: "fs error" })).toBe("fs error");
  });
});
