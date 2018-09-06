import { IObsSession, ILocation, IPagedDsoList, IObsResource } from "../types/Types";
import axios from "axios";

class Api {
    public static getObsSessionsSimple() {
        return axios.get<IObsSession[]>("http://localhost:50995/api/obsSessions/?includeLocation=true&simple=true");
    }

    public static getFullObsSession(obsSessionId: number) {
        return axios.get<IObsSession>("http://localhost:50995/api/obsSessions/" + obsSessionId +
            "?includeLocation=true&includeObservations=true&includeDso=true&includeOtherObservations=true");
    }

    public static getAllObservationsOfDso(dsoId: number) {
        return axios.get<IObsSession>("http://localhost:50995/api/observations?dsoId=" + dsoId);
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

    public static searchDso(query: string) {
        return axios.get<IPagedDsoList>("http://localhost:50995/api/dso?query=" + query);
    }

    public static getResources(observationId: number) {
        return axios.get<IObsResource[]>("http://localhost:50995/api/observations/" + observationId + "/resources");
    }

    public static addResource(observationId: number, newResource: IObsResource) {
        return axios.post<IObsResource>("http://localhost:50995/api/observations/" + observationId + "/resources", newResource);
    }

    public static updateResource(newResource: IObsResource) {
        return axios.put<IObsResource>("http://localhost:50995/api/resources/" + newResource.id, newResource);
    }

    public static deleteResource(resourceId: number) {
        return axios.delete("http://localhost:50995/api/resources/" + resourceId);
    }
}

export default Api;