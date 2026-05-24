import { IDsoObservation, IObservation } from "../types/Types";

// Builds a shared key for the same parsed object in the form list and the observed-object list.
export function getObservedObjectTargetKey(
  observation: IObservation,
  observationIndex: number,
  dsoObservation: IDsoObservation,
  dsoObservationIndex: number
) {
  if (dsoObservation.id !== undefined && dsoObservation.id !== null) {
    return `dsoobs-${dsoObservation.id}`;
  }

  const observationKey = observation.id ?? observation.displayOrder ?? observationIndex;
  const dsoKey = dsoObservation.dso?.id ?? dsoObservation.customObjectName ?? dsoObservationIndex;
  const dsoOrder = dsoObservation.displayOrder ?? dsoObservationIndex;
  return `obs-${observationKey}-dso-${dsoKey}-order-${dsoOrder}`;
}

// Converts the shared target key into a safe DOM id for scrollIntoView.
export function getObservedObjectTargetId(targetKey: string) {
  const safeTargetKey = targetKey.replace(/[^A-Za-z0-9_-]/g, "-");
  return `observed-object-${safeTargetKey}`;
}
