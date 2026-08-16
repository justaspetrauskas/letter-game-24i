import { describe, expect, it, vi } from "vitest";
import { emptySnapshot } from "@letter-game/protocol";
import type { RivalSnapshot } from "@letter-game/protocol";
import {
  CommentaryError,
  buildRivalPrompt,
  createCommentaryService,
} from "@/ai/commentary/commentary";

function snapshotWith(overrides: Partial<RivalSnapshot>): RivalSnapshot {
  return { ...emptySnapshot(), ...overrides };
}

describe("availability", () => {
  it("is unavailable without a key or completion", () => {
    expect(createCommentaryService().available).toBe(false);
  });

  it("refuses to comment when unavailable", async () => {
    await expect(
      createCommentaryService().comment(emptySnapshot(), [])
    ).rejects.toBeInstanceOf(CommentaryError);
  });
});

describe("comment", () => {
  it("returns a cleaned line", async () => {
    const service = createCommentaryService({
      complete: async () => '  "Three E\'s.   Really?"  ',
    });

    expect(await service.comment(emptySnapshot(), [])).toEqual(
      "Three E's. Really?"
    );
  });

  it("rejects an empty line", async () => {
    const service = createCommentaryService({ complete: async () => '  ""  ' });

    await expect(
      service.comment(emptySnapshot(), [])
    ).rejects.toBeInstanceOf(CommentaryError);
  });

  it("passes the snapshot and history through", async () => {
    const complete = vi.fn(async () => "line");
    const service = createCommentaryService({ complete });
    const snapshot = snapshotWith({ misses: 3 });

    await service.comment(snapshot, ["earlier"]);

    expect(complete).toHaveBeenCalledWith(snapshot, ["earlier"]);
  });
});

describe("buildRivalPrompt", () => {
  it("includes the snapshot", () => {
    const prompt = buildRivalPrompt(snapshotWith({ missedWithTwin: 2 }), []);

    expect(prompt).toContain('"missedWithTwin":2');
  });

  it("lists lines already used", () => {
    const prompt = buildRivalPrompt(emptySnapshot(), ["first", "second"]);

    expect(prompt).toContain("already used");
    expect(prompt).toContain("- first");
    expect(prompt).toContain("- second");
  });

  it("omits the history section when there is none", () => {
    expect(buildRivalPrompt(emptySnapshot(), [])).not.toContain("already used");
  });

  it("keeps only the most recent lines", () => {
    const prompt = buildRivalPrompt(
      emptySnapshot(),
      Array.from({ length: 12 }, (_, index) => `line${index}`)
    );

    expect(prompt).not.toContain("line0");
    expect(prompt).toContain("line11");
  });
});
