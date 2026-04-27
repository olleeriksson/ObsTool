import { ActionCreator, Action } from "redux";
import { IEyepiece } from "../types/Types";
import * as constants from "../types/Constants";

export interface IGetEyepiecesBeginAction extends Action {
    type: constants.GET_EYEPIECES_BEGIN;
}

export interface IGetEyepiecesSuccessAction extends Action {
    type: constants.GET_EYEPIECES_SUCCESS;
    payload: { eyepieces: IEyepiece[] };
}

export interface IGetEyepiecesFailureAction extends Action {
    type: constants.GET_EYEPIECES_FAILURE;
    payload: { error: string };
    error: boolean;
}

export type EyepieceAction =
    IGetEyepiecesBeginAction |
    IGetEyepiecesSuccessAction |
    IGetEyepiecesFailureAction;

export const getEyepiecesBegin: ActionCreator<IGetEyepiecesBeginAction> = () => ({
    type: constants.GET_EYEPIECES_BEGIN,
});

export const getEyepiecesSuccess: ActionCreator<IGetEyepiecesSuccessAction> = (eyepieces: IEyepiece[]) => ({
    type: constants.GET_EYEPIECES_SUCCESS,
    payload: { eyepieces },
});

export const getEyepiecesFailure: ActionCreator<IGetEyepiecesFailureAction> = (error: string) => ({
    type: constants.GET_EYEPIECES_FAILURE,
    payload: { error },
    error: true,
});
