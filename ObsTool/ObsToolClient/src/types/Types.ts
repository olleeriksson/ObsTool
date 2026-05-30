export interface ILoginInfo {
    username: string;
    password: string;
}

export interface IAuthenticationStatus {
    isLoggedIn: boolean;
    userId?: number;
    username?: string;
    email?: string;
    fullName?: string;
    isSuperAdmin: boolean;
    canManageUsers: boolean;
}

export interface ISignupRequest {
    email: string;
    username?: string;
    fullName: string;
    password: string;
}

export interface IConfirmEmailRequest {
    userId: number;
    token: string;
}

export interface IConfirmEmailResult {
    email: string;
}

export interface IForgotPasswordRequest {
    email: string;
}

export interface IResetPasswordRequest {
    userId: number;
    token: string;
    password: string;
    confirmPassword: string;
}

export interface IChangePasswordRequest {
    currentPassword: string;
    password: string;
    confirmPassword: string;
}

export interface IAdminChangePasswordRequest {
    password: string;
    confirmPassword: string;
}

export interface IUserAdmin {
    id: number;
    email: string;
    username?: string;
    fullName: string;
    emailConfirmed: boolean;
    createdUtc: string;
    lastLoginUtc?: string;
}

export interface ISuperAdminUser {
    username: string;
    email?: string;
    fullName?: string;
}

export interface IUserAdminList {
    users: IUserAdmin[];
    superAdmins: ISuperAdminUser[];
}

export interface IEmailTestRequest {
    to?: string;
    subject?: string;
    body?: string;
}

export interface IEmailTestResult {
    message: string;
    to: string;
    from: string;
    smtpHost: string;
    smtpPort: number;
    sentAtUtc: string;
}

export interface IEmailTestSettings {
    isConfigured: boolean;
    mailTo: string;
    mailFrom: string;
    smtpHost: string;
    smtpPort: number;
    secureSocketOption: string;
    hasUsername: boolean;
    hasPassword: boolean;
}

export interface IObservation {
    id: number;
    identifier?: string;
    dsoObservations: IDsoObservation[];
    text: string;
    obsSession?: IObsSession;
    otherObservations?: IObservation[];
    prevObservation?: IObservation;
    nextObservation?: IObservation;
    obsResources?: IObsResource[];
    displayOrder: number;
    nonDetection: boolean;
    instrumentId?: number;
    instrument?: IInstrument;
}

export interface IDsoObservation {
    id: number;
    dsoId?: number;
    otherObjectId?: number;
    userObjectId?: number;
    objectKind?: "Sac" | "Other" | "User";
    objectKey?: string;
    dso: IDso;
    obsSession: IObsSession;
    displayOrder: number;
    nonDetection: boolean;
}

export interface IObsResource {
    id?: number;
    type: string;
    name?: string;
    url?: string;
    inverted: boolean;
    rotation: number;
    zoomLevel: number;
    backgroundColor: number;
}

export interface IDso {
    id: number;
    objectKind?: "Sac" | "Other" | "User";
    objectKey?: string;
    catalog: string;
    catalogNumber?: string;
    name: string;
    otherNames?: string;
    commonName?: string;
    otherCommonNames?: string;
    type?: string;
    con?: string;
    ra?: string;
    dec?: string;
    mag?: string;
    sb?: string;
    u2k?: string;
    ti?: string;
    sizeMax?: string;
    sizeMin?: string;
    ps?: string;
    class?: string;
    nsts?: string;
    brstr?: string;
    bchm?: string;
    dreyerDesc?: string;
    notes?: string;
    numObservations?: number;
    observations?: IObservation[];
    dsoExtra?: IDsoExtra;
    herschelObjects?: IHerschelInfo[];
}

export interface IDsoExtra {
    id: number;
    rating: number;
    followUp: boolean;
}

export interface IHerschelInfo {
    herschelId: number;
    herschelNo: string;
    h400: boolean;
}

export interface IHerschelDetails extends IHerschelInfo {
    descrLong?: string;
    herschelSummary?: string;
}

export interface IPagedDsoList {
    data: IDso[];
    total: number;
    count: number;
    more: number;
}

export interface IObjectList {
    userObjects: IObservedObject[];
    otherObjects: IObservedObject[];
    constellations?: IConstellationOption[];
    canCreateOtherObjects?: boolean;
}

export interface IConstellationOption {
    name: string;
    abbreviation: string;
}

export interface IObservedObject {
    id?: number;
    objectKind?: "Other" | "User";
    objectKey?: string;
    name: string;
    otherNames?: string;
    commonName?: string;
    allCommonNames?: string;
    notes?: string;
    type?: string;
    const?: string;
    ra?: string;
    dec?: string;
    mag?: string;
    numReferences?: number;
    referencedSessionDates?: string[];
    references?: IObjectReference[];
    canEdit?: boolean;
    canDelete?: boolean;
}

