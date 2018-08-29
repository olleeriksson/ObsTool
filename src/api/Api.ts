import { IObsSession, ILocation } from "../components/Types";
import axios from "axios";

class Api {
    public static getObsSessionsSimple() {
        return axios.get<IObsSession[]>("http://localhost:50995/api/obsSessions/?includeLocation=true&simple=true");
    }

    public static getFullObsSession(obsSessionId: number) {
        return axios.get<IObsSession>("http://localhost:50995/api/obsSessions/" + obsSessionId + "?includeLocation=true&includeObservations=true&includeDso=true");
    }

    public static addObsSession(newObsSession: IObsSession) {
        return axios.post<IObsSession>("http://localhost:50995/api/obsSessions/", newObsSession);
    }

    public static updateObsSession(newObsSession: IObsSession) {
        return axios.put<IObsSession>("http://localhost:50995/api/obsSessions/" + newObsSession.id, newObsSession);
    }

    public static deleteObsSession(obsSessionId: number) {
        return axios.delete("http://localhost:50995/api/obsSessions/" + obsSessionId);
    }

    public static getLocations() {
        return axios.get<ILocation[]>("http://localhost:50995/api/locations/");
    }
}

export default Api;