import { ActionCreator, Action } from "redux";
import * as constants from "../types/Constants";
import { IObsResource } from "../types/Types";

// Type these action creators with `: ActionCreator<ActionTypeYouWantToPass>`.
// Remember, you can also pass parameters into an action creator. Make sure to
// type them properly.

// ---------------------------------------------------------------
// Action interfaces
// ---------------------------------------------------------------

export interface IObsResourceCheckedAction extends Action {
    type: constants.RESOURCE_CHECKED;
    payload: { obsResource: IObsResource };
}

export interface IObsResourceUncheckedAction extends Action {
    type: constants.RESOURCE_UNCHECKED;
    payload: { obsResourceId: number };
}

export interface IObsResourceAllClearedAction extends Action {
    type: constants.RESOURCE_ALL_CLEARED;
}

// -------

export type ObsResourceCheckAction =
    IObsResourceCheckedAction |
    IObsResourceUncheckedAction |
    IObsResourceAllClearedAction
    ;

// ---------------------------------------------------------------
// Action creators
// ---------------------------------------------------------------

export const checkObsResource: ActionCreator<IObsResourceCheckedAction> = (obsResource: IObsResource) => ({
    type: constants.RESOURCE_CHECKED,
    payload: { obsResource: obsResource },
});

export const uncheckObsResource: ActionCreator<IObsResourceUncheckedAction> = (obsResourceId: number) => ({
    type: constants.RESOURCE_UNCHECKED,
    payload: { obsResourceId: obsResourceId },
});

export const clearCheckedObsResources: ActionCreator<IObsResourceAllClearedAction> = () => ({
    type: constants.RESOURCE_ALL_CLEARED,
});
