import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { vi } from "vitest";
import ObsSessionForm from "./ObsSessionForm";
import { IDso, IObsSession } from "../types/Types";

const theme = createTheme();

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

const renderForm = (obsSession: IObsSession, errorMessage?: string) => {
  // Keep the default props minimal so each test focuses on the session data rendered by the form.
  return render(
    <ObsSessionForm
      obsSession={obsSession}
      locations={[]}
      instruments={[]}
      eyepieces={[]}
      onSaveObsSession={vi.fn()}
      onSelectObservedObject={vi.fn()}
      isLoading={false}
      allowEditing={true}
      errorMessage={errorMessage}
    />,
    { wrapper }
  );
};

const m31Dso: IDso = {
  id: 1,
  catalog: "M",
  catalogNumber: "31",
  name: "M 31",
  commonName: "Andromeda Galaxy",
  otherCommonNames: "",
  type: "GALXY",
  con: "And",
  mag: "3.4",
  sb: "",
  u2k: "",
  ti: "",
};

it("shows unmatched observations in the compact object list", () => {
  renderForm({
    id: 7,
    title: "Test session",
    date: "2026-05-25",
    reportText: "Odd fuzzy patch near Deneb. Needs catalog follow-up.",
    observations: [
      {
        id: 42,
        dsoObservations: [],
        text: "Odd fuzzy patch near Deneb. Needs catalog follow-up.",
        displayOrder: 0,
        nonDetection: false,
      },
    ],
  });

  expect(screen.queryByText("Unmatched:")).not.toBeInTheDocument();
  expect(screen.getByText("Odd fuzzy patch near Deneb")).toBeInTheDocument();
  expect(screen.queryByText("No objects")).not.toBeInTheDocument();
});

it("shows unmatched identifier tokens beside matched objects", async () => {
  renderForm({
    id: 7,
    title: "Test session",
    date: "2026-05-25",
    reportText: "M 31 and NGC 12345 in the same field.",
    observations: [
      {
        id: 43,
        identifier: "7-1-!NGC12345!",
        dsoObservations: [
          {
            id: 1,
            dso: m31Dso,
            obsSession: {} as IObsSession,
            displayOrder: 0,
            nonDetection: false,
          },
        ],
        text: "M 31 and NGC 12345 in the same field.",
        displayOrder: 0,
        nonDetection: false,
      },
    ],
  });

  expect(await screen.findByText("M 31")).toBeInTheDocument();
  expect(screen.queryByText("Unmatched:")).not.toBeInTheDocument();
  expect(screen.getByText("NGC12345")).toBeInTheDocument();
  expect(screen.queryByText("No objects")).not.toBeInTheDocument();
});

it("explains unmatched identifiers in the object tooltip", async () => {
  renderForm({
    id: 7,
    title: "Test session",
    date: "2026-05-25",
    reportText: "NGC 12345 in the same field.",
    observations: [
      {
        id: 44,
        identifier: "7-!NGC12345!",
        dsoObservations: [],
        text: "NGC 12345 in the same field.",
        displayOrder: 0,
        nonDetection: false,
      },
    ],
  });

  fireEvent.mouseOver(screen.getByText("NGC12345"));

  expect(await screen.findByText("NGC12345 did not match any known object.")).toBeInTheDocument();
});

it("shows save errors directly below the report text", () => {
  renderForm({
    id: 7,
    title: "Test session",
    date: "2026-05-25",
    reportText: "M 31 was bright.",
    observations: [],
  }, "Save aborted: observation has attached resources.");

  const reportText = screen.getByLabelText("Report Text");
  const alert = screen.getByRole("alert");

  expect(alert).toHaveTextContent("Save aborted: observation has attached resources.");
  expect(reportText.compareDocumentPosition(alert) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});
