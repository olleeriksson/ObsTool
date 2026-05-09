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
