import * as React from "react";
import CircularProgress from "@material-ui/core/CircularProgress";
import axios from "axios";
import { IDso } from "./Types";
import Typography from "@material-ui/core/Typography";

export interface IDsoShortProps {
  id?: number;
  name?: string;
  error?: string;
  dso?: IDso;
}

export interface IDsoShortState {
  isMounted: boolean;
  isLoading: boolean;
  isError: boolean;
  dso?: IDso;
}

interface IServerResponse {
  data: IDso;
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
    } else {
      if (this.props.id === -1 || this.props.name === "") {
        this.setState({ isLoading: false });
        this.setState({ isError: true });
      } else {
        if (this.props.id) {
          axios.get<IDso>("http://localhost:50995/api/dso/" + this.props.id).then((response) => {
            const { data } = response;
            console.log(response);
            if (this.state.isMounted) {
              this.setState({ isLoading: false });
              this.setState({ isError: false });
              this.setState({ dso: data });
            }
          });
        } else if (this.props.name) {
          axios.request<IDso>({
            url: "http://localhost:50995/api/dso?name=" + this.props.name,
            transformResponse: (r: IServerResponse) => r.data
          }).then((response) => {
            const { data } = response;
            console.log(response);
            if (this.state.isMounted) {
              this.setState({ isLoading: false });
              this.setState({ isError: false });
              this.setState({ dso: data });
            }
          });
        } else {
          this.setState({ isLoading: false });
          this.setState({ isError: true });
        }
      }
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
            <Typography variant="body1">
              {this.state.dso.name}
            </Typography>
            <Typography color="textSecondary" variant="caption" gutterBottom={true}>
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
