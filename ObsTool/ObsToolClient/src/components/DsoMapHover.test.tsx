import * as React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import DsoMapHover from "./DsoMapHover";
import { IDso } from "../types/Types";

// Keep timing tests focused on the preview lifecycle rather than SVG rendering.
vi.mock("./ConstellationMap", () => ({
  default: ({ highlightedObjects }: { highlightedObjects: Array<{ name: string }> }) => (
    <div role="img" aria-label="Constellation map">{highlightedObjects[0].name}</div>
  ),
}));

const dso = { id: 1, name: "M 31", con: "And", ra: "00 42.7", dec: "+41 16" } as IDso;

// Restore real time after each test so preview timers cannot affect other suites.
afterEach(() => vi.useRealTimers());

// Mount a measurable anchor so Popper can position the preview in jsdom.
function renderHover(object: IDso = dso) {
  const result = render(<DsoMapHover dso={object}><button>Object row</button></DsoMapHover>);
  const row = screen.getByRole("button").parentElement!;
  vi.spyOn(row, "getBoundingClientRect").mockReturnValue({
    x: 20, y: 20, top: 20, left: 20, right: 110, bottom: 60, width: 90, height: 40,
    toJSON: () => ({}),
  });
  return { ...result, row };
}

it("opens at 700 milliseconds to the right and closes immediately on leave", () => {
  vi.useFakeTimers();
  const { row } = renderHover();
  fireEvent.mouseEnter(row);
  act(() => vi.advanceTimersByTime(699));
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  act(() => vi.advanceTimersByTime(1));
  const tooltip = screen.getByRole("tooltip");
  expect(tooltip).toHaveTextContent("Constellation map (M 31)");
  expect(tooltip).toHaveAttribute("data-popper-placement", "right-start");
  expect(screen.getByRole("img", { name: "Constellation map" })).toHaveTextContent("M 31");
  fireEvent.mouseLeave(row);
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
});

it("cancels brief hovers and requires the full delay again on re-entry", () => {
  vi.useFakeTimers();
  const { row, unmount } = renderHover();
  fireEvent.mouseEnter(row);
  act(() => vi.advanceTimersByTime(400));
  fireEvent.mouseLeave(row);
  act(() => vi.advanceTimersByTime(700));
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  fireEvent.mouseEnter(row);
  act(() => vi.advanceTimersByTime(699));
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});

it("does not preview objects without coordinates", () => {
  vi.useFakeTimers();
  const { row } = renderHover({ ...dso, ra: undefined });
  fireEvent.mouseEnter(row);
  act(() => vi.advanceTimersByTime(700));
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
});

it("preserves object clicks while dismissing the map", () => {
  vi.useFakeTimers();
  const onClick = vi.fn();
  render(<DsoMapHover dso={dso}><button onClick={onClick}>Object row</button></DsoMapHover>);
  const button = screen.getByRole("button");
  fireEvent.mouseEnter(button.parentElement!);
  act(() => vi.advanceTimersByTime(700));
  fireEvent.click(button);
  expect(onClick).toHaveBeenCalledOnce();
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
});
