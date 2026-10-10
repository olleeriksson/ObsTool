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
