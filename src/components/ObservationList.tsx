import * as React from "react";
import { IObservation } from "./Types";
import "./ObservationList.css";
import Observation from "./Observation";
import Typography from "@material-ui/core/Typography";

export interface IObservationListProps {
  observations: IObservation[];
  onSelectObservation: (observationId: number) => void;
}

class ObservationList extends React.Component<IObservationListProps> {
  constructor(props: IObservationListProps) {
    super(props);
  }

  private onSelectObsSessionPreview(obsSessionId: number) {
    console.log("Clicked on ObsSessionPreview");
    this.props.onSelectObservation(obsSessionId);
  }

  public render() {
    const observations = this.props.observations.map(observation => {
      return (
        <Observation
          key={observation.id}
          observation={observation}
          onSelectObservation={this.onSelectObsSessionPreview}
        />
      );
    });

    if (this.props.observations) {
      if (this.props.observations.length > 0) {
        return <div className="observationList">
          {observations}
        </div>;
      } else {
        return <div className="observationList">
          <Typography variant="caption">
            No observations...
          </Typography>
        </div>;
      }
    } else {
      return <div className="observationList">
        <Typography variant="caption">
          Unable to load observation session!
        </Typography>
      </div>;
    }
  }
}

export default ObservationList;
