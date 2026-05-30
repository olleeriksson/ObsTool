import * as React from "react";
import CircularProgress from "@mui/material/CircularProgress";
import { IDso } from "../types/Types";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import { DsoTypeIcon } from "./DsoTypeIcon";
import { getDsoTypeAbbreviation } from "../utils/objectTypes";

export interface IDsoShortProps {
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

export default class DsoShort extends React.Component<IDsoShortProps, IDsoShortState> {
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
              <span style={{ alignItems: "center", display: "inline-flex", gap: 4 }}>
                {typeAbbreviation && <DsoTypeIcon type={this.state.dso.type} size={22} />}
                <span>{[typeAbbreviation, this.state.dso.con].filter(Boolean).join(", ")}</span>
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
