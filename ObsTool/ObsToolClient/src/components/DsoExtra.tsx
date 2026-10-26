import * as React from "react";
import { formatConstellationAbbreviation } from "../utils/constellations";
import { IDso } from "../types/Types";
import IconButton from "@mui/material/IconButton";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Typography from "@mui/material/Typography";
import { withStyles, createStyles } from "src/muiCompat";
import type { Theme } from "@mui/material/styles";
import type { WithStyles } from "src/muiCompat";
import * as objectTypes from "../utils/objectTypes";
import GoogleImagesLink from "./GoogleImagesLink";
import AladinLiteLink from "./AladinLiteLink";
import DsoMapDialog from "./DsoMapDialog";
import { toDsoMapObject } from "./DsoMapUtils";

export interface IDsoExtraProps extends WithStyles<typeof styles> {
  compactOnMobile?: boolean;
  id?: number;
  error?: string;
  dso?: IDso;
}

const styles = (theme: Theme) => createStyles({
  // Only observation cards collapse metadata; resource links remain visible.
  compact: {
    [theme.breakpoints.down("sm")]: {
      "& .dso-details": { display: "none" },
      "& .dso-details.expanded": { display: "block" },
      "& .dso-links": { display: "block" },
      "& .dso-separator": { display: "none" },
      "& .dso-details-toggle": { display: "inline-flex" },
    },
  },
  detailsToggle: {
    display: "none",
    padding: 4,
    verticalAlign: "middle",
  },
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
  isDetailsExpanded: boolean;
}

class DsoExtra extends React.Component<IDsoExtraProps, IDsoExtraState> {
  constructor(props: IDsoExtraProps) {
    super(props);
    this.state = {
      isMapDialogOpen: false,
      isDetailsExpanded: false,
    };
  }

  // Toggle catalog metadata independently of the always-visible resource links.
  private toggleDetails = () => this.setState(state => ({ isDetailsExpanded: !state.isDetailsExpanded }));

  private openMapDialog = () => this.setState({ isMapDialogOpen: true });

  private closeMapDialog = () => this.setState({ isMapDialogOpen: false });

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
        // Prepare a search terms for Google image search
        const translatedDsoType = objectTypes.translateDsoType(this.props.dso.type || "");
        const dsoTypeAbbreviation = objectTypes.getDsoTypeAbbreviation(this.props.dso.type || "") || this.props.dso.type;
        const searchTerms = [this.props.dso.name || "", translatedDsoType || ""];

        const selectedObject = toDsoMapObject(this.props.dso);
        const canShowMap = selectedObject != null;
        const detailItems = [
          { label: "Type", value: dsoTypeAbbreviation },
          { label: "Const", value: formatConstellationAbbreviation(this.props.dso.con) },
          { label: "Mag", value: this.props.dso.mag },
          { label: "SB", value: this.props.dso.sb },
          { label: "Class", value: this.props.dso.class },
          { label: "Dreyer", value: this.props.dso.dreyerDesc },
          { label: "Size", value: [this.props.dso.sizeMax, this.props.dso.sizeMin].filter(Boolean).join(" - ") },
          { label: "Notes", value: this.props.dso.notes },
        ].filter(item => item.value && `${item.value}`.trim() !== "");

        return (
          <div className={`${classes.dsoExtra} ${this.props.compactOnMobile ? classes.compact : ""}`}>
            <Typography variant="caption" color="textSecondary" gutterBottom={true}>
              <span className={`dso-details ${this.state.isDetailsExpanded ? "expanded" : ""}`}>
                {detailItems.map(item => (
                  <React.Fragment key={item.label}>
                    <strong>{item.label}:</strong> {item.value} &nbsp;
                  </React.Fragment>
                ))}
              </span>
              {detailItems.length > 0 && <span className="dso-separator">|&nbsp;</span>}
              <span className="dso-links">
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
                {this.props.compactOnMobile && detailItems.length > 0 && (
                  <IconButton
                    className={`${classes.detailsToggle} dso-details-toggle`}
                    onClick={this.toggleDetails}
                    aria-label={this.state.isDetailsExpanded ? "Hide object details" : "Show object details"}
                    aria-expanded={this.state.isDetailsExpanded}
                    size="small"
                  >
                    <ExpandMoreIcon style={{ transform: this.state.isDetailsExpanded ? "rotate(180deg)" : undefined }} />
                  </IconButton>
                )}
              </span>
            </Typography>
            {canShowMap && selectedObject && (
              <DsoMapDialog
                selectedObject={selectedObject}
                open={this.state.isMapDialogOpen}
                onClose={this.closeMapDialog}
                contentClassName={classes.mapDialogContent}
              />
            )}
          </div>
        );
      } else {
        return (
          <Typography color="textSecondary" gutterBottom={true}>
            Unable to load object!
          </Typography>
        );
      }
    }
  }
}

export default withStyles(styles)(DsoExtra);
