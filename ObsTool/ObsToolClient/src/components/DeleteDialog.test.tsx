import * as React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DeleteDialog from "./DeleteDialog";

describe("DeleteDialog", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-05-30T12:00:00Z"));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("requires a delayed second Delete click when configured for destructive confirmation", () => {
        const onHandleClose = vi.fn();

        render(
            <DeleteDialog
                isOpen={true}
                title="Delete session?"
                text="This action cannot be undone."
                finalWarningText="Please reconfirm this deletion."
                requireSecondDeleteClick={true}
                showWarningSign={true}
                onHandleClose={onHandleClose}
            />
        );

        fireEvent.click(screen.getByRole("button", { name: "Delete" }));

        expect(onHandleClose).not.toHaveBeenCalled();
        expect(screen.getByText("Please reconfirm this deletion.")).toBeVisible();
        expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
        expect(screen.getByTestId("WarningAmberIcon")).toHaveStyle({
            color: "#000",
            fontSize: "72px"
        });

        act(() => {
            vi.advanceTimersByTime(2000);
        });

        const secondDeleteButton = screen.getByRole("button", { name: "Delete" });
        expect(secondDeleteButton).toBeEnabled();

        fireEvent.click(secondDeleteButton);

        expect(onHandleClose).toHaveBeenCalledWith(true);
    });

    it("keeps the existing single-click confirmation behavior by default", () => {
        const onHandleClose = vi.fn();

        render(
            <DeleteDialog
                isOpen={true}
                title="Delete resource?"
                text="This action cannot be undone."
                onHandleClose={onHandleClose}
            />
        );

        fireEvent.click(screen.getByRole("button", { name: "Delete" }));

        expect(onHandleClose).toHaveBeenCalledWith(true);
    });
});
