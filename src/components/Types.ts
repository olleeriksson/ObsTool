export interface IObservation {
    dso: IDso;
    customObjectName: string;
    text: string;
}

export interface IDso {
    id: number;
    catalog: string;
    catalogNumber: string;
    name: string;
    otherNames: string;
    type: string;
    con: string;
}

export interface IObsSession {
    id?: number;
    date: string;
    location?: any;
    title: string;
    summary?: string;
    conditions?: string;
    seeing?: number;
    transparency?: number;
    limitingMagnitude?: number;
    observations?: IObservation[];
    reportText?: string;
    dsoObjects?: IDso[];
}

export interface IStatistics {
    numObsSessions: number;
    numObservedObjects: number;
    numObservations: number;
    numLocations: number;
    numDsoInDatabase: number;
}