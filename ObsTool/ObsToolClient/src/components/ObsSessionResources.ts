import { IObsResource, IObsSession } from "../types/Types";

// Returns a new session object with one observation's resources replaced while preserving the rest of the session snapshot.
export function updateObservationResources(
    obsSession: IObsSession,
    observationId: number,
    resources: IObsResource[]
): IObsSession {
    if (!obsSession.observations) {
        return obsSession;
    }

    let didUpdateObservation = false;
    const observations = obsSession.observations.map(observation => {
        if (observation.id !== observationId) {
            return observation;
        }

        didUpdateObservation = true;
        return {
            ...observation,
            obsResources: [...resources],
        };
    });

    if (!didUpdateObservation) {
        return obsSession;
    }

    return {
        ...obsSession,
        observations,
    };
}
