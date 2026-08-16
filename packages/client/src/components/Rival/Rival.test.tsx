import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Rival from "@/components/Rival/Rival";

function renderRival(props: {
  line?: string | null;
  muted?: boolean;
  thinking?: boolean;
  timeMs?: number;
  available?: boolean;
}) {
  return render(
    <Rival
      available={props.available ?? true}
      line={props.line ?? null}
      muted={props.muted ?? false}
      thinking={props.thinking ?? false}
      timeMs={props.timeMs ?? 0}
    />
  );
}

describe("Rival", () => {
  it("renders nothing when the rival is unavailable", () => {
    const { container } = renderRival({ available: false, line: "Hello" });

    expect(container.innerHTML).toEqual("");
  });

  it("renders nothing when muted", () => {
    const { container } = renderRival({ line: "Missed one.", muted: true });

    expect(container.innerHTML).toEqual("");
  });

  it("renders nothing when it has said nothing yet", () => {
    const { container } = renderRival({ line: null });

    expect(container.innerHTML).toEqual("");
  });

  it("shows a line in a bubble", () => {
    renderRival({ line: "Missed one." });

    expect(screen.getByText("Missed one.")).toBeDefined();
  });

  it("retires a line once enough engine time has passed", () => {
    const { rerender } = renderRival({ line: "Missed one.", timeMs: 1000 });

    expect(screen.getByText("Missed one.")).toBeDefined();

    rerender(
      <Rival
        available
        line="Missed one."
        muted={false}
        thinking={false}
        timeMs={10000}
      />
    );

    expect(screen.queryByText("Missed one.")).toBeNull();
  });

  it("holds the line while the clock is frozen, so pausing does not eat it", () => {
    const { rerender } = renderRival({ line: "Missed one.", timeMs: 1000 });

    rerender(
      <Rival
        available
        line="Missed one."
        muted={false}
        thinking={false}
        timeMs={1000}
      />
    );

    expect(screen.getByText("Missed one.")).toBeDefined();
  });
});
