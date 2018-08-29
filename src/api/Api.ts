import { IObsSession, ILocation } from "../components/Types";
import axios from "axios";

class Api {
    public static getObsSessions() {
        return axios.get<IObsSession[]>("http://localhost:50995/api/obsSessions/");
    }

    public static getFullObsSession(obsSessionId: number) {
        return axios.get<IObsSession>("http://localhost:50995/api/obsSessions/" + obsSessionId + "?includeLocation=true&includeObservations=true&includeDso=true");
    }

    public static addObsSession(obsSession: IObsSession) {
    }

    public static updateObsSession(obsSession: IObsSession) {
    }

    public static deleteObsSession(obsSession: IObsSession) {
    }

    public static getLocations() {
        return axios.get<ILocation[]>("http://localhost:50995/api/locations/");
    }
}

export default Api;