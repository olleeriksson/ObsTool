import { createStore, applyMiddleware } from "redux";
// import { routerMiddleware } from "react-router-redux";
import rootReducer from "../reducers/index";
import { ObsSessionAction } from "../actions/actions";
import { IAppState } from "../components/Types";
// import { History } from "history";
import reduxImmutableStateInvariant from "redux-immutable-state-invariant";

const initStore = () => {

    const initialAppState: IAppState = {
        obsSessions: {
            obsSessions: [],
            num: 3
        }
    };

    const store = createStore<IAppState, ObsSessionAction, {}, {}>(
        rootReducer,
        initialAppState,
        applyMiddleware(
            reduxImmutableStateInvariant()
            // routerMiddleware(),
            // routerMiddleware(history),
        ),
    );

    return store;
};

export default initStore;
