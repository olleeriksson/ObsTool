import * as React from "react";
import { IDso } from "../types/Types";
import Typography from "@mui/material/Typography";

interface IDsoTitleProps {
  dso: IDso;
  nonDetection?: boolean;
}

/*
  This component is used to render the title for a DSO in search results and observation cards.
  Ex: <GxIcon> M31 (NGC 224) - Andromeda Galaxy
  It's wrapped in a DsoCard component to show the number of observations for each DSO in the
  search results dropdown.
 */
const DsoTitle = (props: IDsoTitleProps) => {
  const otherNames = props.dso.otherNames && props.dso.otherNames.trim() !== "" && "(" + props.dso.otherNames + ")";
  const commonName = props.dso.commonName && (" - " + props.dso.commonName);

  return (
    <Typography variant="body1">
      <span style={props.nonDetection ? { textDecoration: "line-through" } : undefined}>
        {props.dso.name} {otherNames} {commonName}
      </span>
    </Typography>
  );
};

export default DsoTitle;
