import { Reducer } from "redux";
import { IDataState } from "../types/Types";
import {
    ObsSessionAction,
    IGetObsSessionsSuccessAction,
    IGetObsSessionsFailureAction,
    ISelectObsSessionAction,
    IAddObsSessionSuccessAction,
    IUpdateObsSessionSuccessAction,
    IDeleteObsSessionSuccessAction,
} from "../actions/ObsSessionActions";
import {
    LocationAction,
    IGetLocationsSuccessAction,
    IGetLocationsFailureAction,
} from "../actions/LocationActions";
import {
    SearchAction,
    ISearchAction
} from "../actions/SearchActions";
import {
    ObsResourceCheckAction,
    IObsResourceCheckedAction,
    IObsResourceUncheckedAction
} from "../actions/ObsResourceCheckActions";

import * as constants from "../types/Constants";
// import { initialAppState, initialDataState } from "../store/AppStore";

const initialDataState: IDataState = {
    obsSessions: [],
    isLoadingObsSessions: false,
    isErrorObsSessions: undefined,
    selectedObsSessionId: undefined,
    locations: undefined,
    isLoadingLocations: false,
    isErrorLocations: undefined,
    searchQuery: "",
    checkedObsResources: []
};

type DataAction = ObsSessionAction | LocationAction | SearchAction | ObsResourceCheckAction;

const DataReducer: Reducer<IDataState> = (state: IDataState = initialDataState, action: DataAction) => {

    switch (action.type) {
        case constants.GET_OBSSESSIONS_BEGIN: {
            return {
                ...state,
                isLoadingObsSessions: true,
                isErrorObsSessions: undefined,
            };
        }
        case constants.GET_OBSSESSIONS_SUCCESS: {
            const action1 = action as IGetObsSessionsSuccessAction;
            return {
                ...state,
                obsSessions: [...action1.payload.obsSessions],
                isLoadingObsSessions: false,
                isErrorObsSessions: undefined,
            };
        }
        case constants.GET_OBSSESSIONS_FAILURE:
            const action2: IGetObsSessionsFailureAction = action as IGetObsSessionsFailureAction;
            return {
                ...state,
                isLoadingObsSessions: false,
                isErrorObsSessions: action2.payload.error,
            };
        case constants.SELECT_OBSSESSION: {
            const selectAction = action as ISelectObsSessionAction;
            return {
                ...state,
                selectedObsSessionId: selectAction.payload.obsSessionId
            };
        }
        case constants.NEW_OBSSESSION: {
            return {
                ...state,
                selectedObsSessionId: undefined
            };
        }
        case constants.ADD_OBSSESSION_SUCCESS: {
            const addAction = action as IAddObsSessionSuccessAction;
            const newObsSession = { ...addAction.payload.obsSession };
            console.log(newObsSession);
            return {
                ...state,
                obsSessions: [...state.obsSessions, newObsSession],
                //selectedObsSessionId: newObsSession.id,
            };
        }
        case constants.UPDATE_OBSSESSION_SUCCESS: {
            const updateAction = action as IUpdateObsSessionSuccessAction;
            const updatedObsSessionList = state.obsSessions.map(s => {
                return s.id === updateAction.payload.obsSession.id ? updateAction.payload.obsSession : s;  // replace this particular ObsSession
            });
            return {
                ...state,
                obsSessions: updatedObsSessionList
            };
        }
        case constants.DELETE_OBSSESSION_SUCCESS: {
            const deleteAction = action as IDeleteObsSessionSuccessAction;
            const updatedObsSessionList2 = state.obsSessions.filter(s => {
                return s.id !== deleteAction.payload.obsSessionId;  // filter in all except the one with the matching id
            });
            return {
                ...state,
                obsSessions: updatedObsSessionList2,
                selectedObsSessionId: undefined,
            };
            return state;
        }
        case constants.GET_LOCATIONS_BEGIN: {
            return {
                ...state,
                isLoadingLocations: true,
                isErrorLocations: undefined,
            };
        }
        case constants.GET_LOCATIONS_SUCCESS: {
            const action10 = action as IGetLocationsSuccessAction;
            return {
                ...state,
                locations: [...action10.payload.locations],
                isLoadingLocations: false,
                isErrorLocations: undefined,
            };
        }
        case constants.GET_LOCATIONS_FAILURE:
            const action11 = action as IGetLocationsFailureAction;
            return {
                ...state,
                locations: [],   //???
                isLoadingLocations: false,
                isErrorLocations: action11.payload.error,
            };
        case constants.SEARCH:
            const searchAction = action as ISearchAction;
            return {
                ...state,
                searchQuery: searchAction.payload.query
            };
        case constants.CLEAR_SEARCH:
            return {
                ...state,
                searchQuery: ""
            };
        case constants.RESOURCE_CHECKED:
            const checkedAction = action as IObsResourceCheckedAction;
            return {
                ...state,
                checkedObsResources: [...state.checkedObsResources, checkedAction.payload.obsResourceId]
            };
        // case constants.DELETE_OBSSESSION_SUCCESS: {
        //     const deleteAction = action as IDeleteObsSessionSuccessAction;
        //     const updatedObsSessionList2 = state.obsSessions.filter(s => {
        //         return s.id !== deleteAction.payload.obsSessionId;  // filter in all except the one with the matching id
        //     });
        //     return {
        //         ...state,
        //         obsSessions: updatedObsSessionList2,
        //         selectedObsSessionId: undefined,
        //     };
        //     return state;
        // }
        case constants.RESOURCE_UNCHECKED:
            const uncheckedAction = action as IObsResourceUncheckedAction;
            const updatedCheckedObsResources = state.checkedObsResources.filter(r => {
                return r !== uncheckedAction.payload.obsResourceId;   // filter in all except the one with the matching id
            });
            return {
                ...state,
                checkedObsResources: updatedCheckedObsResources
            };
        case constants.RESOURCE_ALL_CLEARED:
            return {
                ...state,
                checkedObsResources: []
            };
        default:
            return state;
    }
};

export default DataReducer;
