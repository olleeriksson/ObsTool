import * as React from "react";
import { IObservation } from "../types/Types";
import "./ObservationList.css";
import Observation from "./Observation";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";

export interface IObservationListProps {
  observations: IObservation[];
  onSelectObservation: (observationId: number) => void;
}

class ObservationList extends React.Component<IObservationListProps> {
  constructor(props: IObservationListProps) {
    super(props);
  }

  private onSelectObsSessionCard(obsSessionId: number) {
    console.log("Clicked on ObsSessionCard");
    this.props.onSelectObservation(obsSessionId);
  }

  public render() {
    const observations = this.props.observations.map(observation => {
      return (
        <Grid item={true} key={observation.id}>
          <Observation
            key={observation.id}
            observation={observation}
            onSelectObservation={this.onSelectObsSessionCard}
          />
        </Grid>
      );
    });

    if (this.props.observations) {
      if (this.props.observations.length > 0) {
        return <div className="observationList">
          <Grid container={true} direction="column" spacing={8}>
            {observations}
          </Grid>
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
