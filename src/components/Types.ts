export interface IObservation {
    id: number;
    dso: IDso;
    customObjectName: string;
    text: string;
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
}

export interface IObsSession {
    id?: number;
    date?: string;
    location?: any;
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
    numObservations: number;
    numLocations: number;
    numDsoInDatabase: number;
}

export interface ILocation {
    id: number;
    name: string;
    longitude: number;
    latitude: number;
    googleMapsAddress: string;
}

// --------------------------------------------------------------------------

export interface IObsSessionReducer {
    obsSessions: IObsSession[];
    num: number;
}

export interface IAppState {
    obsSessions: IObsSessionReducer;
}
