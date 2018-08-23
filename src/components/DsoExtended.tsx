import * as React from "react";
import CircularProgress from "@material-ui/core/CircularProgress";
import axios from "axios";
import { IDso } from "./Types";
import Typography from "@material-ui/core/Typography";

export interface IDsoExtendedProps {
  id?: number;
  name?: string;
  error?: string;
  dso?: IDso;
}

export interface IDsoExtendedState {
  isMounted: boolean;
  isLoading: boolean;
  isError: boolean;
  dso?: IDso;
}

interface IServerResponse {
  data: IDso;
}

export default class DsoExtended extends React.Component<IDsoExtendedProps, IDsoExtendedState> {
  constructor(props: IDsoExtendedProps) {
    super(props);
    this.state = {
      isMounted: false,
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
        <div>
          <CircularProgress />Loading DSO object
        </div>
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
          <div className="dsoExtended">
            <Typography variant="subheading">
              {this.state.dso.name} ({this.state.dso.otherNames})
            </Typography>
            <Typography color="textSecondary" gutterBottom={true}>
              <strong>Type:</strong> {this.state.dso.type}, <strong>Constellation:</strong> {this.state.dso.con}
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
