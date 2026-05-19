import { IObsSession, ILocation, IInstrument, IEyepiece, IPagedDsoList, IObsResource, IStatistics, ILoginInfo, IHerschelDetails, IConstellationMapObject, IEmailTestRequest, IEmailTestResult, IEmailTestSettings } from "../types/Types";
import axios from "axios";

// The Api is at 50995 from within Visual Studio
// The Api is at 50996 from running dotnet run
// The local production app is at http://localhost:5000/obstool, with the API below /obstool/api.

class Api {

    public static isLoggedIn() {
        return axios.get(
            import.meta.env.VITE_API_URL + "/authentication/loggedin/",
            { withCredentials: true });  // for CORS with cookies, only development
    }

    public static login(loginInfo: ILoginInfo) {
        return axios.post<ILoginInfo>(
            import.meta.env.VITE_API_URL + "/authentication/login/",
            loginInfo,
            { withCredentials: true });  // for CORS with cookies, only development
    }

    public static logout() {
        return axios.post(
            import.meta.env.VITE_API_URL + "/authentication/logout/",
            null,
            { withCredentials: true });  // for CORS with cookies, only development
    }

    public static getObsSessionsSimple() {
        return axios.get<IObsSession[]>(import.meta.env.VITE_API_URL + "/obsSessions/?includeLocation=true&simple=true");
    }

    public static getFullObsSession(obsSessionId: number) {
        return axios.get<IObsSession>(import.meta.env.VITE_API_URL + "/obsSessions/" + obsSessionId +
            "?includeLocation=true&includeObservations=true&includeDso=true&includeOtherObservations=true&includePrevAndNextObservations=true&includeHerschel=true");
    }

    public static addObsSession(newObsSession: IObsSession) {
        return axios.post<IObsSession>(import.meta.env.VITE_API_URL + "/obsSessions/", newObsSession);
    }

    public static updateObsSession(newObsSession: IObsSession) {
        return axios.put<IObsSession>(import.meta.env.VITE_API_URL + "/obsSessions/" + newObsSession.id, newObsSession);
    }

    public static deleteObsSession(obsSessionId: number) {
        return axios.delete(import.meta.env.VITE_API_URL + "/obsSessions/" + obsSessionId);
    }

    public static getLocations() {
        return axios.get<ILocation[]>(import.meta.env.VITE_API_URL + "/locations/");
    }

    public static addLocation(newLocation: ILocation) {
        return axios.post<ILocation>(import.meta.env.VITE_API_URL + "/locations/", newLocation);
    }

    public static updateLocation(updatedLocation: ILocation) {
        return axios.put<ILocation>(import.meta.env.VITE_API_URL + "/locations/" + updatedLocation.id, updatedLocation);
    }

    public static deleteLocation(locationId: number) {
        return axios.delete(import.meta.env.VITE_API_URL + "/locations/" + locationId);
    }

    public static getInstruments() {
        return axios.get<IInstrument[]>(import.meta.env.VITE_API_URL + "/instruments/");
    }

    public static addInstrument(newInstrument: IInstrument) {
        return axios.post<IInstrument>(import.meta.env.VITE_API_URL + "/instruments/", newInstrument);
    }

    public static updateInstrument(updatedInstrument: IInstrument) {
        return axios.put<IInstrument>(import.meta.env.VITE_API_URL + "/instruments/" + updatedInstrument.id, updatedInstrument);
    }

    public static deleteInstrument(instrumentId: number) {
        return axios.delete(import.meta.env.VITE_API_URL + "/instruments/" + instrumentId);
    }

    public static getEyepieces() {
        return axios.get<IEyepiece[]>(import.meta.env.VITE_API_URL + "/eyepieces/");
    }

    public static addEyepiece(newEyepiece: IEyepiece) {
        return axios.post<IEyepiece>(import.meta.env.VITE_API_URL + "/eyepieces/", newEyepiece);
    }

    public static updateEyepiece(updatedEyepiece: IEyepiece) {
        return axios.put<IEyepiece>(import.meta.env.VITE_API_URL + "/eyepieces/" + updatedEyepiece.id, updatedEyepiece);
    }

    public static deleteEyepiece(eyepieceId: number) {
        return axios.delete(import.meta.env.VITE_API_URL + "/eyepieces/" + eyepieceId);
    }

    public static searchDso(query: string, includeHerschel = false) {
        return axios.get<IPagedDsoList>(import.meta.env.VITE_API_URL + "/dso?query=" + encodeURIComponent(query) + "&includeHerschel=" + includeHerschel);
    }

    public static getAllDsosAndTheirObservations() {
        return axios.get<IPagedDsoList>(import.meta.env.VITE_API_URL + "/dso/observed?includeHerschel=true");
    }

    public static getHerschelDetails(dsoId: number) {
        return axios.get<IHerschelDetails[]>(import.meta.env.VITE_API_URL + "/dso/" + dsoId + "/herschel");
    }

    // public static getDsoById(dsoId: number) {
    //     return axios.get<IPagedDsoList>(import.meta.env.VITE_API_URL + "/dso/" + dsoId);
    // }

    // public static getDsoByName(dsoName: string) {
    //     return axios.get<IPagedDsoList>(import.meta.env.VITE_API_URL + "/dso?name=" + dsoName);
    // }

    public static getResources(observationId: number) {
        return axios.get<IObsResource[]>(import.meta.env.VITE_API_URL + "/observations/" + observationId + "/resources");
    }

    public static addResource(observationId: number, newResource: IObsResource) {
        return axios.post<IObsResource>(import.meta.env.VITE_API_URL + "/observations/" + observationId + "/resources", newResource);
    }

    public static updateResource(newResource: IObsResource) {
        return axios.put<IObsResource>(import.meta.env.VITE_API_URL + "/resources/" + newResource.id, newResource);
    }

    public static deleteResource(resourceId: number) {
        return axios.delete(import.meta.env.VITE_API_URL + "/resources/" + resourceId);
    }

    public static getStatistics() {
        return axios.get<IStatistics>(import.meta.env.VITE_API_URL + "/statistics/");
    }

    public static getH2500ObjectsForConstellationMap(constellation: string) {
        return axios.get<IConstellationMapObject[]>(import.meta.env.VITE_API_URL + "/statistics/constellations/" + encodeURIComponent(constellation) + "/h2500");
    }

    public static getEmailTestSettings() {
        return axios.get<IEmailTestSettings>(
            import.meta.env.VITE_API_URL + "/diagnostics/email/settings",
            { withCredentials: true });
    }

    public static sendEmailTest(request: IEmailTestRequest) {
        return axios.post<IEmailTestResult>(
            import.meta.env.VITE_API_URL + "/diagnostics/email/test",
            request,
            { withCredentials: true });
    }
}

export default Api;
