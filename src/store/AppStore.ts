import { createStore, applyMiddleware } from "redux";
// import { routerMiddleware } from "react-router-redux";
import rootReducer from "../reducers/index";
import { ObsSessionAction } from "../actions/ObsSessionActions";
import { IAppState } from "../components/Types";
// import { History } from "history";
import reduxImmutableStateInvariant from "redux-immutable-state-invariant";
import thunk from "redux-thunk";

export const initialState: IAppState = {
    data: {
        obsSessions: {
            obsSessions: [],
            isLoadingObsSessions: false,
            isErrorObsSessions: undefined,
            num: 3,
        },
        locations: {
            locations: [],
            isLoadingLocations: false,
            isErrorLocations: undefined,
        }
    }
};

const initStore = () => {
    const store = createStore<IAppState, ObsSessionAction, {}, {}>(
        rootReducer,
        initialState,
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
