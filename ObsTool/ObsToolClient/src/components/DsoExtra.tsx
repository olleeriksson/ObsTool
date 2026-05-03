import * as React from "react";
import { IDso } from "../types/Types";
import Typography from "@mui/material/Typography";
import CosmosIcon from "../cosmos.svg";
import { withStyles, createStyles } from "src/muiCompat";
import type { Theme } from "@mui/material/styles";
import type { WithStyles } from "src/muiCompat";
import * as obsToolUtils from "../obsToolUtils";
import GoogleImagesLink from "./GoogleImagesLink";
import AladinLiteLink from "./AladinLiteLink";

export interface IDsoExtendedProps extends WithStyles<typeof styles> {
  id?: number;
  customObjectName?: string;
  error?: string;
  dso?: IDso;
}

const styles = (theme: Theme) => createStyles({
  dsoExtra: {
    marginLeft: theme.spacing(3),
    marginTop: theme.spacing(0.5),
    lineHeight: "1em",
  },
});

class DsoExtended extends React.Component<IDsoExtendedProps> {
  constructor(props: IDsoExtendedProps) {
    super(props);
  }

  public componentDidMount() {
  }

  public render() {
    const { classes } = this.props;

    if (this.props.error) {
      return (
        <Typography color="error" gutterBottom={true}>
          {this.props.error}
        </Typography>
      );
    } else {
      if (this.props.dso) {
        const sizeSeparator = this.props.dso.sizeMax && this.props.dso.sizeMax.trim() !== "" && this.props.dso.sizeMin && this.props.dso.sizeMin.trim() !== "" && " - ";

        // Prepare a search terms for Google image search
        const translatedDsoType = obsToolUtils.translateDsoType(this.props.dso.type);
        const searchTerms = [this.props.dso.name || "", translatedDsoType || ""];

        return (
          <div className={classes.dsoExtra}>
            <Typography variant="caption" color="textSecondary" gutterBottom={true}>
              <strong>Type:</strong> {this.props.dso.type} &nbsp;
              <strong>Const:</strong> {this.props.dso.con} &nbsp;
              <strong>Mag:</strong> {this.props.dso.mag} &nbsp;
              <strong>SB:</strong> {this.props.dso.sb} &nbsp;
              <strong>Class:</strong> {this.props.dso.class} &nbsp;
              <strong>Dreyer:</strong> {this.props.dso.dreyerDesc} &nbsp;
              <strong>Size:</strong> {this.props.dso.sizeMax} {sizeSeparator} {this.props.dso.sizeMin} &nbsp;
              <strong>Notes:</strong> {this.props.dso.notes} &nbsp;|&nbsp;
              <GoogleImagesLink linkTitle="Google image search" searchTerms={searchTerms} />&nbsp;|&nbsp;
              <AladinLiteLink linkTitle="Aladin Lite" searchTerm={this.props.dso.name} />
            </Typography>
          </div>
        );
      } else {
        return (
          <Typography color="textSecondary" gutterBottom={true}>
            Unable to load DSO object!
          </Typography>
        );
      }
    }
  }
}

export default withStyles(styles)(DsoExtended);