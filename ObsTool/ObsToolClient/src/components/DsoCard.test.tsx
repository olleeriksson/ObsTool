import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { vi } from "vitest";
import DsoCard from "./DsoCard";
import { IDso } from "../types/Types";
import Api from "../api/Api";

const theme = createTheme();

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

const baseDso: IDso = {
    id: 1,
    catalog: "NGC",
    name: "NGC 224",
    commonName: "Andromeda Galaxy",
    otherCommonNames: "",
    type: "Gx",
    con: "And",
    mag: "3.4",
    sb: "",
    u2k: "",
    ti: "",
};

afterEach(() => {
    vi.restoreAllMocks();
});

it("shows DSO content when dso prop is provided", () => {
    render(<DsoCard dso={baseDso} />, { wrapper });
    expect(screen.getByText(/NGC 224/)).toBeInTheDocument();
});

it("shows error state when no dso is provided", () => {
    render(<DsoCard />, { wrapper });
    expect(screen.getByText("Error!")).toBeInTheDocument();
});

it("shows error prop message", () => {
    render(<DsoCard error="DSO not found" />, { wrapper });
    expect(screen.getByText("DSO not found")).toBeInTheDocument();
});

it("shows user object names through the same card path", () => {
    const userDso: IDso = { ...baseDso, objectKind: "User", name: "My Star" };
    render(<DsoCard dso={userDso} />, { wrapper });
    expect(screen.getByText(/My Star/)).toBeInTheDocument();
});

it("shows no Herschel badge for non-Herschel DSOs", () => {
    render(<DsoCard dso={baseDso} />, { wrapper });

    expect(screen.queryByLabelText("Show Herschel details")).not.toBeInTheDocument();
});

it("can expand Herschel details when enabled", async () => {
    vi.spyOn(Api, "getHerschelDetails").mockResolvedValue({
        data: [{
            herschelId: 1,
            herschelNo: "H I-1",
            h400: true,
            herschelSummary: "William Herschel saw a bright nebula.",
            descrLong: "William Herschel saw a bright nebula.\nFull text."
        }]
    } as any);

    render(<DsoCard dso={{ ...baseDso, herschelObjects: [{ herschelId: 1, herschelNo: "H I-1", h400: true }] }} />, { wrapper });

    fireEvent.click(screen.getByLabelText("Show Herschel details"));

    await waitFor(() => expect(screen.getByText("William Herschel saw a bright nebula.")).toBeInTheDocument());
});

it("does not expand Herschel details when disabled", () => {
    const getHerschelDetails = vi.spyOn(Api, "getHerschelDetails");

    render(<DsoCard dso={{ ...baseDso, herschelObjects: [{ herschelId: 1, herschelNo: "H I-1", h400: true }] }} allowHerschelDetails={false} />, { wrapper });

    expect(screen.queryByLabelText("Show Herschel details")).not.toBeInTheDocument();
    expect(getHerschelDetails).not.toHaveBeenCalled();
});
