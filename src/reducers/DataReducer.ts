import { Reducer } from "redux";
import { IDataState } from "../components/Types";
import {
    ObsSessionAction,
    IGetObsSessionsSuccessAction,
    IGetObsSessionsFailureAction,
    IInitiateObsSessionChangeAction,
    ILoadObsSessionBeginAction,
    ILoadObsSessionSuccessAction,
    ILoadObsSessionFailureAction,
    IAddObsSessionSuccessAction,
    IUpdateObsSessionSuccessAction,
    IDeleteObsSessionSuccessAction,
    IModifyingObsSessionFailureAction,
} from "../actions/ObsSessionActions";
import {
    LocationAction,
    IGetLocationsSuccessAction,
    IGetLocationsFailureAction
} from "../actions/LocationActions";
import * as constants from "../types/Constants";
// import { initialAppState, initialDataState } from "../store/AppStore";

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

type DataAction = ObsSessionAction | LocationAction;

const DataReducer: Reducer<IDataState> = (state: IDataState = initialDataState, action: DataAction) => {

    switch (action.type) {
        case constants.GET_OBSSESSIONS_BEGIN: {
            return {
                ...state,
                obsSessions: {
                    ...state.obsSessions,
                    isLoadingObsSessions: true,
                    isErrorObsSessions: undefined,
                }
            };
        }
        case constants.GET_OBSSESSIONS_SUCCESS: {
            const action1 = action as IGetObsSessionsSuccessAction;
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
            const action2: IGetObsSessionsFailureAction = action as IGetObsSessionsFailureAction;
            return {
                ...state,
                obsSessions: {
                    ...state.obsSessions,
                    isLoadingObsSessions: false,
                    isErrorObsSessions: action2.payload.error,
                }
            };
        case constants.INITIATE_OBSSESSION_CHANGE: {
            const action7 = action as IInitiateObsSessionChangeAction;
            return {
                ...state,
                selectedObsSession: {
                    ...state.selectedObsSession,
                    obsSessionId: action7.payload.obsSessionId,  // the only change, it might not do anything
                }
            };
        }
        case constants.LOAD_OBSSESSION_BEGIN: {
            const action6 = action as ILoadObsSessionBeginAction;
            return {
                ...state,
                selectedObsSession: {
                    ...state.selectedObsSession,
                    obsSessionId: action6.payload.obsSessionId,
                    obsSession: undefined,
                    isLoading: true,
                    isError: undefined,
                }
            };
        }
        case constants.LOAD_OBSSESSION_SUCCESS: {
            const action3 = action as ILoadObsSessionSuccessAction;
            return {
                ...state,
                selectedObsSession: {
                    ...state.selectedObsSession,
                    obsSession: action3.payload.obsSession,
                    isLoading: false,
                    isError: undefined,
                }
            };
        }
        case constants.LOAD_OBSSESSION_FAILURE: {
            const action4 = action as ILoadObsSessionFailureAction;
            return {
                ...state,
                selectedObsSession: {
                    ...state.selectedObsSession,
                    isLoading: false,
                    isError: action4.payload.error,
                }
            };
        }
        case constants.MODIFYING_OBSSESSION_BEGIN: {
            return {
                ...state,
                selectedObsSession: {
                    ...state.selectedObsSession,
                    isLoading: true,
                    isError: undefined,
                }
            };
        }
        case constants.ADD_OBSSESSION_SUCCESS: {
            const addAction = action as IAddObsSessionSuccessAction;
            return {
                ...state,
                obsSessions: {
                    ...state.obsSessions,
                    obsSessions: [...state.obsSessions.obsSessions, addAction.payload.obsSession]
                },
                selectedObsSession: {
                    ...state.selectedObsSession,
                    isLoading: false,
                    isError: undefined,
                }
            };
        }
        case constants.UPDATE_OBSSESSION_SUCCESS: {
            const updateAction = action as IUpdateObsSessionSuccessAction;
            const updatedObsSessionList = state.obsSessions.obsSessions.map(s => {
                return s.id === updateAction.payload.obsSession.id ? updateAction.payload.obsSession : s;  // replace this particular ObsSession
            });
            return {
                ...state,
                obsSessions: {
                    ...state.obsSessions,
                    obsSessions: updatedObsSessionList
                },
                selectedObsSession: {
                    ...state.selectedObsSession,
                    isLoading: false,
                    isError: undefined,
                }
            };
        }
        case constants.DELETE_OBSSESSION_SUCCESS: {
            const deleteAction = action as IDeleteObsSessionSuccessAction;
            const updatedObsSessionList2 = state.obsSessions.obsSessions.filter(s => {
                return s.id !== deleteAction.payload.obsSessionId;  // filter in all except the one with the matching id
            });
            return {
                ...state,
                obsSessions: {
                    ...state.obsSessions,
                    obsSessions: updatedObsSessionList2
                },
                selectedObsSession: {
                    ...state.selectedObsSession,
                    obsSessionId: undefined,  // not going to display any obssession right now
                    obsSession: undefined,  // not going to display any obssession right now
                    isLoading: false,
                    isError: undefined,
                }
            };
            return state;
        }
        case constants.MODIFYING_OBSSESSION_FAILURE: {
            const action5 = action as IModifyingObsSessionFailureAction;
            return {
                ...state,
                selectedObsSession: {
                    ...state.selectedObsSession,
                    isLoading: true,
                    isError: action5.payload.error,
                }
            };
        }
        case constants.GET_LOCATIONS_BEGIN: {
            return {
                ...state,
                locations: {
                    ...state.locations,
                    isLoadingLocations: true,
                    isErrorLocations: undefined,
                }
            };
        }
        case constants.GET_LOCATIONS_SUCCESS: {
            const action10 = action as IGetLocationsSuccessAction;
            return {
                ...state,
                locations: {
                    ...state.locations,
                    locations: action10.payload.locations,
                    isLoadingLocations: false,
                    isErrorLocations: undefined,
                }
            };
        }
        case constants.GET_LOCATIONS_FAILURE:
            const action11: IGetLocationsFailureAction = action as IGetLocationsFailureAction;
            return {
                ...state,
                locations: {
                    ...state.locations,
                    locations: [],   //???
                    isLoadingLocations: false,
                    isErrorLocations: action11.payload.error,
                }
            };
        default:
            return state;
    }
};

export default DataReducer;
