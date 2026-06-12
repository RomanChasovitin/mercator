import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SequenceStrip } from "@/components/atlas/SequenceStrip";
import type { Story } from "@/lib/content/schema";

const story = {
  events: [
    { id: "a", order: 1 },
    { id: "b", order: 2 },
    { id: "c", order: 3 },
  ],
} as unknown as Story;

describe("SequenceStrip", () => {
  it("renders one chip per event", () => {
    render(<SequenceStrip story={story} activeEventId={null} onSelect={() => {}} />);
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });

  it("calls onSelect with the event id when a chip is clicked", async () => {
    const onSelect = vi.fn();
    render(<SequenceStrip story={story} activeEventId={null} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole("button", { name: "2" }));
    expect(onSelect).toHaveBeenCalledWith("b");
  });
});
