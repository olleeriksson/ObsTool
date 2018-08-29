import { ActionCreator, Action } from "redux";
import { IObsSession } from "../components/Types";
import * as constants from "../types/Constants";

// Type these action creators with `: ActionCreator<ActionTypeYouWantToPass>`.
// Remember, you can also pass parameters into an action creator. Make sure to
// type them properly.

// ---------------------------------------------------------------
// Action interfaces
// ---------------------------------------------------------------

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
}

// ------------

export interface ISelectObsSessionAction extends Action {
    type: constants.SELECT_OBSSESSION;
    payload: { obsSessionId: number };
}

export interface INewObsSessionAction extends Action {
    type: constants.NEW_OBSSESSION;
}

// ------------

export interface IAddObsSessionSuccessAction extends Action {
    type: constants.ADD_OBSSESSION_SUCCESS;
    payload: { obsSession: IObsSession };
}

export interface IUpdateObsSessionSuccessAction extends Action {
    type: constants.UPDATE_OBSSESSION_SUCCESS;
    payload: { obsSession: IObsSession };
}

export interface IDeleteObsSessionSuccessAction extends Action {
    type: constants.DELETE_OBSSESSION_SUCCESS;
    payload: { obsSessionId: number };
}

// -------

export type ObsSessionAction =
    IGetObsSessionsBeginAction |
    IGetObsSessionsSuccessAction |
    IGetObsSessionsFailureAction |
    ISelectObsSessionAction |
    INewObsSessionAction |
    IAddObsSessionSuccessAction |
    IUpdateObsSessionSuccessAction |
    IDeleteObsSessionSuccessAction
    ;

// ---------------------------------------------------------------
// Action creators
// ---------------------------------------------------------------

// Attempt at a thunk
// npm install thunk-redux (@types/thunk-redux)
// import { ThunkAction } from "redux-thunk";
// import Api from "../api/Api";
// export const getObsSessionThunkAsync: ActionCreator<ThunkAction<Action, IObsSessionState, void, AnyAction>> = () => {
//     return (dispatch: Dispatch<any>): void => {
//         dispatch(getObsSessionsBegin());
//         Api.getObsSessions().then(
//             (response) => {
//                 dispatch(getObsSessionsSuccess(response.data));
//             }).catch(
//                 (error) => dispatch(getObsSessionsFailure(error))
//             );
//     }
// }

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
});

// -------

export const selectObsSession: ActionCreator<ISelectObsSessionAction> = (obsSessionId: number) => ({
    type: constants.SELECT_OBSSESSION,
    payload: { obsSessionId: obsSessionId },
});

export const newObsSession: ActionCreator<INewObsSessionAction> = () => ({
    type: constants.NEW_OBSSESSION
});

// -------

export const addObsSessionSuccess: ActionCreator<IAddObsSessionSuccessAction> = (obsSession: IObsSession) => ({
    type: constants.ADD_OBSSESSION_SUCCESS,
    payload: { obsSession: obsSession },
});

export const updateObsSessionSuccess: ActionCreator<IUpdateObsSessionSuccessAction> = (obsSession: IObsSession) => ({
    type: constants.UPDATE_OBSSESSION_SUCCESS,
    payload: { obsSession: obsSession },
});

export const deleteObsSessionSuccess: ActionCreator<IDeleteObsSessionSuccessAction> = (obsSessionId: number) => ({
    type: constants.DELETE_OBSSESSION_SUCCESS,
    payload: { obsSessionId: obsSessionId },
});
