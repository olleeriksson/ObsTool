import { Reducer } from "redux";
import { IDataState } from "../components/Types";
import * as actions from "../actions/ObsSessionActions";
import * as constants from "../types/Constants";
// import { initialState } from "../store/AppStore";

const initialState = {
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
};

const DataReducer: Reducer<IDataState> = (state: IDataState = initialState, action: actions.ObsSessionAction) => {

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
                obsSessions: {
                    ...state.obsSessions,
                    obsSessions: action1.payload.obsSessions,
                    isLoadingObsSessions: false,
                    isErrorObsSessions: undefined,
                }
            };
        }
        case constants.GET_OBSSESSIONS_FAILURE:
            const action2: actions.IGetObsSessionsFailureAction = action as actions.IGetObsSessionsFailureAction;
            return {
                ...state,
                obsSessions: {
                    ...state.obsSessions,
                    isLoadingObsSessions: false,
                    isErrorObsSessions: action2.payload.error,
                }
            };
        case constants.ADD_OBSSESSION:
            // const newAction: actions.IAddObsSessionAction = action as actions.IAddObsSessionAction;
            return state;
        case constants.UPDATE_OBSSESSION:
            // const newAction: actions.IAddObsSessionAction = action as actions.IAddObsSessionAction;
            return state;
        case constants.INCREMENT_NUM:
            console.log("Increasing");
            return {
                ...state,
                obsSessions: {
                    ...state.obsSessions,
                    num: state.obsSessions.num + 1
                }
            };
        case constants.DECREMENT_NUM:
            console.log("Decreasing");
            return {
                ...state,
                obsSessions: {
                    ...state.obsSessions,
                    num: state.obsSessions.num - 1
                }
            };
        default:
            return state;
    }
};

export default DataReducer;
