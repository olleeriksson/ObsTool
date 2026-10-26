import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import DsoExtra from "./DsoExtra";
import { IDso } from "../types/Types";

const dso: IDso = {
    id: 1,
    catalog: "NGC",
    catalogNumber: "224",
    name: "NGC 224",
    commonName: "Andromeda Galaxy",
    otherCommonNames: "",
    type: "GALXY",
    con: "And",
    ra: "00 42.7",
    dec: "+41 16",
    mag: "3.4",
    sb: "",
    u2k: "",
    ti: "",
};

it("opens the constellation map dialog from the map link", () => {
    render(<DsoExtra dso={dso} />);

    fireEvent.click(screen.getByText("Constellation map"));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Constellation map (NGC 224)")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Constellation map" })).toBeInTheDocument();
});

// Detailed cards use the same standard casing as compact object rows.
it("formats uppercase constellation metadata", () => {
    render(<DsoExtra dso={{ ...dso, con: "UMA" }} />);
    expect(screen.getByText(/UMa/)).toBeInTheDocument();
});

// Expanding metadata must leave every resource link available in both states.
it("toggles compact object details while preserving resource links", () => {
    render(<DsoExtra dso={dso} compactOnMobile={true} />);

    const toggle = screen.getByLabelText("Show object details");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    expect(screen.getByLabelText("Hide object details")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Google image search")).toBeVisible();
    expect(screen.getByText("Aladin Lite")).toBeVisible();
    expect(screen.getByText("Constellation map")).toBeVisible();

    fireEvent.click(screen.getByLabelText("Hide object details"));
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(screen.getByText("Constellation map"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
});
