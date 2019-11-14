import { ActionCreator, Action } from "redux";
import * as constants from "../types/Constants";

// Type these action creators with `: ActionCreator<ActionTypeYouWantToPass>`.
// Remember, you can also pass parameters into an action creator. Make sure to
// type them properly.

// ---------------------------------------------------------------
// Action interfaces
// ---------------------------------------------------------------

export interface ILoggedInAction extends Action {
    type: constants.LOGGED_IN;
}

export interface ILoggedOutAction extends Action {
    type: constants.LOGGED_OUT;
}

// -------

export type AuthenticationAction =
    ILoggedInAction |
    ILoggedOutAction
    ;

// ---------------------------------------------------------------
// Action creators
// ---------------------------------------------------------------

export const setLoggedIn: ActionCreator<ILoggedInAction> = () => ({
    type: constants.LOGGED_IN
});

export const setLoggedOut: ActionCreator<ILoggedOutAction> = () => ({
    type: constants.LOGGED_OUT
});
