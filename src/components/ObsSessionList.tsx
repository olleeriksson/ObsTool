import * as React from "react";
import ObsSessionCard from "./ObsSessionCard";
import { IObsSession } from "../types/Types";
import Typography from "@material-ui/core/Typography";

export interface IObsSessionListProps {
  obsSessions: ReadonlyArray<IObsSession>;
  onSelectObsSession: (obsSessionId: number) => void;
}

class ObsSessionList extends React.Component<IObsSessionListProps> {
  constructor(props: IObsSessionListProps) {
    super(props);

    this.onSelectObsSessionCard = this.onSelectObsSessionCard.bind(this);
  }

  private onSelectObsSessionCard(obsSessionId: number) {
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

        const obsSessionsModifiable = [...this.props.obsSessions];
        const obsSessions = obsSessionsModifiable
          .sort(this.sortByDate)
          .map(o => (
            <ObsSessionCard key={o.id} onSelectObsSessionCard={this.onSelectObsSessionCard} obsSession={o} />
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
