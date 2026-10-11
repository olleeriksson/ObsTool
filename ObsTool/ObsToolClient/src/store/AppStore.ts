import { configureStore } from "@reduxjs/toolkit";
// import { routerMiddleware } from "react-router-redux";
import rootReducer from "../reducers/index";
import { IAppState, IDataState } from "../types/Types";

const initialDataState: IDataState = {
    isLoggedIn: false,
    loggedInUserId: undefined,
    loggedInUsername: undefined,
    loggedInEmail: undefined,
    loggedInFullName: undefined,
    isSuperAdmin: false,
    canManageUsers: false,
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

// Configure Redux 5 with supported thunk and development mutation checks.
const initStore = () => configureStore({
    reducer: rootReducer,
    preloadedState: initialAppState,
    // Existing app state may contain domain objects; preserve the previous serialization policy.
    middleware: getDefaultMiddleware => getDefaultMiddleware({ serializableCheck: false }),
});

export default initStore;
