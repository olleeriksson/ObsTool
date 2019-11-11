import { ActionCreator, Action } from "redux";
import { ILocation } from "../types/Types";
import * as constants from "../types/Constants";

// ---------------------------------------------------------------
// Action interfaces
// ---------------------------------------------------------------

export interface IGetLocationsBeginAction extends Action {
    type: constants.GET_LOCATIONS_BEGIN;
}

export interface IGetLocationsSuccessAction extends Action {
    type: constants.GET_LOCATIONS_SUCCESS;
    payload: { locations: ILocation[] };
}

export interface IGetLocationsFailureAction extends Action {
    type: constants.GET_LOCATIONS_FAILURE;
    payload: { error: string };
    error: boolean;
}

export type LocationAction =
    IGetLocationsBeginAction |
    IGetLocationsSuccessAction |
    IGetLocationsFailureAction
    ;

// ---------------------------------------------------------------
// Action creators
// ---------------------------------------------------------------

export const getLocationsBegin: ActionCreator<IGetLocationsBeginAction> = () => ({
    type: constants.GET_LOCATIONS_BEGIN,
});

export const getLocationsSuccess: ActionCreator<IGetLocationsSuccessAction> = (locations: ILocation[]) => ({
    type: constants.GET_LOCATIONS_SUCCESS,
    payload: { locations: locations },
});

export const getLocationsFailure: ActionCreator<IGetLocationsFailureAction> = (error: string) => ({
    type: constants.GET_LOCATIONS_FAILURE,
    payload: { error: error },
    error: true,
});
