import { combineReducers, Reducer } from "redux";
import DataReducer from "./DataReducer";
import { IAppState } from "../components/Types";

const rootReducer: Reducer<IAppState> = combineReducers<IAppState>({
    data: DataReducer
});

export default rootReducer;
