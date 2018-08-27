import { Reducer } from "redux";
import { IObsSessionReducer } from "../components/Types";
import { ObsSessionAction, IAddObsSessionAction } from "../actions/actions";
import * as constants from "../types/Constants";

const initialObsSessionReducerState: IObsSessionReducer = {
    obsSessions: [],
    num: 3
};

const ObsSessionReducer: Reducer<IObsSessionReducer> = (state: IObsSessionReducer = initialObsSessionReducerState, action: ObsSessionAction) => {
    switch (action.type) {
        case constants.ADD_OBSSESSION:
            const newAction: IAddObsSessionAction = action as IAddObsSessionAction;
            return {
                ...state,
                obsSessions: [
                    ...state.obsSessions,
                    newAction.obsSession
                ]
            };
        case constants.UPDATE_OBSSESSION:
            return {
                ...state  // TODO: Implement!!
            };
        case constants.INCREMENT_NUM:
            console.log("Increasing");
            console.log({ ...state, num: state.num + 1 });
            return { ...state, num: state.num + 1 };
        case constants.DECREMENT_NUM:
            console.log("Decreasing");
            console.log({ ...state, num: Math.max(1, state.num - 1) });
            return { ...state, num: Math.max(1, state.num - 1) };
        default:
            return state;
    }
};

export default ObsSessionReducer;
