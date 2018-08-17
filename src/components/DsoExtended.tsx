import * as React from "react";
import CircularProgress from "@material-ui/core/CircularProgress";
import axios from "axios";
import { IDso } from "./Types";

export interface IDsoExtendedProps {
  id?: number;
  name?: string;
}

export interface IDsoExtendedState {
  isLoading: boolean;
  isError: boolean;
  dso?: IDso;
}

interface IServerResponse {
  data: IDso;
}

class DsoExtended extends React.Component<IDsoExtendedProps, IDsoExtendedState> {
  constructor(props: IDsoExtendedProps) {
    super(props);

    this.state = {
      isLoading: true,
      isError: false,
      dso: undefined,
    };
  }

  public componentDidMount() {
    if (this.props.id) {
      axios.request<IDso>({
        url: "http://localhost:50995/api/dso/" + this.props.id,
        transformResponse: (r: IServerResponse) => r.data
      }).then((response) => {
        const { data } = response;
        console.log(response);
        this.setState({ isLoading: false });
        this.setState({ dso: data });
      });
    } else {
      axios.request<IDso>({
        url: "http://localhost:50995/api/dso?name=" + this.props.name,
        transformResponse: (r: IServerResponse) => r.data
      }).then((response) => {
        const { data } = response;
        console.log(response);
        this.setState({ isLoading: false });
        this.setState({ dso: data });
      });
    }
  }

  public render() {
    if (this.state.isLoading) {
      return (
        <div>
          <CircularProgress /> Loading DSO object
        </div>
      );
    } else if (this.state.isError) {
      return (
        <p><strong>Error!</strong></p>
      );
    } else {
      if (this.state.dso) {
        return (
          <div className="dsoExtended">
            <strong>{this.state.dso.name}</strong>
            ({this.state.dso.otherNames})
            Type: {this.state.dso.type},
            Constellation: {this.state.dso.con}
          </div>
        );
      } else {
        return (
          <div className="dsoExtended">
            Unable to load DSO object!
          </div>
        );
      }
    }
  }
}

export default DsoExtended;
