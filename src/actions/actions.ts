import { ActionCreator, Action } from "redux";
import { IObsSession } from "../components/Types";
import * as constants from "../types/Constants";

// Type these action creators with `: ActionCreator<ActionTypeYouWantToPass>`.
// Remember, you can also pass parameters into an action creator. Make sure to
// type them properly.

export interface IGetObsSessionsBeginAction extends Action {
    type: constants.GET_OBSSESSIONS_BEGIN;
}

export interface IGetObsSessionsSuccessAction extends Action {
    type: constants.GET_OBSSESSIONS_SUCCESS;
    payload: { obsSessions: IObsSession[] };
}

export interface IGetObsSessionsFailureAction extends Action {
    type: constants.GET_OBSSESSIONS_FAILURE;
    payload: { error: string };
    error: boolean;
}

export interface IAddObsSessionAction extends Action {
    type: constants.ADD_OBSSESSION;
    obsSession: IObsSession;
}

export interface IUpdateObsSessionAction extends Action {
    type: constants.UPDATE_OBSSESSION;
    obsSession: IObsSession;
}

export interface IIncrementNumAction extends Action {
    type: constants.INCREMENT_NUM;
}

export interface IDecrementNumAction extends Action {
    type: constants.DECREMENT_NUM;
}

export const getObsSessionsBegin: ActionCreator<IGetObsSessionsBeginAction> = () => ({
    type: constants.GET_OBSSESSIONS_BEGIN,
});

export const getObsSessionsSuccess: ActionCreator<IGetObsSessionsSuccessAction> = (obsSessions: IObsSession[]) => ({
    type: constants.GET_OBSSESSIONS_SUCCESS,
    payload: { obsSessions: obsSessions },
});

export const getObsSessionsFailure: ActionCreator<IGetObsSessionsFailureAction> = (error: string) => ({
    type: constants.GET_OBSSESSIONS_FAILURE,
    payload: { error: error },
    error: true,
});

export type ObsSessionAction =
    IGetObsSessionsBeginAction |
    IGetObsSessionsSuccessAction |
    IGetObsSessionsFailureAction |
    IAddObsSessionAction |
    IUpdateObsSessionAction |
    IIncrementNumAction |
    IDecrementNumAction;

// ---------------------------------------------------------------------

export const addObsSession: ActionCreator<IAddObsSessionAction> = (obsSession: IObsSession) => ({
    type: constants.ADD_OBSSESSION,
    obsSession
});

export const updateObsSession: ActionCreator<IUpdateObsSessionAction> = (obsSession: IObsSession) => ({
    type: constants.UPDATE_OBSSESSION,
    obsSession
});

export const increment: ActionCreator<IIncrementNumAction> = () => ({
    type: constants.INCREMENT_NUM,
});

export const decrement: ActionCreator<IDecrementNumAction> = () => ({
    type: constants.DECREMENT_NUM,
});

export const ObsSessionActionCreators = {
    getObsSessionsBegin,
    getObsSessionsSuccess,
    getObsSessionsFailure,
    increment,
    decrement
};
