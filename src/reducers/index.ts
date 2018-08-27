import { combineReducers, Reducer } from "redux";
import ObsSessionReducer from "./ObsSessionReducer";
import { IAppState } from "../components/Types";

const rootReducer: Reducer<IAppState> = combineReducers<IAppState>({
    obsSessions: ObsSessionReducer,
});

export default rootReducer;
