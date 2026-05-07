import * as React from "react";
import { render, screen } from "@testing-library/react";
import DsoObjectsListView from "./DsoObjectsListView";

it("renders H400, formatted coordinates, and observed checkbox", () => {
    render(
        <DsoObjectsListView
            objects={[{
                herschelId: 1,
                herschelNo: "H I-1",
                h400: true,
                name: "NGC 1",
                catalog: "NGC",
                catalogNumber: "1",
                ra: "00 42.7",
                dec: "+41 16",
                isObserved: true,
            }]}
        />
    );

    expect(screen.getByText("H400")).toBeInTheDocument();
    expect(screen.getByText("Yes")).toBeInTheDocument();
    expect(screen.getByText("00h 42.7m")).toBeInTheDocument();
    expect(screen.getByText("+41\u00b0 16")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "NGC 1 observed" })).toBeChecked();
});
