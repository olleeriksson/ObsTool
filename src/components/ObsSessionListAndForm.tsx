import * as React from "react";
import axios from "axios";
import ObsSessionList from "./ObsSessionList";
import ObsSessionForm from "./ObsSessionForm";
import { IObsSession } from "./Types";

// interface IServerResponse {
//   data: IObsSession[];
// }

export interface IObsSessionListAndFormState {
  isLoading: boolean;
  isError: boolean;
  selectedObsSessionId?: number;
  obsSessions?: IObsSession[];
}

class ObsSessionListAndForm extends React.Component<{}, IObsSessionListAndFormState> {
  constructor(props: any) {
    super(props);
    this.state = {
      isLoading: true,
      isError: false,
      selectedObsSessionId: undefined,
      obsSessions: undefined,
    };

    this.onSelectObsSession = this.onSelectObsSession.bind(this);
    this.onSaveObsSession = this.onSaveObsSession.bind(this);
  }

  public componentDidMount() {
    axios.get<IObsSession[]>("http://localhost:50995/api/obsSessions/").then(
      (response) => {
        const { data } = response;
        console.log(data);
        this.setState({ obsSessions: data });
      },
      () => {
        this.setState({ isError: true });
      });
  }

  public onSaveObsSession(obsSession: IObsSession) {
    console.log("Saving observation:");
    console.log(obsSession);

    const newObsSessions = this.state.obsSessions || [];
    newObsSessions.push(obsSession);
    this.setState((prevState, props) => ({
      obsSessions: newObsSessions
    }));
  }

  public onSelectObsSession(obsSessionId: number) {
    if (this.state.obsSessions) {
      const selectedObsSession = this.state.obsSessions.find(s => s.id === obsSessionId);
      if (selectedObsSession) {
        this.setState({ selectedObsSessionId: selectedObsSession.id });
        console.log("Selected a new obs session with id " + selectedObsSession.id);
      }
      console.log("Clicked on obs session " + obsSessionId);
    }
  }

  public render() {
    return (
      <div>
        <p>Observations:</p>
        <ObsSessionList obsSessions={this.state.obsSessions || []} onSelectObsSession={this.onSelectObsSession} />
        <ObsSessionForm obsSessionId={this.state.selectedObsSessionId} onSaveObservation={this.onSaveObsSession} />
      </div>
    );
  }
}

export default ObsSessionListAndForm;
