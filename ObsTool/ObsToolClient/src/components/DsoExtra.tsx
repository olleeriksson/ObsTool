import * as React from "react";
import { IDso } from "../types/Types";
import Typography from "@mui/material/Typography";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import { withStyles, createStyles } from "src/muiCompat";
import type { Theme } from "@mui/material/styles";
import type { WithStyles } from "src/muiCompat";
import * as obsToolUtils from "../obsToolUtils";
import GoogleImagesLink from "./GoogleImagesLink";
import AladinLiteLink from "./AladinLiteLink";
import ConstellationMap from "./ConstellationMap";
import { IConstellationMapObject } from "../types/Types";

export interface IDsoExtraProps extends WithStyles<typeof styles> {
  id?: number;
  customObjectName?: string;
  error?: string;
  dso?: IDso;
}

const styles = (theme: Theme) => createStyles({
  dsoExtra: {
    marginLeft: theme.spacing(0),
    marginTop: theme.spacing(0.5),
    lineHeight: "1em",
  },
  mapLink: {
    cursor: "pointer",
    textDecoration: "underline",
  },
  mapDialogContent: {
    paddingTop: theme.spacing(1),
  },
});

interface IDsoExtraState {
  isMapDialogOpen: boolean;
}

class DsoExtra extends React.Component<IDsoExtraProps, IDsoExtraState> {
  constructor(props: IDsoExtraProps) {
    super(props);
    this.state = {
      isMapDialogOpen: false,
    };
  }

  private openMapDialog = () => this.setState({ isMapDialogOpen: true });

  private closeMapDialog = () => this.setState({ isMapDialogOpen: false });

  private toMapObject() {
    const dso = this.props.dso;
    if (!dso || !dso.ra || !dso.dec || !dso.con) {
      return null;
    }

    const mapObject: IConstellationMapObject = {
      dsoId: dso.id,
      id: dso.id,
      name: dso.name,
      catalog: dso.catalog,
      catalogNumber: dso.catalogNumber,
      constellation: dso.con,
      ra: dso.ra,
      dec: dso.dec,
    };
    return mapObject;
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

        const selectedObject = this.toMapObject();
        const canShowMap = selectedObject != null;
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
              {canShowMap && (
                <>
                  &nbsp;|&nbsp;
                  <span
                    className={classes.mapLink}
                    onClick={this.openMapDialog}
                  >
                    Constellation map
                  </span>
                </>
              )}
            </Typography>
            {canShowMap && selectedObject && (
              <Dialog
                open={this.state.isMapDialogOpen}
                onClose={this.closeMapDialog}
                fullWidth={true}
                maxWidth="sm"
                PaperProps={{ style: { width: "92vw", maxWidth: 760 } }}
              >
                <DialogTitle>{`Constellation map (${selectedObject.name})`}</DialogTitle>
                <DialogContent className={classes.mapDialogContent}>
                  <ConstellationMap
                    constellation={selectedObject.constellation || ""}
                    constellationName={selectedObject.constellation}
                    objects={[]}
                    highlightedObjects={[selectedObject]}
                    maxNumLabels={1}
                    labelMode="sac"
                    width="100%"
                    height={500}
                    showControls={false}
                    allowZoom={true}
                  />
                </DialogContent>
              </Dialog>
            )}
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

export default withStyles(styles)(DsoExtra);
