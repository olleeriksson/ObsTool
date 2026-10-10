import * as React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { createStore } from "redux";
import { afterEach, expect, it, vi } from "vitest";
import type { AxiosResponse } from "axios";
import Api from "../api/Api";
import ImageList from "./ImageList";
import type { IObsResource } from "../types/Types";

// Lets the test deliver server responses in the opposite order to the requests.
function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason: Error) => void;
    const promise = new Promise<T>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return { promise, resolve, reject };
}

// Supplies the response payload consumed by the resource components.
function response<T>(data: T): AxiosResponse<T> {
    return { data } as AxiosResponse<T>;
}

// Restores API methods after each independently controlled request sequence.
afterEach(() => vi.restoreAllMocks());

// Reproduces closing during a pending save, then receiving the pre-save list last.
it.each([
    ["link", "success"],
    ["image", "success"],
    ["link", "failure"],
    ["image", "failure"],
])("keeps a newly saved %s when an older refresh finishes with %s", async (type, result) => {
    const save = deferred<AxiosResponse<IObsResource>>();
    const olderRefresh = deferred<AxiosResponse<IObsResource[]>>();
    const newerRefresh = deferred<AxiosResponse<IObsResource[]>>();
    vi.spyOn(Api, "addResource").mockReturnValue(save.promise);
    const getResources = vi.spyOn(Api, "getResources")
        .mockReturnValueOnce(olderRefresh.promise)
        .mockReturnValueOnce(newerRefresh.promise);
    const onResourcesChanged = vi.fn();
    const store = createStore(() => ({ data: { checkedObsResources: [], isLoggedIn: true } }));
    render(
        <Provider store={store}>
            <ImageList observationId={42} resources={[]} showAddButton={true} onResourcesChanged={onResourcesChanged} />
        </Provider>
    );
    fireEvent.click(screen.getByTestId("AddIcon").closest("button")!);
    fireEvent.click(screen.getByRole("radio", { name: type === "link" ? "Link" : "Image" }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "New resource" } });
    fireEvent.change(screen.getByLabelText("Url"), { target: { value: "https://example.com/resource" } });
    fireEvent.click(screen.getByRole("button", { name: "Add", exact: true }));
    fireEvent.click(screen.getByRole("button", { name: "Close", exact: true }));
    expect(getResources).toHaveBeenCalledTimes(1);

    const resource: IObsResource = {
        id: 7, type, name: "New resource", url: "https://example.com/resource",
        inverted: false, rotation: 0, zoomLevel: 100, backgroundColor: 0,
    };
    await act(async () => save.resolve(response(resource)));
    await waitFor(() => expect(getResources).toHaveBeenCalledTimes(2));
    await act(async () => newerRefresh.resolve(response([resource])));
    expect(type === "link" ? screen.getByText("New resource") : screen.getByTitle("New resource")).toBeInTheDocument();
    await act(async () => {
        if (result === "success") {
            olderRefresh.resolve(response([]));
        } else {
            olderRefresh.reject(new Error("Older request failed"));
        }
    });
    expect(screen.queryByText("Something went wrong!")).not.toBeInTheDocument();
    expect(type === "link" ? screen.getByText("New resource") : screen.getByTitle("New resource")).toBeInTheDocument();
    expect(onResourcesChanged).toHaveBeenCalledTimes(1);
    expect(onResourcesChanged).toHaveBeenLastCalledWith(42, [resource]);
});

