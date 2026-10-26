// Standard IAU casing includes internal capitals that title casing would lose.
const abbreviations = new Map(
  (`And Ant Aps Aqr Aql Ara Ari Aur Boo Cae Cam Cnc CVn CMa CMi Cap Car Cas Cen Cep Cet Cha
    Cir Col Com CrA CrB Crv Crt Cru Cyg Del Dor Dra Equ Eri For Gem Gru Her Hor Hya Hyi Ind
    Lac Leo LMi Lep Lib Lup Lyn Lyr Men Mic Mon Mus Nor Oct Oph Ori Pav Peg Per Phe Pic Psc
    PsA Pup Pyx Ret Sge Sgr Sco Scl Sct Ser Sex Tau Tel Tri TrA Tuc UMa UMi Vel Vir Vol Vul`)
    .split(/\s+/)
    .map(abbreviation => [abbreviation.toUpperCase(), abbreviation])
);

// Normalize known constellation abbreviations without changing unrecognized text.
export function formatConstellationAbbreviation(value?: string | null): string {
  const abbreviation = (value || "").trim();
  return abbreviations.get(abbreviation.toUpperCase()) || abbreviation;
}
