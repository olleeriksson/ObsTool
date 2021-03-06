import { IObsSession, ILocation, IPagedDsoList, IObsResource, IStatistics, ILoginInfo } from "../types/Types";
import axios from "axios";

// The Api is at 50995 from within Visual Studio
// The Api is at 50996 from running dotnet run
// The Api is at 5000 from executing the deployed Exe

class Api {

    public static isLoggedIn() {
        return axios.get(
            process.env.REACT_APP_API_URL + "/authentication/loggedin/",
            { withCredentials: true });  // for CORS with cookies, only development
    }

    public static login(loginInfo: ILoginInfo) {
        return axios.post<ILoginInfo>(
            process.env.REACT_APP_API_URL + "/authentication/login/",
            loginInfo,
            { withCredentials: true });  // for CORS with cookies, only development
    }

    public static logout() {
        return axios.post(
            process.env.REACT_APP_API_URL + "/authentication/logout/",
            null,
            { withCredentials: true });  // for CORS with cookies, only development
    }

    public static getObsSessionsSimple() {
        return axios.get<IObsSession[]>(process.env.REACT_APP_API_URL + "/obsSessions/?includeLocation=true&simple=true");
    }

    public static getFullObsSession(obsSessionId: number) {
        return axios.get<IObsSession>(process.env.REACT_APP_API_URL + "/obsSessions/" + obsSessionId +
            "?includeLocation=true&includeObservations=true&includeDso=true&includeOtherObservations=true");
    }

    public static getAllObservationsOfDso(dsoId: number) {
        return axios.get<IObsSession>(process.env.REACT_APP_API_URL + "/observations?dsoId=" + dsoId);
    }

    public static addObsSession(newObsSession: IObsSession) {
        return axios.post<IObsSession>(process.env.REACT_APP_API_URL + "/obsSessions/", newObsSession);
    }

    public static updateObsSession(newObsSession: IObsSession) {
        return axios.put<IObsSession>(process.env.REACT_APP_API_URL + "/obsSessions/" + newObsSession.id, newObsSession);
    }

    public static deleteObsSession(obsSessionId: number) {
        return axios.delete(process.env.REACT_APP_API_URL + "/obsSessions/" + obsSessionId);
    }

    public static getLocations() {
        return axios.get<ILocation[]>(process.env.REACT_APP_API_URL + "/locations/");
    }

    public static addLocation(newLocation: ILocation) {
        return axios.post<ILocation>(process.env.REACT_APP_API_URL + "/locations/", newLocation);
    }

    public static updateLocation(updatedLocation: ILocation) {
        return axios.put<ILocation>(process.env.REACT_APP_API_URL + "/locations/" + updatedLocation.id, updatedLocation);
    }

    public static deleteLocation(locationId: number) {
        return axios.delete(process.env.REACT_APP_API_URL + "/locations/" + locationId);
    }

    public static searchDso(query: string) {
        return axios.get<IPagedDsoList>(process.env.REACT_APP_API_URL + "/dso?query=" + query);
    }

    public static getAllDsosAndTheirObservations() {
        return axios.get<IPagedDsoList>(process.env.REACT_APP_API_URL + "/dso/observed");
    }

    // public static getDsoById(dsoId: number) {
    //     return axios.get<IPagedDsoList>(process.env.REACT_APP_API_URL + "/dso/" + dsoId);
    // }

    // public static getDsoByName(dsoName: string) {
    //     return axios.get<IPagedDsoList>(process.env.REACT_APP_API_URL + "/dso?name=" + dsoName);
    // }

    public static getResources(observationId: number) {
        return axios.get<IObsResource[]>(process.env.REACT_APP_API_URL + "/observations/" + observationId + "/resources");
    }

    public static addResource(observationId: number, newResource: IObsResource) {
        return axios.post<IObsResource>(process.env.REACT_APP_API_URL + "/observations/" + observationId + "/resources", newResource);
    }

    public static updateResource(newResource: IObsResource) {
        return axios.put<IObsResource>(process.env.REACT_APP_API_URL + "/resources/" + newResource.id, newResource);
    }

    public static deleteResource(resourceId: number) {
        return axios.delete(process.env.REACT_APP_API_URL + "/resources/" + resourceId);
    }

    public static getStatistics() {
        return axios.get<IStatistics>(process.env.REACT_APP_API_URL + "/statistics/");
    }
}

export default Api;