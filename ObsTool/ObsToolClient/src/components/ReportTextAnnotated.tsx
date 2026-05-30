import * as React from "react";
import Api from "../api/Api";
import { IEyepiece, IInstrument } from "../types/Types";

let eyepiecesCache: IEyepiece[] | null = null;
let eyepiecesPromise: Promise<IEyepiece[]> | null = null;

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getMagnificationText = (instrumentFocalLengthMm: number, eyepieceFocalLengthMm: number) => {
  const magnification = instrumentFocalLengthMm / eyepieceFocalLengthMm;
  return `${Math.round(magnification)}x`;
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

export const getEyepiecesCached = async (): Promise<IEyepiece[]> => {
  if (eyepiecesCache) {
    return eyepiecesCache;
  }

  if (!eyepiecesPromise) {
    eyepiecesPromise = Api.getEyepieces()
      .then(response => {
        eyepiecesCache = response.data || [];
        return eyepiecesCache;
      })
      .catch(() => []);
  }

  return eyepiecesPromise;
};

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
    magnificationText: string;
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
        magnificationText: getMagnificationText(instrumentFocalLengthMm, focalLengthMm),
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
        ({match.magnificationText})
      </span>
    );

    cursor = match.end;
  });

  if (cursor < text.length) {
    resultNodes.push(text.slice(cursor));
  }

  return resultNodes;
};
