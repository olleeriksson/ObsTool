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

export interface IInitiateObsSessionChangeAction extends Action {
    type: constants.INITIATE_OBSSESSION_CHANGE;
    payload: { obsSessionId: number };
}

export interface ILoadObsSessionBeginAction extends Action {
    type: constants.LOAD_OBSSESSION_BEGIN;
    payload: { obsSessionId: number };
}

export interface ILoadObsSessionSuccessAction extends Action {
    type: constants.LOAD_OBSSESSION_SUCCESS;
    payload: { obsSession: IObsSession };
}

export interface ILoadObsSessionFailureAction extends Action {
    type: constants.LOAD_OBSSESSION_FAILURE;
    payload: { error: string };
}

// ------------

export interface IModifyingObsSessionBeginAction extends Action {
    type: constants.MODIFYING_OBSSESSION_BEGIN;
}

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

export interface IModifyingObsSessionFailureAction extends Action {
    type: constants.MODIFYING_OBSSESSION_FAILURE;
    payload: { error: string };
}

// -------

export interface INewObsSessionAction extends Action {
    type: constants.NEW_OBSSESSION;
}

// ------------

export type ObsSessionAction =
    IGetObsSessionsBeginAction |
    IGetObsSessionsSuccessAction |
    IGetObsSessionsFailureAction |
    IInitiateObsSessionChangeAction |
    ILoadObsSessionBeginAction |
    ILoadObsSessionSuccessAction |
    ILoadObsSessionFailureAction |
    IModifyingObsSessionBeginAction |
    IAddObsSessionSuccessAction |
    IUpdateObsSessionSuccessAction |
    IDeleteObsSessionSuccessAction |
    IModifyingObsSessionFailureAction |
    INewObsSessionAction
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

export const initiateObsSessionChange: ActionCreator<IInitiateObsSessionChangeAction> = (obsSessionId: number) => ({
    type: constants.INITIATE_OBSSESSION_CHANGE,
    payload: { obsSessionId: obsSessionId },
});

export const loadObsSessionBegin: ActionCreator<ILoadObsSessionBeginAction> = (obsSessionId: number) => ({
    type: constants.LOAD_OBSSESSION_BEGIN,
    payload: { obsSessionId: obsSessionId },
});

export const loadObsSessionSuccess: ActionCreator<ILoadObsSessionSuccessAction> = (obsSession: IObsSession) => ({
    type: constants.LOAD_OBSSESSION_SUCCESS,
    payload: { obsSession: obsSession },
});

export const loadObsSessionFailure: ActionCreator<ILoadObsSessionFailureAction> = (error: string) => ({
    type: constants.LOAD_OBSSESSION_FAILURE,
    payload: { error: error },
});

export const modifyingObsSessionBegin: ActionCreator<IModifyingObsSessionBeginAction> = () => ({
    type: constants.MODIFYING_OBSSESSION_BEGIN,
});

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

export const modifyingObsSessionFailure: ActionCreator<IModifyingObsSessionFailureAction> = (error: string) => ({
    type: constants.MODIFYING_OBSSESSION_FAILURE,
    payload: { error: error }
});

export const newObsSession: ActionCreator<INewObsSessionAction> = () => ({
    type: constants.NEW_OBSSESSION,
});

// No need to actually define them since just using import * from actions and then passing actions
// to bindActionCreators() will work as well. But this file must not contain any other consts.
// export const ObsSessionActionCreators = {
//     getObsSessions,
//     getObsSessionsSuccess,
//     getObsSessionsFailure,
//     increment,
//     decrement
// };
