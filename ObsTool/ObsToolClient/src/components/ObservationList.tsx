import * as React from "react";
import { IObservation } from "../types/Types";
import "./ObservationList.css";
import Observation from "./Observation";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid2";

export interface IObservationListProps {
  observations: IObservation[];
  onSelectObservation: (observationId: number) => void;
  onBackToForm: () => void;
  allowEditing: boolean;
}

class ObservationList extends React.Component<IObservationListProps> {
  constructor(props: IObservationListProps) {
    super(props);
  }

  private onSelectObsSessionCard(obsSessionId: number) {
    console.log("Clicked on ObsSessionCard");
    this.props.onSelectObservation(obsSessionId);
  }

  private sortByDisplayOrder = (observationA: IObservation, observationB: IObservation) => {
    return (observationA.displayOrder || 0) - (observationB.displayOrder || 0);
  }

  public render() {
    const observations = this.props.observations
      .sort(this.sortByDisplayOrder)
      .map((observation, observationIndex) => {
        return (
          <Grid key={observation.id ?? `observation-${observationIndex}`}>
            <Observation
              observation={observation}
              observationIndex={observationIndex}
              onSelectObservation={this.onSelectObsSessionCard}
              onBackToForm={this.props.onBackToForm}
              allowEditing={this.props.allowEditing}
            />
          </Grid>
        );
      });

    if (this.props.observations) {
      if (this.props.observations.length > 0) {
        return <div className="observationList">
          <Grid container direction="column" spacing={1}>
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
