import * as React from "react";
import CircularProgress from "@material-ui/core/CircularProgress";
import { IDso } from "../types/Types";
import Typography from "@material-ui/core/Typography";

export interface IDsoShortProps {
  id?: number;
  customObjectName?: string;
  error?: string;
  dso?: IDso;
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
        return (
          <div className="dsoShort">
            <Typography variant="body2">
              {this.state.dso.name === "custom" ? this.props.customObjectName : this.state.dso.name}
            </Typography>
            <Typography color="textSecondary" variant="caption" gutterBottom={false}>
              {this.state.dso.type}, {this.state.dso.con}
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
