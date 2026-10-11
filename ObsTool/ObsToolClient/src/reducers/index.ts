import DataReducer, { DataAction } from "./DataReducer";
import { IAppState } from "../types/Types";

// Compose the single state slice with the application action union for Redux 5.
function rootReducer(state: IAppState | undefined, action: DataAction): IAppState {
    return { data: DataReducer(state?.data, action) };
}

export default rootReducer;
