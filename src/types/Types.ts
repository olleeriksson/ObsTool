export interface IObservation {
    id: number;
    dsoObservations: IDsoObservation[];
    text: string;
    obsSession?: IObsSession;
    otherObservations?: IObservation[];
    obsResources?: IObsResource[];
    displayOrder: number;
    nonDetection: boolean;
}

export interface IDsoObservation {
    id: number;
    dso: IDso;
    obsSession: IObsSession;
    customObjectName: string;
    displayOrder: number;
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
    catalog: string;
    catalogNumber?: string;
    name: string;
    otherNames?: string;
    commonName: string;
    otherCommonNames: string;
    type: string;
    con: string;
    mag: string;
    sb: string;
    u2k: string;
    ti: string;
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
}

export interface IDsoExtra {
    id: number;
    rating: number;
    followUp: boolean;
}

export interface IPagedDsoList {
    data: IDso[];
    total: number;
    count: number;
    more: number;
}

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

    locationId?: number; // addition for post/put
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
}

export interface ILocation {
    id?: number;
    name: string;
    longitude?: string;
    latitude?: string;
    googleMapsAddress: string;
}

// --------------------------------------------------------------------------

export interface IDataState {
    obsSessions: IObsSession[];
    isLoadingObsSessions: boolean;
    isErrorObsSessions?: string;
    selectedObsSessionId?: number;
    locations?: ILocation[];
    isLoadingLocations: boolean;
    isErrorLocations?: string;
    searchQuery?: string;
    checkedObsResources: IObsResource[];
}

export interface IReadonlyDataState {
    obsSessions: ReadonlyArray<Readonly<IObsSession>>;
    isLoadingObsSessions: boolean;
    isErrorObsSessions?: string;
    selectedObsSessionId?: number;
    locations?: ILocation[];
    isLoadingLocations: boolean;
    isErrorLocations?: string;
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
