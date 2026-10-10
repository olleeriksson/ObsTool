import { IEyepiece, IInstrument } from "../types/Types";

// Reads positive equipment measurements, accepting decimal commas and placing missing values last.
const getMeasurementForSort = (value: number | string | null | undefined): number => {
  const measurement = typeof value === "number" ? value : Number.parseFloat((value || "").replace(",", "."));
  return Number.isFinite(measurement) && measurement > 0 ? measurement : 0;
};

// Orders instruments from largest diameter to smallest, using their labels to break ties.
export const sortInstrumentsByDiameter = (instrumentA: IInstrument, instrumentB: IInstrument): number => {
  return getMeasurementForSort(instrumentB.diameterMm) - getMeasurementForSort(instrumentA.diameterMm)
    || (instrumentA.key?.trim() || instrumentA.name).localeCompare(instrumentB.key?.trim() || instrumentB.name);
};

// Orders eyepieces from longest focal length to shortest, using their keys to break ties.
export const sortEyepiecesByFocalLength = (eyepieceA: IEyepiece, eyepieceB: IEyepiece): number => {
  return getMeasurementForSort(eyepieceB.focalLengthMm) - getMeasurementForSort(eyepieceA.focalLengthMm)
    || eyepieceA.key.localeCompare(eyepieceB.key);
};
