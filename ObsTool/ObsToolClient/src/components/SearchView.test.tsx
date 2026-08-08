import * as React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import Api from "../api/Api";
import { IDso } from "../types/Types";
import { SearchView } from "./SearchView";

const classes = {
    root: "",
    textfieldPaper: "",
    textfield: "",
    badge: "",
} as any;

const makeDso = (id: number, name: string): IDso => ({
    id,
    catalog: name.split(" ")[0],
    catalogNumber: name.split(" ")[1] || "",
    name,
    commonName: "",
    otherCommonNames: "",
    type: "GALXY",
    con: "And",
    mag: "",
    sb: "",
    u2k: "",
    ti: "",
});

const deferred = <T,>() => {
    let resolve!: (value: T) => void;
    let reject!: (reason?: any) => void;
    const promise = new Promise<T>((promiseResolve, promiseReject) => {
        resolve = promiseResolve;
        reject = promiseReject;
    });
    return { promise, resolve, reject };
};

it("keeps stale search page responses from replacing the latest results", async () => {
    vi.useFakeTimers();
    const firstSearch = deferred<any>();
    const secondSearch = deferred<any>();
    const searchDso = vi.spyOn(Api, "searchDso")
        .mockReturnValueOnce(firstSearch.promise)
        .mockReturnValueOnce(secondSearch.promise);
    const ref = React.createRef<SearchView>();

    try {
        render(
            <SearchView
                ref={ref}
                classes={classes}
                store={{ searchQuery: "" } as any}
                actions={{ search: vi.fn(), clearSearch: vi.fn() }}
            />
        );

        const input = screen.getByLabelText("Search for an object..");
        fireEvent.change(input, { target: { value: "NGC" } });

        act(() => {
            vi.advanceTimersByTime(300);
        });

        expect(searchDso).toHaveBeenCalledTimes(1);
        const firstSignal = searchDso.mock.calls[0][2] as AbortSignal;

        fireEvent.change(input, { target: { value: "M 31" } });
        expect(firstSignal.aborted).toBe(true);

        act(() => {
            vi.advanceTimersByTime(300);
        });

        expect(searchDso).toHaveBeenCalledTimes(2);

        await act(async () => {
            secondSearch.resolve({ data: { data: [makeDso(2, "M 31")], more: 0 } });
            await Promise.resolve();
        });

        expect((ref.current as any).state.dsoList.map((dso: IDso) => dso.name)).toEqual(["M 31"]);

        await act(async () => {
            firstSearch.resolve({ data: { data: [makeDso(1, "NGC 1")], more: 0 } });
            await Promise.resolve();
        });

        expect((ref.current as any).state.dsoList.map((dso: IDso) => dso.name)).toEqual(["M 31"]);
    } finally {
        searchDso.mockRestore();
        vi.useRealTimers();
    }
});

it("loads only the object selected in the search preview", async () => {
    vi.useFakeTimers();
    const searchDso = vi.spyOn(Api, "searchDso").mockResolvedValue({
        data: { data: [makeDso(31, "M 31")], more: 0 },
    } as any);

    try {
        render(
            <SearchView
                classes={classes}
                store={{ searchQuery: "M 31", searchObjectKey: "Sac:31" } as any}
                actions={{ search: vi.fn(), clearSearch: vi.fn() }}
            />
        );

        await act(async () => {
            vi.advanceTimersByTime(300);
            await Promise.resolve();
        });

        expect(searchDso).toHaveBeenCalledWith("M 31", true, expect.any(AbortSignal), "Sac:31");
    } finally {
        searchDso.mockRestore();
        vi.useRealTimers();
    }
});
