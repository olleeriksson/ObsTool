import * as React from "react";
import { render, screen } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import DsoCard from "./DsoCard";
import { IDso } from "../types/Types";

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

it("shows custom object label when dso name is 'custom'", () => {
    const customDso: IDso = { ...baseDso, name: "custom" };
    render(<DsoCard dso={customDso} customObjectName="My Star" />, { wrapper });
    expect(screen.getByText(/Custom object: My Star/)).toBeInTheDocument();
});
