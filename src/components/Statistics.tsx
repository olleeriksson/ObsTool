import * as React from "react";

export interface IStatisticsProps {
    foo?: number;
}

export interface IStatisticsState {
    foo?: number;
}

class Statistics extends React.Component<IStatisticsProps, IStatisticsState>() {
    constructor(props: IStatisticsProps) {
        super(props);
    }

    public render() {
        return (
            <div>Hello</div>
        );
    }
}

export default Statistics;
