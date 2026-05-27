import * as React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { vi } from "vitest";
import Api from "../api/Api";
import { IDataState, IDso, IObjectList } from "../types/Types";
import { StyledObjectsView } from "./ObjectsView";
import { MemoryRouter } from "react-router-dom";

const theme = createTheme();

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter>
        <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </MemoryRouter>
);

const loggedInStore = { isLoggedIn: true, isSuperAdmin: false } as IDataState;

const emptyObjectList: IObjectList = {
    userObjects: [],
    otherObjects: [],
    constellations: [],
    canCreateOtherObjects: false,
};

const ghostOfJupiter: IDso = {
    id: 3242,
    catalog: "NGC",
    catalogNumber: "3242",
    name: "NGC 3242",
    commonName: "Ghost of Jupiter Nebula",
    type: "PLNNB",
    con: "HYA",
};

const ngc102: IDso = {
    id: 102,
    catalog: "NGC",
    catalogNumber: "102",
    name: "NGC 102",
    type: "GALXY",
    con: "CAS",
};

afterEach(() => {
    vi.restoreAllMocks();
});

// Renders the connected-page body without Redux so these tests stay focused on ObjectsView form behavior.
const renderObjectsView = (objectList: IObjectList = emptyObjectList, searchResults: IDso[] = []) => {
    vi.spyOn(Api, "getObjects").mockResolvedValue({ data: objectList } as any);
    const searchDso = vi.spyOn(Api, "searchDso").mockResolvedValue({
        data: { data: searchResults, total: searchResults.length, count: searchResults.length, more: 0 },
    } as any);
    return { searchDso, ...render(<StyledObjectsView store={loggedInStore} />, { wrapper }) };
};

