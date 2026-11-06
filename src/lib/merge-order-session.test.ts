import { describe, expect, it } from "vitest";
import { mergeOrderSessionFields, type OrderSessionFields } from "./merge-order-session";

const running: OrderSessionFields = {
  updatedAt: "2026-11-06T10:00:00.000Z",
  gameType: "Single",
  sessionMinutes: 30,
  sessionPausedMs: 5000,
  sessionPausedAt: null,
  sessionPricing: { name: "Single", basePrice: 100, includedMinutes: 15, perMinuteRate: 8, isPerMinute: false },
};

describe("mergeOrderSessionFields", () => {
  it("ends the session when a newer order row has none (table removed elsewhere)", () => {
    const merged = mergeOrderSessionFields(running, {
      updatedAt: "2026-11-06T10:05:00.000Z",
      gameType: null,
      sessionMinutes: null,
      sessionPricing: null,
    });
    expect(merged.gameType).toBeNull();
    expect(merged.sessionMinutes).toBeNull();
    expect(merged.sessionPricing).toBeNull();
    expect(merged.sessionPausedMs).toBe(0);
  });

  it("keeps the session for a partial patch that does not carry gameType", () => {
    const merged = mergeOrderSessionFields(running, {
      updatedAt: "2026-11-06T10:05:00.000Z",
      sessionPausedAt: "2026-11-06T10:05:00.000Z",
    });
    expect(merged.gameType).toBe("Single");
    expect(merged.sessionMinutes).toBe(30);
  });

  it("ignores an older row without a session", () => {
    const merged = mergeOrderSessionFields(running, {
      updatedAt: "2026-11-06T09:00:00.000Z",
      gameType: null,
      sessionMinutes: null,
    });
    expect(merged.gameType).toBe("Single");
  });

  it("starts the session when a newer row carries one (table added elsewhere)", () => {
    const merged = mergeOrderSessionFields(
      { updatedAt: "2026-11-06T10:00:00.000Z", gameType: null, sessionMinutes: null },
      { ...running, updatedAt: "2026-11-06T10:05:00.000Z" },
    );
    expect(merged.gameType).toBe("Single");
    expect(merged.sessionMinutes).toBe(30);
    expect(merged.sessionPausedMs).toBe(5000);
  });
});
