import { createStore, applyMiddleware } from "redux";
// import { routerMiddleware } from "react-router-redux";
import rootReducer from "../reducers/index";
import { ObsSessionAction } from "../actions/ObsSessionActions";
import { IAppState, IDataState } from "../components/Types";
// import { History } from "history";
import reduxImmutableStateInvariant from "redux-immutable-state-invariant";
import thunk from "redux-thunk";

const initialDataState: IDataState = {
    obsSessions: {
        obsSessions: [],
        isLoadingObsSessions: false,
        isErrorObsSessions: undefined,
    },
    selectedObsSession: {
        obsSessionId: undefined,
        obsSession: undefined,
        isLoading: false,
        isError: undefined,
    },
    locations: {
        locations: undefined,
        isLoadingLocations: false,
        isErrorLocations: undefined,
    }
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
