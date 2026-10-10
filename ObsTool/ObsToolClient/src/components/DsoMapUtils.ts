import { IDso, IConstellationMapObject } from "../types/Types";

// Use the same catalog identity and coordinates for dialog and hover maps.
export function toDsoMapObject(dso?: IDso): IConstellationMapObject | null {
  if (!dso?.ra || !dso.dec || !dso.con) {
    return null;
  }

  return {
    dsoId: dso.objectKind === undefined || dso.objectKind === "Sac" ? dso.id : undefined,
    id: dso.objectKey || dso.id,
    name: dso.name,
    catalog: dso.catalog,
    catalogNumber: dso.catalogNumber,
    constellation: dso.con,
    ra: dso.ra,
    dec: dso.dec,
  };
}