export interface IObjectReference {
    obsSessionId: number;
    date: string;
}

export type IUserObjectForSave = Omit<IObservedObject, "id" | "objectKind" | "objectKey" | "numReferences" | "referencedSessionDates" | "references" | "canEdit" | "canDelete">;

export interface IObsSession {
    id?: number;
    date?: string;
    location?: ILocation;
    title?: string;
    summary?: string;
    conditions?: string;
    seeing?: number;
    transparency?: number;
    limitingMagnitude?: number;
    observations?: IObservation[];
    reportText?: string;
    dsoObjects?: IDso[];
    objectStats?: IObsSessionObjectStats;

    locationId?: number; // addition for post/put
    instrumentId?: number; // addition for post/put
    instrument?: IInstrument;
}

export interface IObsSessionObjectStats {
    total: number;
    galaxies: number;
    nebulae: number;
    clusters: number;
    other: number;
}

export interface IStatistics {
    numObsSessions: number;
    numObservedObjects: number;
    numObservedGalaxies: number;
    numObservedBrightNebulae: number;
    numObservedDarkNebulae: number;
    numObservedOpenClusters: number;
    numObservedPlanetaryNebulae: number;
    numObservedGlobularClusters: number;
    numObservedMessierObjects: number;
    numObservedNGCObjects: number;
    numObservations: number;
    numLocations: number;
    numSketches: number;
    numDsoInDatabase: number;
    numDetections: number;
    numNonDetections: number;
    h2500?: IObsGroupStatistics;
    h400?: IObsGroupStatistics;
    constellations?: IConstellationStatistics[];
}

export interface IObsGroupStatistics {
    total: number;
    observed: number;
    nonDetections: number;
}

export interface IConstellationStatistics {
    constellation: string;
    constellationAbbrv: string;
    observed: number;
    h2500: IObsGroupStatistics;
    h400: IObsGroupStatistics;
}

export interface IConstellationMapObject {
    herschelId?: number;
    herschelNo?: string;
    h400?: boolean;
    dsoId?: number;
    id?: number | string;
    name: string;
    catalog?: string;
    catalogNumber?: string;
    constellation?: string;
    ra: string;
    dec: string;
    isObserved?: boolean;
}

export interface ILocation {
    id?: number;
    name: string;
    longitude?: string;
    latitude?: string;
    googleMapsAddress: string;
}

export interface IInstrument {
    id?: number;
    key?: string | null;
    name: string;
    diameterMm?: number | null;
    focalLengthMm?: number | null;
    iconReference?: string | null;
}

export interface IEyepiece {
    id?: number;
    key: string;
    name: string;
    focalLengthMm?: string;
}

// --------------------------------------------------------------------------

export interface IDataState {
    isLoggedIn: boolean;
    loggedInUserId?: number;
    loggedInUsername?: string;
    loggedInEmail?: string;
    loggedInFullName?: string;
    isSuperAdmin: boolean;
    canManageUsers: boolean;
    hasCheckedAuthentication: boolean;
    obsSessions: IObsSession[];
    isLoadingObsSessions: boolean;
    isErrorObsSessions?: string;
    selectedObsSessionId?: number;
    locations?: ILocation[];
    isLoadingLocations: boolean;
    isErrorLocations?: string;
    instruments?: IInstrument[];
    isLoadingInstruments: boolean;
    isErrorInstruments?: string;
    eyepieces?: IEyepiece[];
    isLoadingEyepieces: boolean;
    isErrorEyepieces?: string;
    searchQuery?: string;
    checkedObsResources: IObsResource[];
}

export interface IReadonlyDataState {
    isLoggedIn: boolean;
    loggedInUserId?: number;
    loggedInUsername?: string;
    loggedInEmail?: string;
    loggedInFullName?: string;
    isSuperAdmin: boolean;
    canManageUsers: boolean;
    hasCheckedAuthentication: boolean;
    obsSessions: ReadonlyArray<Readonly<IObsSession>>;
    isLoadingObsSessions: boolean;
    isErrorObsSessions?: string;
    selectedObsSessionId?: number;
    locations?: ILocation[];
    isLoadingLocations: boolean;
    isErrorLocations?: string;
    instruments?: IInstrument[];
    isLoadingInstruments: boolean;
    isErrorInstruments?: string;
    eyepieces?: IEyepiece[];
    isLoadingEyepieces: boolean;
    isErrorEyepieces?: string;
    searchQuery?: string;
    checkedObsResources: IObsResource[];
}

export type ReadonlyDataState = Readonly<IReadonlyDataState>;

export interface IAppState {
    data: IDataState;
}

export interface IErrorDetails {
    Message: string;
    StatusCode: number;
}
