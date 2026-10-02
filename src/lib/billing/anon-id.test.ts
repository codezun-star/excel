import { describe, expect, it } from "vitest";

import { newAnonId, signAnonId, verifyAnonCookie } from "./anon-id";

describe("cookie anónima firmada", () => {
  it("verifica su propia firma y rechaza alteraciones", () => {
    const id = newAnonId();
    const cookie = signAnonId(id, "secreto");
    expect(verifyAnonCookie(cookie, "secreto")).toBe(id);
    expect(verifyAnonCookie(cookie, "otro-secreto")).toBeNull();
    expect(verifyAnonCookie(`${newAnonId()}.${cookie.split(".")[1]}`, "secreto")).toBeNull();
    expect(verifyAnonCookie("basura", "secreto")).toBeNull();
    expect(verifyAnonCookie(undefined, "secreto")).toBeNull();
  });
});
