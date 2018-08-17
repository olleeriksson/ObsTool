import * as React from "react";
import "./Observation.css";

export interface IObservationProps {
  observationId: number;
  observation: IObservationState;
}

export interface IObservationState {
  id: number;
  dsoId: number;
  text: string;
}

class Observation extends React.Component<IObservationProps, IObservationState> {
  constructor(props: IObservationProps) {
    super(props);

    this.state = {
      id: -1,
      dsoId: -1,
      text: ""
    };
  }

  public componentDidMount() {
  }

  public render() {
    return (
      <div className="observation">
        <div><strong>Text:</strong> {this.state.text}</div>
      </div>
    );
  }
}

export default Observation;
