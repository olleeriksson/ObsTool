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
        const commonName = this.state.dso.commonName && (" - " + this.state.dso.commonName);
        const sizeSeparator = this.state.dso.sizeMax && this.state.dso.sizeMax.trim() !== "" && this.state.dso.sizeMin && this.state.dso.sizeMin.trim() !== "" && " - ";

        return (
          <div className="dsoExtended">
            <Typography variant="subheading">
              {this.state.dso.name} ({this.state.dso.otherNames}) {commonName}
            </Typography>
            <Typography color="textSecondary" gutterBottom={true}>
              <strong>Type:</strong> {this.state.dso.type} &nbsp;
              <strong>Const:</strong> {this.state.dso.con} &nbsp;
              <strong>Mag:</strong> {this.state.dso.mag} &nbsp;
              <strong>SB:</strong> {this.state.dso.sb} &nbsp;
              <strong>Class:</strong> {this.state.dso.class} &nbsp;
              <strong>Dreyer:</strong> {this.state.dso.dreyerDesc} &nbsp;
              <strong>Size:</strong> {this.state.dso.sizeMax} {sizeSeparator} {this.state.dso.sizeMin} &nbsp;
              <strong>Notes:</strong> {this.state.dso.notes} &nbsp;
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
