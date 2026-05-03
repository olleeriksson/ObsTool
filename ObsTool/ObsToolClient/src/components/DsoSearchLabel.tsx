import * as React from "react";
import { IDso } from "../types/Types";
import Typography from "@mui/material/Typography";
import CosmosIcon from "../cosmos.svg";

interface IDsoSearchLabelProps {
  dso: IDso;
}

/*
  This component is used to render the label for a DSO in the search results dropdown. It's just a name basically.
  Ex: <GxIcon> M31 (NGC 224) - Andromeda Galaxy
  It's wrapped in a DsoBadgedWithObservations component to show the number of observations for each DSO in the
  search results dropdown.
 */
const DsoSearchLabel = (props: IDsoSearchLabelProps) => {
  const otherNames = props.dso.otherNames && props.dso.otherNames.trim() !== "" && "(" + props.dso.otherNames + ")";
  const commonName = props.dso.commonName && (" - " + props.dso.commonName);

  return (
    <Typography variant="body1">
      <img src={CosmosIcon} width="20" height="20" style={{ marginRight: 5, paddingTop: 0}} /> {props.dso.name} {otherNames} {commonName}
    </Typography>
  );
};

export default DsoSearchLabel;
