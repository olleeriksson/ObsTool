import { Reducer } from "redux";
import { IObsSessionState } from "../components/Types";
import * as actions from "../actions/actions";
import * as constants from "../types/Constants";

const initialObsSessionState: IObsSessionState = {
    obsSessions: [],
    isLoadingObsSessions: false,
    isErrorObsSessions: undefined,
    num: 4
};
// const initialAppState: IAppState = {
//     obsSessions: {
//         obsSessions: [],
//         num: 3
//     }
// };

const ObsSessionReducer: Reducer<IObsSessionState> = (state: IObsSessionState = initialObsSessionState, action: actions.ObsSessionAction) => {

    switch (action.type) {
        case constants.GET_OBSSESSIONS_BEGIN: {
            return {
                ...state,
                isLoadingObsSessions: true,
                isErrorObsSessions: undefined,
            };
        }
        case constants.GET_OBSSESSIONS_SUCCESS: {
            const action1 = action as actions.IGetObsSessionsSuccessAction;
            return {
                ...state,
                obsSessions: action1.payload.obsSessions,
                isLoadingObsSessions: false,
                isErrorObsSessions: undefined,
            };
        }
        case constants.GET_OBSSESSIONS_FAILURE:
            const action2: actions.IGetObsSessionsFailureAction = action as actions.IGetObsSessionsFailureAction;
            return {
                ...state,
                obsSessions: [],
                isLoadingObsSessions: false,
                isErrorObsSessions: action2.payload.error,
            };
        case constants.ADD_OBSSESSION:
            const newAction: actions.IAddObsSessionAction = action as actions.IAddObsSessionAction;
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
