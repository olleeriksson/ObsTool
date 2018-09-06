import * as React from "react";
import { IDso } from "../types/Types";
import Typography from "@material-ui/core/Typography";
import CosmosIcon from "../cosmos.svg";

interface IDsoLabelProps {
  dso: IDso;
}

const DsoLabel = (props: IDsoLabelProps) => {
  const otherNames = props.dso.otherNames && props.dso.otherNames.trim() !== "" && "(" + props.dso.otherNames + ")";
  const commonName = props.dso.commonName && (" - " + props.dso.commonName);

  return (
    <Typography variant="body1">
      <img src={CosmosIcon} width="20" height="20" style={{ marginRight: 5 }} /> {props.dso.name} {otherNames} {commonName}
    </Typography>
  );
};

export default DsoLabel;
