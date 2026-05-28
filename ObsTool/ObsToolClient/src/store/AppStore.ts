import { createStore, applyMiddleware } from "redux";
// import { routerMiddleware } from "react-router-redux";
import rootReducer from "../reducers/index";
import { ObsSessionAction } from "../actions/ObsSessionActions";
import { IAppState, IDataState } from "../types/Types";
import reduxImmutableStateInvariant from "redux-immutable-state-invariant";
import { thunk } from "redux-thunk";

const initialDataState: IDataState = {
    isLoggedIn: false,
    loggedInUserId: undefined,
    loggedInUsername: undefined,
    loggedInEmail: undefined,
    loggedInFullName: undefined,
    isSuperAdmin: false,
    hasCheckedAuthentication: false,
    obsSessions: [],
    isLoadingObsSessions: false,
    isErrorObsSessions: undefined,
    selectedObsSessionId: undefined,
    locations: undefined,
    isLoadingLocations: false,
    isErrorLocations: undefined,
    instruments: undefined,
    isLoadingInstruments: false,
    isErrorInstruments: undefined,
    eyepieces: undefined,
    isLoadingEyepieces: false,
    isErrorEyepieces: undefined,
    searchQuery: "",
    checkedObsResources: []
};

const initialAppState: IAppState = {
    data: initialDataState
};

const initStore = () => {
    const store = createStore<IAppState, ObsSessionAction, {}, {}>(
        rootReducer,
        initialAppState,
        applyMiddleware(
            reduxImmutableStateInvariant(),
            thunk
            // routerMiddleware(),
            // routerMiddleware(history),
        ),
    );

    return store;
};

export default initStore;
