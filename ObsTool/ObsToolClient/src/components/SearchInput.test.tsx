import * as React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import Api from "../api/Api";
import { IDso } from "../types/Types";
import { SearchInput } from "./SearchInput";

const classes = { root: "" } as any;

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

it("keeps stale autocomplete search responses from replacing the latest results", async () => {
    vi.useFakeTimers();
    const firstSearch = deferred<any>();
    const secondSearch = deferred<any>();
    const searchDso = vi.spyOn(Api, "searchDso")
        .mockReturnValueOnce(firstSearch.promise)
        .mockReturnValueOnce(secondSearch.promise);
    const ref = React.createRef<SearchInput>();

    try {
        render(
            <SearchInput
                ref={ref}
                classes={classes}
                onSearchView={false}
                store={{ searchQuery: "" } as any}
                actions={{ search: vi.fn(), clearSearch: vi.fn() }}
            />
        );

        const input = screen.getByPlaceholderText("Search for an object..");
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

        expect((ref.current as any).state.options.map((option: any) => option.dso?.name)).toEqual(["M 31"]);

        await act(async () => {
            firstSearch.resolve({ data: { data: [makeDso(1, "NGC 1")], more: 0 } });
            await Promise.resolve();
        });

        expect((ref.current as any).state.options.map((option: any) => option.dso?.name)).toEqual(["M 31"]);
    } finally {
        searchDso.mockRestore();
        vi.useRealTimers();
    }
});
