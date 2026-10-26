import * as React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, vi } from "vitest";
import DsoShort from "./DsoShort";
import DsoMapHover from "./DsoMapHover";
import { IDso } from "../types/Types";

// Test locator interactions without loading chart catalogs.
vi.mock("./ConstellationMap", () => ({
  default: () => <div role="img" aria-label="Constellation map" onClick={event => event.stopPropagation()} />,
}));
const dso = { id: 1, name: "M 31", type: "GALXY", con: "And", ra: "00 42.7", dec: "+41 16" } as IDso;

// Restore real time after hover checks.
afterEach(() => vi.useRealTimers());

// Match the report-list composition, including row-level click dismissal.
function renderObject() {
  const onNameClick = vi.fn();
  render(<DsoMapHover dso={dso}><DsoShort dso={dso} enableConstellationMap={true} onNameClick={onNameClick} /></DsoMapHover>);
  return { onNameClick, row: screen.getByText("M 31").closest(".dsoShort")!.parentElement! };
}

it("replaces the hover preview with a persistent dialog when the abbreviation is clicked", async () => {
  vi.useFakeTimers();
  const { row, onNameClick } = renderObject();
  vi.spyOn(row, "getBoundingClientRect").mockReturnValue({
    x: 20, y: 20, top: 20, left: 20, right: 110, bottom: 60, width: 90, height: 40,
    toJSON: () => ({}),
  });
  fireEvent.mouseEnter(row);
  act(() => vi.advanceTimersByTime(700));
  expect(screen.getByRole("tooltip")).toBeInTheDocument();
  vi.useRealTimers();
  fireEvent.click(screen.getByRole("button", { name: "Show constellation map for M 31" }));
  fireEvent.mouseLeave(row);
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  expect(screen.getByRole("dialog", { name: "Constellation map (M 31)" })).toBeInTheDocument();
  expect(onNameClick).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("img", { name: "Constellation map" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
});

it("opens from a touch tap and closes when the overlay title is tapped", async () => {
  renderObject();
  const user = userEvent.setup();
  await user.pointer([
    { keys: "[TouchA>]", target: screen.getByRole("button", { name: "Show constellation map for M 31" }) },
    { keys: "[/TouchA]" },
  ]);
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  fireEvent.click(screen.getByText("Constellation map (M 31)"));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
});

it("supports keyboard activation and keeps object-name selection separate", async () => {
  const { onNameClick } = renderObject();
  fireEvent.click(screen.getByRole("button", { name: "Show M 31 in observed objects" }));
  expect(onNameClick).toHaveBeenCalledOnce();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  const user = userEvent.setup();
  screen.getByRole("button", { name: "Show constellation map for M 31" }).focus();
  await user.keyboard("{Enter}");
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
});

it("keeps abbreviations as text without coordinates or without the opt-in", () => {
  const { unmount } = render(<DsoShort dso={{ ...dso, ra: undefined }} enableConstellationMap={true} />);
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
  unmount();
  render(<DsoShort dso={dso} />);
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
