import { ActionCreator, Action } from "redux";
import { IInstrument } from "../types/Types";
import * as constants from "../types/Constants";

export interface IGetInstrumentsBeginAction extends Action {
    type: constants.GET_INSTRUMENTS_BEGIN;
}

export interface IGetInstrumentsSuccessAction extends Action {
    type: constants.GET_INSTRUMENTS_SUCCESS;
    payload: { instruments: IInstrument[] };
}

export interface IGetInstrumentsFailureAction extends Action {
    type: constants.GET_INSTRUMENTS_FAILURE;
    payload: { error: string };
    error: boolean;
}

export type InstrumentAction =
    IGetInstrumentsBeginAction |
    IGetInstrumentsSuccessAction |
    IGetInstrumentsFailureAction;

export const getInstrumentsBegin: ActionCreator<IGetInstrumentsBeginAction> = () => ({
    type: constants.GET_INSTRUMENTS_BEGIN,
});

export const getInstrumentsSuccess: ActionCreator<IGetInstrumentsSuccessAction> = (instruments: IInstrument[]) => ({
    type: constants.GET_INSTRUMENTS_SUCCESS,
    payload: { instruments },
});

export const getInstrumentsFailure: ActionCreator<IGetInstrumentsFailureAction> = (error: string) => ({
    type: constants.GET_INSTRUMENTS_FAILURE,
    payload: { error },
    error: true,
});
