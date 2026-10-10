import * as React from "react";
import Api from "../api/Api";
import { IEyepiece, IInstrument } from "../types/Types";

let eyepiecesCache: IEyepiece[] | null = null;
let eyepiecesPromise: Promise<IEyepiece[]> | null = null;
let eyepiecesCacheVersion = 0;

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Formats magnification and exit pupil using the unrounded optical magnification.
const getEyepieceAnnotationText = (
  instrumentFocalLengthMm: number,
  eyepieceFocalLengthMm: number,
  instrumentDiameterMm: number | null | undefined
) => {
  const magnification = instrumentFocalLengthMm / eyepieceFocalLengthMm;
  const magnificationText = `${Math.round(magnification)}x`;
  if (!instrumentDiameterMm || !Number.isFinite(instrumentDiameterMm) || instrumentDiameterMm <= 0) {
    return magnificationText;
  }

  const exitPupilMm = instrumentDiameterMm / magnification;
  return `${magnificationText}, ${exitPupilMm.toFixed(1)}mm EP`;
};

const buildKeyRegex = (key: string) => new RegExp(`(^|[^A-Za-z0-9])(${escapeRegex(key)})(?=[^A-Za-z0-9]|$)`, "gi");

const parseEyepieceFocalLengthMm = (focalLengthMm: string | undefined): number | undefined => {
  if (!focalLengthMm) {
    return undefined;
  }

  const parsed = Number.parseFloat(focalLengthMm.replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const hasParsedFocalLength = (
  item: { eyepiece: IEyepiece; focalLengthMm: number | undefined }
): item is { eyepiece: IEyepiece; focalLengthMm: number } => !!item.eyepiece.key && item.focalLengthMm !== undefined;

// Replaces cached eyepieces with reference data already loaded elsewhere in the application.
export const replaceEyepiecesCache = (eyepieces: IEyepiece[]): void => {
  eyepiecesCacheVersion++;
  eyepiecesCache = [...eyepieces];
  eyepiecesPromise = null;
};

// Invalidates cached data before eyepiece CRUD so an immediately opened observation cannot use stale values.
export const invalidateEyepiecesCache = (): void => {
  eyepiecesCacheVersion++;
  eyepiecesCache = null;
  eyepiecesPromise = null;
};

// Shares one in-flight API request while allowing invalidation and retry after a transient failure.
export const getEyepiecesCached = async (): Promise<IEyepiece[]> => {
  if (eyepiecesCache) {
    return eyepiecesCache;
  }

  if (!eyepiecesPromise) {
    const requestVersion = eyepiecesCacheVersion;
    eyepiecesPromise = Api.getEyepieces()
      .then(response => {
        if (requestVersion !== eyepiecesCacheVersion) {
          return getEyepiecesCached();
        }

        replaceEyepiecesCache(response.data || []);
        return eyepiecesCache || [];
      })
      .catch(() => {
        if (requestVersion !== eyepiecesCacheVersion) {
          return getEyepiecesCached();
        }

        eyepiecesPromise = null;
        return [];
      });
  }

  return eyepiecesPromise;
};

// Annotates matched eyepiece keys with optical values for the observation instrument.
export const renderReportTextAnnotated = (
  text: string,
  instrument: IInstrument | undefined,
  eyepieces: IEyepiece[]
): React.ReactNode => {
  if (!text || !instrument?.focalLengthMm || instrument.focalLengthMm <= 0 || eyepieces.length === 0) {
    return text;
  }
  const instrumentFocalLengthMm = instrument.focalLengthMm;

  const relevantEyepieces = eyepieces
    .map(eyepiece => ({
      eyepiece,
      focalLengthMm: parseEyepieceFocalLengthMm(eyepiece.focalLengthMm),
    }))
    .filter(hasParsedFocalLength);
  if (relevantEyepieces.length === 0) {
    return text;
  }

  const matches: Array<{
    start: number;
    end: number;
    fullText: string;
    annotationText: string;
  }> = [];

  relevantEyepieces.forEach(({ eyepiece, focalLengthMm }) => {
    const regex = buildKeyRegex(eyepiece.key);
    let match = regex.exec(text);
    while (match) {
      const prefix = match[1] || "";
      const keyMatch = match[2] || "";
      const keyStart = (match.index || 0) + prefix.length;
      const keyEnd = keyStart + keyMatch.length;
      matches.push({
        start: keyStart,
        end: keyEnd,
        fullText: keyMatch,
        annotationText: getEyepieceAnnotationText(instrumentFocalLengthMm, focalLengthMm, instrument.diameterMm),
      });
      match = regex.exec(text);
    }
  });

  if (matches.length === 0) {
    return text;
  }

  matches.sort((a, b) => {
    if (a.start !== b.start) {
      return a.start - b.start;
    }

    return b.end - a.end;
  });

  const nonOverlappingMatches: typeof matches = [];
  let lastEnd = -1;
  matches.forEach(match => {
    if (match.start >= lastEnd) {
      nonOverlappingMatches.push(match);
      lastEnd = match.end;
    }
  });

  const resultNodes: React.ReactNode[] = [];
  let cursor = 0;

  nonOverlappingMatches.forEach((match, index) => {
    if (cursor < match.start) {
      resultNodes.push(text.slice(cursor, match.start));
    }

    resultNodes.push(match.fullText);
    resultNodes.push(" ");
    resultNodes.push(
      <span
        key={`${match.start}-${match.end}-${index}`}
        style={{
          backgroundColor: "var(--obstool-inline-annotation-bg)",
          textDecoration: "underline",
          textDecorationStyle: "dotted",
          textUnderlineOffset: "0.2em",
        }}
      >
        ({match.annotationText})
      </span>
    );

    cursor = match.end;
  });

  if (cursor < text.length) {
    resultNodes.push(text.slice(cursor));
  }

  return resultNodes;
};
