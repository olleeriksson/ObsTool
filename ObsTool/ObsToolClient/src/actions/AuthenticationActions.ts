import { ActionCreator, Action } from "redux";
import * as constants from "../types/Constants";
import { IAuthenticationStatus } from "src/types/Types";

// Type these action creators with `: ActionCreator<ActionTypeYouWantToPass>`.
// Remember, you can also pass parameters into an action creator. Make sure to
// type them properly.

// ---------------------------------------------------------------
// Action interfaces
// ---------------------------------------------------------------

export interface ILoggedInAction extends Action {
    type: constants.LOGGED_IN;
    payload: IAuthenticationStatus;
}

export interface ILoggedOutAction extends Action {
    type: constants.LOGGED_OUT;
}

export interface IAuthenticationCheckedAction extends Action {
    type: constants.AUTHENTICATION_CHECKED;
}

// -------

export type AuthenticationAction =
    ILoggedInAction |
    ILoggedOutAction |
    IAuthenticationCheckedAction
    ;

// ---------------------------------------------------------------
// Action creators
// ---------------------------------------------------------------

export const setLoggedIn: ActionCreator<ILoggedInAction> = (authenticationStatus: IAuthenticationStatus) => ({
    type: constants.LOGGED_IN,
    payload: authenticationStatus
});

export const setLoggedOut: ActionCreator<ILoggedOutAction> = () => ({
    type: constants.LOGGED_OUT
});

export const setAuthenticationChecked: ActionCreator<IAuthenticationCheckedAction> = () => ({
    type: constants.AUTHENTICATION_CHECKED
});