// Reproduces closing during a pending deletion, then receiving the pre-delete list last.
it.each([
    ["link", "success"],
    ["image", "success"],
    ["link", "failure"],
    ["image", "failure"],
])("removes a deleted %s when an older refresh finishes with %s", async (type, result) => {
    const deletion = deferred<AxiosResponse>();
    const olderRefresh = deferred<AxiosResponse<IObsResource[]>>();
    const newerRefresh = deferred<AxiosResponse<IObsResource[]>>();
    const resource: IObsResource = {
        id: 7, type, name: "Deleted resource", url: "https://example.com/resource",
        inverted: false, rotation: 0, zoomLevel: 100, backgroundColor: 0,
    };
    vi.spyOn(Api, "deleteResource").mockReturnValue(deletion.promise);
    const getResources = vi.spyOn(Api, "getResources")
        .mockReturnValueOnce(olderRefresh.promise)
        .mockReturnValueOnce(newerRefresh.promise);
    const onResourcesChanged = vi.fn();
    const store = createStore(() => ({ data: { checkedObsResources: [], isLoggedIn: true } }));
    render(
        <Provider store={store}>
            <ImageList observationId={42} resources={[resource]} showAddButton={true} onResourcesChanged={onResourcesChanged} />
        </Provider>
    );
    fireEvent.click(type === "link" ? screen.getByTestId("EditIcon") : screen.getByTitle("Deleted resource"));
    fireEvent.click(screen.getByTestId("DeleteIcon").closest("button")!);
    fireEvent.click(screen.getAllByRole("button", { name: "Delete", exact: true }).at(-1)!);
    fireEvent.click(await screen.findByRole("button", { name: "Close", exact: true }));
    expect(getResources).toHaveBeenCalledTimes(1);

    await act(async () => deletion.resolve(response(undefined)));
    expect(screen.queryByText("Deleted resource")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Deleted resource")).not.toBeInTheDocument();
    expect(onResourcesChanged).toHaveBeenLastCalledWith(42, []);
    await waitFor(() => expect(getResources).toHaveBeenCalledTimes(2));
    await act(async () => newerRefresh.resolve(response([])));
    await act(async () => {
        if (result === "success") {
            olderRefresh.resolve(response([resource]));
        } else {
            olderRefresh.reject(new Error("Older request failed"));
        }
    });
    expect(screen.queryByText("Something went wrong!")).not.toBeInTheDocument();
    expect(screen.queryByText("Deleted resource")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Deleted resource")).not.toBeInTheDocument();
    expect(onResourcesChanged).toHaveBeenCalledTimes(2);
    expect(onResourcesChanged).toHaveBeenLastCalledWith(42, []);
});

// A successful DELETE must remove the link even when the follow-up GET fails; a failed DELETE must keep it.
it.each(["delete", "refresh"])("keeps the resource list consistent when the %s request fails", async (failedRequest) => {
    const deletion = deferred<AxiosResponse>();
    const refresh = deferred<AxiosResponse<IObsResource[]>>();
    const resource: IObsResource = {
        id: 7, type: "link", name: "Resource link", url: "https://example.com/resource",
        inverted: false, rotation: 0, zoomLevel: 100, backgroundColor: 0,
    };
    const deleteResource = vi.spyOn(Api, "deleteResource").mockReturnValue(deletion.promise);
    vi.spyOn(Api, "getResources").mockReturnValue(refresh.promise);
    const onResourcesChanged = vi.fn();
    const store = createStore(() => ({ data: { checkedObsResources: [], isLoggedIn: true } }));
    render(
        <Provider store={store}>
            <ImageList observationId={42} resources={[resource]} showAddButton={true} onResourcesChanged={onResourcesChanged} />
        </Provider>
    );
    fireEvent.click(screen.getByTestId("EditIcon"));
    fireEvent.click(screen.getByTestId("DeleteIcon").closest("button")!);
    fireEvent.click(screen.getByRole("button", { name: "Delete", exact: true }));
    expect(deleteResource).toHaveBeenCalledWith(7);
    if (failedRequest === "delete") {
        await act(async () => deletion.reject(new Error("Delete failed")));
        fireEvent.click(await screen.findByRole("button", { name: "Close", exact: true }));
        expect(screen.getByText("Resource link")).toBeInTheDocument();
        expect(onResourcesChanged).not.toHaveBeenCalled();
    } else {
        await act(async () => deletion.resolve(response(undefined)));
        expect(screen.queryByText("Resource link")).not.toBeInTheDocument();
        expect(onResourcesChanged).toHaveBeenLastCalledWith(42, []);
        await act(async () => refresh.reject(new Error("Refresh failed")));
        expect(screen.queryByText("Resource link")).not.toBeInTheDocument();
    }
});
