import * as React from "react";
import ObsSessionCard from "./ObsSessionCard";
import { IObsSession } from "./Types";
import Typography from "@material-ui/core/Typography";

export interface IObsSessionListProps {
  obsSessions: IObsSession[];
  onSelectObsSession: (obsSessionId: number) => void;
}

class ObsSessionList extends React.Component<IObsSessionListProps> {
  constructor(props: IObsSessionListProps) {
    super(props);

    this.onSelectObsSessionCard = this.onSelectObsSessionCard.bind(this);
  }

  private onSelectObsSessionCard(obsSessionId: number) {
    console.log("Clicked on ObsSessionCard " + obsSessionId);
    this.props.onSelectObsSession(obsSessionId);
  }

  private sortByDate(obsSessionA: IObsSession, obsSessionB: IObsSession) {
    const dateA: any = new Date(obsSessionA.date || "");
    const dateB: any = new Date(obsSessionB.date || "");
    const idA: any = obsSessionA.id || 0;
    const idB: any = obsSessionB.id || 0;
    return dateB - dateA || idB - idA;
  }

  public render() {
    if (this.props.obsSessions) {
      if (this.props.obsSessions.length > 0) {

        const obsSessions = this.props.obsSessions
          .sort(this.sortByDate)
          .map(o => (
            <ObsSessionCard
              onSelectObsSessionCard={this.onSelectObsSessionCard}
              key={o.id}
              id={o.id || -1}
              title={o.title}
              date={o.date}
              summary={o.summary}
              conditions={o.conditions}
              seeing={o.seeing}
              transparency={o.transparency}
              lm={o.limitingMagnitude}
            />
          ));

        return (
          <div className="obsSessionList">
            {obsSessions}
          </div>
        );
      } else {
        return <Typography variant="caption" color="textSecondary" >
          No observation sessions!
        </Typography>;
      }
    } else {
      return <div>Unable to load observation session</div>;
    }
  }
}

export default ObsSessionList;
