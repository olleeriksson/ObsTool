import { ActionCreator, Action } from "redux";
import { IObsSession } from "../components/Types";
import * as constants from "../types/Constants";

// Type these action creators with `: ActionCreator<ActionTypeYouWantToPass>`.
// Remember, you can also pass parameters into an action creator. Make sure to
// type them properly.

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

export type ObsSessionAction = IAddObsSessionAction | IUpdateObsSessionAction | IIncrementNumAction | IDecrementNumAction;

export const addObsSession: ActionCreator<IAddObsSessionAction> = (obsSession: IObsSession) => ({
    type: constants.ADD_OBSSESSION,
    obsSession
});

export const updateObsSession: ActionCreator<IUpdateObsSessionAction> = (obsSession: IObsSession) => ({
    type: constants.UPDATE_OBSSESSION,
    obsSession
});

export const createIncrementAction: ActionCreator<IIncrementNumAction> = () => ({
    type: constants.INCREMENT_NUM,
});

export const createDecrementAction: ActionCreator<IDecrementNumAction> = () => ({
    type: constants.DECREMENT_NUM,
});
