import { IObsSession, ILocation, IInstrument, IEyepiece, IPagedDsoList, IObsResource, IStatistics, ILoginInfo, IHerschelDetails, IConstellationMapObject, IEmailTestRequest, IEmailTestResult, IEmailTestSettings, IAuthenticationStatus, ISignupRequest, IConfirmEmailRequest, IConfirmEmailResult, IForgotPasswordRequest, IResetPasswordRequest, IChangePasswordRequest, IUserAdminList, IAdminChangePasswordRequest, IAdminCreateUserRequest, IAdminUpdateUserRequest, IUserAdmin, IObjectList, IObservedObject, IUserObjectForSave, IPagedSystemEventList, ISystemEventFilters } from "../types/Types";
import axios from "axios";

// The Api is at 50995 from within Visual Studio
// The Api is at 50996 from running dotnet run
// The local production app is at http://localhost:5000/obstool, with the API below /obstool/api.
axios.defaults.withCredentials = true;

class Api {

    public static isLoggedIn() {
        return axios.get<IAuthenticationStatus>(import.meta.env.VITE_API_URL + "/authentication/loggedin/");
    }

    public static login(loginInfo: ILoginInfo) {
        return axios.post<IAuthenticationStatus>(
            import.meta.env.VITE_API_URL + "/authentication/login/",
            loginInfo);
    }

    public static logout() {
        return axios.post<IAuthenticationStatus>(
            import.meta.env.VITE_API_URL + "/authentication/logout/",
            null);
    }

    public static signup(request: ISignupRequest) {
        return axios.post(
            import.meta.env.VITE_API_URL + "/authentication/signup/",
            request);
    }

    public static confirmEmail(request: IConfirmEmailRequest) {
        return axios.post<IConfirmEmailResult>(
            import.meta.env.VITE_API_URL + "/authentication/confirm-email/",
            request);
    }

    public static forgotPassword(request: IForgotPasswordRequest) {
        return axios.post(
            import.meta.env.VITE_API_URL + "/authentication/forgot-password/",
            request);
    }

    public static resetPassword(request: IResetPasswordRequest) {
        return axios.post<IAuthenticationStatus>(
            import.meta.env.VITE_API_URL + "/authentication/reset-password/",
            request);
    }

    public static changePassword(request: IChangePasswordRequest) {
        return axios.post(
            import.meta.env.VITE_API_URL + "/authentication/change-password/",
            request);
    }

    public static getUserAdminList() {
        return axios.get<IUserAdminList>(import.meta.env.VITE_API_URL + "/users/admin/");
    }

    public static adminCreateUser(request: IAdminCreateUserRequest) {
        return axios.post<IUserAdmin>(import.meta.env.VITE_API_URL + "/users/", request);
    }

    public static adminUpdateUser(userId: number, request: IAdminUpdateUserRequest) {
        return axios.put<IUserAdmin>(import.meta.env.VITE_API_URL + "/users/" + userId, request);
    }

    public static adminChangeUserPassword(userId: number, request: IAdminChangePasswordRequest) {
        return axios.put(import.meta.env.VITE_API_URL + "/users/" + userId + "/password/", request);
    }

    public static adminDeleteUser(userId: number) {
        return axios.delete(import.meta.env.VITE_API_URL + "/users/" + userId);
    }

    public static getSystemEvents(page: number, pageSize: number, filters?: ISystemEventFilters) {
        return axios.get<IPagedSystemEventList>(import.meta.env.VITE_API_URL + "/system-events/", {
            params: { page, pageSize, ...filters },
        });
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

    // Downloads the authenticated user's data export as a browser Blob.
    public static exportUserData(exportType: "simple" | "advanced") {
        return axios.get<Blob>(
            import.meta.env.VITE_API_URL + "/userDataExport/" + exportType,
            { responseType: "blob" });
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

    public static searchDso(query: string, includeHerschel = false, signal?: AbortSignal) {
        return axios.get<IPagedDsoList>(
            import.meta.env.VITE_API_URL + "/dso?query=" + encodeURIComponent(query) + "&includeHerschel=" + includeHerschel,
            { signal });
    }

    public static getAllDsosAndTheirObservations() {
        return axios.get<IPagedDsoList>(import.meta.env.VITE_API_URL + "/dso/observed?includeHerschel=true");
    }

    // Loads user-owned and shared non-SAC objects for the Objects page.
    public static getObjects() {
        return axios.get<IObjectList>(import.meta.env.VITE_API_URL + "/objects/");
    }

    // Creates a user object with Name as its stable parser identifier.
    public static addUserObject(newObject: IUserObjectForSave) {
        return axios.post<IObservedObject>(import.meta.env.VITE_API_URL + "/objects/user", newObject);
    }

    // Creates a shared readonly object; the backend enforces who may curate this list.
    public static addOtherObject(newObject: IUserObjectForSave) {
        return axios.post<IObservedObject>(import.meta.env.VITE_API_URL + "/objects/other", newObject);
    }

    // Updates user-object metadata; the backend ignores Name changes after creation.
    public static updateUserObject(objectId: number, updatedObject: IUserObjectForSave) {
        return axios.put<IObservedObject>(import.meta.env.VITE_API_URL + "/objects/user/" + objectId, updatedObject);
    }

    // Updates shared-object metadata; the backend enforces who may curate this list.
    public static updateOtherObject(objectId: number, updatedObject: IUserObjectForSave) {
        return axios.put<IObservedObject>(import.meta.env.VITE_API_URL + "/objects/other/" + objectId, updatedObject);
    }

    // Deletes a user object only when the backend confirms it is unreferenced.
    public static deleteUserObject(objectId: number) {
        return axios.delete(import.meta.env.VITE_API_URL + "/objects/user/" + objectId);
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

    public static getStatistics(statsExcludeLastSessions = 0) {
        return axios.get<IStatistics>(import.meta.env.VITE_API_URL + "/statistics/", {
            params: { statsExcludeLastSessions },
        });
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
