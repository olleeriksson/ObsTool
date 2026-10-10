import * as React from "react";
import { withStyles, createStyles } from "src/muiCompat";
import type { WithStyles } from "src/muiCompat";
import type { Theme } from "@mui/material/styles";
import CircularProgress from "@mui/material/CircularProgress";
import { IDso } from "../types/Types";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import Tooltip from "@mui/material/Tooltip";
import { DsoTypeIcon } from "./DsoTypeIcon";
import { getDsoTypeAbbreviation } from "../utils/objectTypes";

// Keep the catalog labels readable beside the muted constellation metadata.
const styles = (theme: Theme) => createStyles({
  // Align the icon to the first text line and reserve its size as metadata wraps.
  metadata: {
    alignItems: "flex-start",
    display: "inline-flex",
    gap: 4,
  },
  objectIcon: {
    flex: "0 0 22px",
    width: 22,
    height: 22,
  },
  metadataText: {
    minWidth: 0,
  },
  herschel: {
    color: theme.palette.mode === "dark" ? "#81c784" : "#2e7d32",
    fontWeight: 700,
  },
  herschel400: {
    color: theme.palette.mode === "dark" ? "#64a8e8" : "#1976d2",
    fontWeight: 700,
  },
});

export interface IDsoShortProps extends WithStyles<typeof styles> {
  id?: number;
  error?: string;
  dso?: IDso;
  nonDetection?: boolean;
  onNameClick?: () => void;
}

export interface IDsoShortState {
  isMounted: boolean;
  isLoading: boolean;
  isError: boolean;
  dso?: IDso;
}

class DsoShort extends React.Component<IDsoShortProps, IDsoShortState> {
  constructor(props: IDsoShortProps) {
    super(props);

    this.state = {
      isMounted: true,
      isLoading: true,
      isError: false,
      dso: undefined,
    };
  }

  public componentDidMount() {
    // If the object is provided, don't load anything.
    if (this.props.dso) {
      this.setState({ isLoading: false });
      this.setState({ isError: false });
      this.setState({ dso: this.props.dso });
    }
  }

  public render() {
    if (this.props.error) {
      return (
        <Typography color="error" gutterBottom={true}>
          {this.props.error}
        </Typography>
      );
    } else if (this.state.isLoading) {
      return (
        <Typography variant="caption" color="textSecondary" gutterBottom={true}>
          <CircularProgress />
        </Typography>
      );
    } else if (this.state.isError) {
      return (
        <Typography color="textSecondary" gutterBottom={true}>
          Error!
        </Typography>
      );
    } else {
        if (this.state.dso) {
          // H400 takes precedence when any Herschel entry belongs to that subset.
          const herschelObjects = this.state.dso.herschelObjects || [];
          const isH400 = herschelObjects.some(object => object.h400);
          const name = this.state.dso.name;
          const typeAbbreviation = getDsoTypeAbbreviation(this.state.dso.type || "") || this.state.dso.type;
          const nameStyle = this.props.nonDetection ? { textDecoration: "line-through" } : undefined;
        const nameTypography = (
          <Typography variant="body2" style={nameStyle}>
            {name}
          </Typography>
        );
        const nameContent = this.props.onNameClick ? (
          <Link
            component="button"
            onClick={this.props.onNameClick}
            underline="always"
            variant="body2"
            style={{ display: "block", fontWeight: 700, textAlign: "left", textDecoration: this.props.nonDetection ? "underline line-through" : undefined }}
            aria-label={`Show ${name} in observed objects`}
          >
            {name}
          </Link>
        ) : nameTypography;

        return (
          <div className="dsoShort">
            {nameContent}
            <Typography color="textSecondary" variant="caption" component={"div" as any} gutterBottom={false} style={this.props.nonDetection ? { textDecoration: "line-through" } : undefined}>
              <span className={this.props.classes.metadata}>
                {typeAbbreviation && <DsoTypeIcon className={this.props.classes.objectIcon} type={this.state.dso.type} size={22} />}
                <span className={this.props.classes.metadataText}>
                  {/* Separate all available metadata with commas while preserving the label tooltip. */}
                  {[
                    typeAbbreviation,
                    this.state.dso.con,
                    herschelObjects.length > 0 && (
                      <Tooltip key="herschel" title={isH400 ? "Herschel 400 object" : "Herschel object"} describeChild={true}>
                        <span className={isH400 ? this.props.classes.herschel400 : this.props.classes.herschel}>
                          {isH400 ? "H400" : "H2500"}
                        </span>
                      </Tooltip>
                    ),
                  ].filter(Boolean).map((item, index) => (
                    <React.Fragment key={index}>
                      {index > 0 && ", "}{item}
                    </React.Fragment>
                  ))}
                </span>
              </span>
            </Typography>
          </div>
        );
      } else {
        return (
          <Typography variant="caption" color="textSecondary" gutterBottom={true}>
            Unable to load!
          </Typography>
        );
      }
    }
  }
}

export default withStyles(styles)(DsoShort);