it("flags duplicate user object names immediately and disables save", async () => {
    renderObjectsView({
        userObjects: [{ id: 7, name: "Jupiter", objectKind: "User", canDelete: true }],
        otherObjects: [],
    });

    fireEvent.change(await screen.findByRole("textbox", { name: /^Name/ }), { target: { value: " jupiter " } });

    expect(screen.getByText("A user object named 'Jupiter' already exists.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
});

it("flags existing other object names before saving user objects", async () => {
    renderObjectsView({
        userObjects: [],
        otherObjects: [{ id: 8, name: "Mars", objectKind: "Other" }],
    });

    fireEvent.change(await screen.findByRole("textbox", { name: /^Name/ }), { target: { value: " mars " } });

    expect(screen.getByText("An other object named 'Mars' already exists.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
});

it("shows backend validation messages instead of rendering object-shaped errors", async () => {
    vi.spyOn(Api, "addUserObject").mockRejectedValue({
        response: {
            data: {
                Message: "A user object named 'Race Object' already exists.",
            },
        },
    });
    renderObjectsView();

    fireEvent.change(await screen.findByRole("textbox", { name: /^Name/ }), { target: { value: "Race Object" } });
    await waitFor(() => expect(screen.getByRole("button", { name: "Save" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("A user object named 'Race Object' already exists.")).toBeInTheDocument();
});

it("keeps SAC lookup out of typing and allows names that only match SAC common-name text", async () => {
    const addUserObject = vi.spyOn(Api, "addUserObject").mockResolvedValue({
        data: { id: 20, name: "Jupiter", objectKind: "User" },
    } as any);
    const { searchDso } = renderObjectsView(emptyObjectList, [ghostOfJupiter]);

    fireEvent.change(await screen.findByRole("textbox", { name: /^Name/ }), { target: { value: "Jupiter" } });

    expect(searchDso).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(searchDso).toHaveBeenCalledWith("Jupiter", false));
    await waitFor(() => expect(addUserObject).toHaveBeenCalledWith(expect.objectContaining({
        name: "Jupiter",
    })));
    expect(screen.queryByText(/SAC object already exists/)).not.toBeInTheDocument();
});

it("blocks exact SAC object names from being saved as user objects", async () => {
    const addUserObject = vi.spyOn(Api, "addUserObject");
    const { searchDso } = renderObjectsView(emptyObjectList, [ngc102]);

    fireEvent.change(await screen.findByRole("textbox", { name: /^Name/ }), { target: { value: "NGC 102" } });
    expect(searchDso).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("SAC object already exists: NGC 102")).toBeInTheDocument();
    await waitFor(() => expect(searchDso).toHaveBeenCalledWith("NGC 102", false));
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    expect(addUserObject).not.toHaveBeenCalled();
});

it("blocks exact SAC object names from being saved as other objects", async () => {
    const addOtherObject = vi.spyOn(Api, "addOtherObject");
    const { searchDso } = renderObjectsView({ ...emptyObjectList, canCreateOtherObjects: true }, [ngc102]);

    fireEvent.change(await screen.findByRole("textbox", { name: /^Name/ }), { target: { value: "NGC 102" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "User defined object" }));
    expect(searchDso).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("SAC object already exists: NGC 102")).toBeInTheDocument();
    await waitFor(() => expect(searchDso).toHaveBeenCalledWith("NGC 102", false));
    expect(addOtherObject).not.toHaveBeenCalled();
});

it("saves custom free-text type values from the SAC type dropdown", async () => {
    const addUserObject = vi.spyOn(Api, "addUserObject").mockResolvedValue({
        data: { id: 11, name: "My Moving Target", type: "PLANET" },
    } as any);
    renderObjectsView();

    fireEvent.change(await screen.findByRole("textbox", { name: /^Name/ }), { target: { value: "My Moving Target" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Type" }), { target: { value: "PLANET" } });
    await waitFor(() => expect(screen.getByRole("button", { name: "Save" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(addUserObject).toHaveBeenCalledWith(expect.objectContaining({
        name: "My Moving Target",
        type: "PLANET",
    })));
});

it("offers previously saved custom object types in the Type dropdown", async () => {
    renderObjectsView({
        userObjects: [{ id: 4, name: "Ceres", type: "Dwarf planet", objectKind: "User" }],
        otherObjects: [{ id: 5, name: "Moon", type: "Satellite", objectKind: "Other" }],
    });

    const typeField = await screen.findByRole("combobox", { name: "Type" });
    fireEvent.mouseDown(typeField);

    const listbox = await screen.findByRole("listbox");
    expect(within(listbox).getByText("Dwarf planet")).toBeInTheDocument();
    expect(within(listbox).getByText("Satellite")).toBeInTheDocument();
});

it("lets privileged users save new objects into the readonly other object list", async () => {
    const addOtherObject = vi.spyOn(Api, "addOtherObject").mockResolvedValue({
        data: { id: 12, name: "Saturn", objectKind: "Other" },
    } as any);
    const addUserObject = vi.spyOn(Api, "addUserObject");
    renderObjectsView({ ...emptyObjectList, canCreateOtherObjects: true });

    fireEvent.change(await screen.findByRole("textbox", { name: /^Name/ }), { target: { value: "Saturn" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "User defined object" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Save" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(addOtherObject).toHaveBeenCalledWith(expect.objectContaining({
        name: "Saturn",
    })));
    expect(addUserObject).not.toHaveBeenCalled();
});

it("keeps the other object checkbox state after saving an other object", async () => {
    vi.spyOn(Api, "addOtherObject").mockResolvedValue({
        data: { id: 12, name: "Saturn", objectKind: "Other" },
    } as any);
    renderObjectsView({ ...emptyObjectList, canCreateOtherObjects: true });

    fireEvent.change(await screen.findByRole("textbox", { name: /^Name/ }), { target: { value: "Saturn" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "User defined object" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Save" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(screen.getByText("Add other object")).toBeInTheDocument());
    expect(screen.getByRole("checkbox", { name: "User defined object" })).not.toBeChecked();
});

it("lets privileged users edit other objects through the other object endpoint", async () => {
    const updateOtherObject = vi.spyOn(Api, "updateOtherObject").mockResolvedValue({
        data: { id: 12, name: "Saturn", objectKind: "Other", notes: "Updated notes" },
    } as any);
    const updateUserObject = vi.spyOn(Api, "updateUserObject");
    renderObjectsView({
        ...emptyObjectList,
        canCreateOtherObjects: true,
        otherObjects: [{ id: 12, name: "Saturn", objectKind: "Other", notes: "Old notes", canEdit: true }],
    });

    fireEvent.click(await screen.findByRole("button", { name: "Edit Saturn" }));
    expect(screen.getByText("Edit other object")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Notes" }), { target: { value: "Updated notes" } });
    fireEvent.click(screen.getByRole("button", { name: "Update" }));

    await waitFor(() => expect(updateOtherObject).toHaveBeenCalledWith(12, expect.objectContaining({
        name: "Saturn",
        notes: "Updated notes",
    })));
    expect(updateUserObject).not.toHaveBeenCalled();
});

it("renders each object reference date as a session link", async () => {
    renderObjectsView({
        userObjects: [{
            id: 7,
            name: "Mars",
            objectKind: "User",
            numReferences: 2,
            references: [
                { obsSessionId: 41, date: "2026-05-26" },
                { obsSessionId: 39, date: "2026-05-24" },
            ],
        }],
        otherObjects: [],
    });

    const latestLink = await screen.findByRole("link", { name: "2026-05-26" });
    const olderLink = screen.getByRole("link", { name: "2026-05-24" });
    expect(latestLink).toHaveAttribute("href", "/session/41");
    expect(olderLink).toHaveAttribute("href", "/session/39");
});

it("hides the Clear button until the form contains a name", async () => {
    renderObjectsView();

    const nameField = await screen.findByRole("textbox", { name: /^Name/ });
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();

    fireEvent.change(nameField, { target: { value: "Temporary Object" } });

    expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument();
});
