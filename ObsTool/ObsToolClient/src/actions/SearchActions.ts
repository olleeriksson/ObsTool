import { ActionCreator, Action } from "redux";
import * as constants from "../types/Constants";

// Type these action creators with `: ActionCreator<ActionTypeYouWantToPass>`.
// Remember, you can also pass parameters into an action creator. Make sure to
// type them properly.

// ---------------------------------------------------------------
// Action interfaces
// ---------------------------------------------------------------

export interface ISearchAction extends Action {
    type: constants.SEARCH;
    payload: { query: string; objectKey?: string };
}

export interface IClearSearchAction extends Action {
    type: constants.CLEAR_SEARCH;
}

// -------

export type SearchAction =
    ISearchAction |
    IClearSearchAction
    ;

// ---------------------------------------------------------------
// Action creators
// ---------------------------------------------------------------

export const search: ActionCreator<ISearchAction> = (query: string, objectKey?: string) => ({
    type: constants.SEARCH,
    payload: { query: query, objectKey: objectKey },
});

export const clearSearch: ActionCreator<IClearSearchAction> = () => ({
    type: constants.CLEAR_SEARCH,
});
