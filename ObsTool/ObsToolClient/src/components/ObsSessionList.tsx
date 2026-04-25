import * as React from "react";
import ObsSessionCard from "./ObsSessionCard";
import { IObsSession } from "../types/Types";
import Typography from "@mui/material/Typography";
import Pagination from "@mui/material/Pagination";

export interface IObsSessionListProps {
  obsSessions: ReadonlyArray<IObsSession>;
  onSelectObsSession: (obsSessionId: number) => void;
}

export interface IObsSessionListState {
  currentPage: number;
  pageSize: number;
}

class ObsSessionList extends React.Component<IObsSessionListProps, IObsSessionListState> {
  private static DEFAULT_PAGE_SIZE = 6;

  constructor(props: IObsSessionListProps) {
    super(props);

    this.state = {
      currentPage: 1,
      pageSize: ObsSessionList.DEFAULT_PAGE_SIZE
    };

    this.onSelectObsSessionCard = this.onSelectObsSessionCard.bind(this);
  }

  private onSelectObsSessionCard(obsSessionId: number) {
    this.props.onSelectObsSession(obsSessionId);
  }

  private onPaginationChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    this.setState({ currentPage: page });
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
          .slice((this.state.currentPage - 1) * this.state.pageSize, this.state.currentPage * this.state.pageSize)  // this is where the actual pagination takes place
          .map(o => (
            <ObsSessionCard key={o.id} onSelectObsSessionCard={this.onSelectObsSessionCard} obsSession={o} />
          ));

        const paginator = <Pagination
          page={this.state.currentPage}
          count={Math.ceil((this.props.obsSessions.length || 0) / this.state.pageSize)}
          onChange={this.onPaginationChange}
        />;

        return (
          <>
            {paginator}
            <div className="obsSessionList">
              {obsSessions}
            </div>
            {paginator}
          </>
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
