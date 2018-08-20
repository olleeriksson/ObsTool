import * as React from "react";
import { withStyles } from "@material-ui/core/styles";
import { WithStyles, createStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles/createMuiTheme";
import Table from "@material-ui/core/Table";
import CircularProgress from "@material-ui/core/CircularProgress";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import axios from "axios";
import { IStatistics } from "./Types";

const styles = (theme: Theme) => createStyles({
    root: {
        marginTop: theme.spacing.unit * 3,
        overflowX: "auto",
    },
    table: {
        minWidth: "500",
        padding: "Table"
    },
});

export interface IStatisticsTableProps extends WithStyles<typeof styles> {
}

export interface IStatisticsTableState {
    isLoading: boolean;
    isError: boolean;
    statistics?: IStatistics;
}

class StatisticsTable extends React.Component<IStatisticsTableProps, IStatisticsTableState> {
    constructor(props: IStatisticsTableProps) {
        super(props);

        this.state = {
            isLoading: true,
            isError: false,
            statistics: undefined,
        };
    }

    public componentDidMount() {
        this.loadData();
    }

    private loadData() {
        axios.get<IStatistics>("http://localhost:50995/api/statistics/").then(
            (response) => {
                const { data } = response;
                console.log(data);
                this.setState({ statistics: data });
                this.setState({ isLoading: false });
            },
            () => {
                this.setState({ isLoading: false });
                this.setState({ isError: true });
            }
        );
    }

    private addRow(id: number, text: string, value: number) {
        return {
            key: id++,
            text: text,
            value: value
        };
    }

    private createRowsData(statistics?: IStatistics) {
        const id = 0;
        const rowsData = [];
        if (statistics) {
            rowsData.push(this.addRow(id, "Number of observation sessions", statistics.numObsSessions));
            rowsData.push(this.addRow(id, "Number of observations", statistics.numObservations));
            rowsData.push(this.addRow(id, "Number of observed objects", statistics.numObservedObjects));
            rowsData.push(this.addRow(id, "Number of recorded locations", statistics.numLocations));
        }
        return rowsData;
    }

    public render() {
        const { classes } = this.props;

        const rowsData = this.state.isLoading ? [] : this.createRowsData(this.state.statistics);
        const tableRows = rowsData.map(row => {
            return (
                <TableRow key={row.key}>
                    <TableCell padding="dense" component="th" scope="row">{row.text}</TableCell>
                    <TableCell padding="dense" numeric={true}>{row.value}</TableCell>
                </TableRow>
            );
        });

        if (this.state.isLoading) {
            return (
                <div>
                    <CircularProgress />Loading DSO object
              </div>
            );
        } else if (this.state.isError) {
            return (
                <p><strong>Error!</strong></p>
            );
        } else {
            return (
                <Paper className={classes.root}>
                    <Table className={classes.table} >
                        <TableHead>
                            <TableRow>
                                <TableCell padding="dense">Statistics</TableCell>
                                <TableCell padding="dense" numeric={true} />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tableRows}
                        </TableBody>
                    </Table>
                </Paper>
            );
        }
    }
}

export default withStyles(styles)(StatisticsTable);
