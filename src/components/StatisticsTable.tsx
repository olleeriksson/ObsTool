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
import { IStatistics } from "../types/Types";
import Api from "../api/Api";

const styles = (theme: Theme) => createStyles({
    root: {
        marginTop: theme.spacing(3),
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
        Api.getStatistics().then(
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

    private addRow(id: number, text?: string, value?: string, text2?: string, value2?: string) {
        return {
            key: id,
            text: text,
            value: value,
            text2: text2,
            value2: value2
        };
    }

    private createRowsData(statistics?: IStatistics) {
        let id = 0;
        const rowsData = [];
        if (statistics) {
            rowsData.push(this.addRow(
                id++,
                "Number of observation sessions", statistics.numObsSessions.toString(),
                "Number of observed Galaxies", statistics.numObservedGalaxies.toString()));
            rowsData.push(this.addRow(
                id++,
                "Number of recorded observations", statistics.numObservations.toString(),
                "Number of observed Bright Nebulae", statistics.numObservedBrightNebulae.toString()));
            rowsData.push(this.addRow(
                id++,
                "Number of observed objects", statistics.numObservedObjects.toString(),
                "Number of observed Open Clusters", statistics.numObservedOpenClusters.toString()));
            rowsData.push(this.addRow(
                id++,
                "Number of detections (non-detections)", statistics.numDetections + " (" + statistics.numNonDetections + ")",
                "Number of observed Planetary Nebulae", statistics.numObservedPlanetaryNebulae.toString()));
            rowsData.push(this.addRow(
                id++,
                "Number of recorded sketches", statistics.numSketches.toString(),
                "Number of observed Globular Clusters", statistics.numObservedGlobularClusters.toString()));
            rowsData.push(this.addRow(
                id++,
                "Number of used locations", statistics.numLocations.toString(),
                "Number of observed Dark Nebulae", statistics.numObservedDarkNebulae.toString()));
            rowsData.push(this.addRow(
                id++,
                "Number of observed Messier objects", statistics.numObservedMessierObjects + " / 110",
                "Number of observed NGC objects", statistics.numObservedNGCObjects.toString()));
        }
        return rowsData;
    }

    public render() {
        const { classes } = this.props;

        const rowsData = this.state.isLoading ? [] : this.createRowsData(this.state.statistics);
        const tableRows = rowsData.map(row => {
            return (
                <TableRow key={row.key}>
                    <TableCell size="small" component="th" scope="row">{row.text}</TableCell>
                    <TableCell size="small" align="right">{row.value}</TableCell>
                    <TableCell size="small" component="th" scope="row">{row.text2}</TableCell>
                    <TableCell size="small" align="right">{row.value2}</TableCell>
                </TableRow>
            );
        });

        if (this.state.isLoading) {
            return (
                <div>
                    <CircularProgress /> Loading statistics...
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
                                <TableCell size="small" >Statistics</TableCell>
                                <TableCell size="small" align="right" />
                                <TableCell size="small" />
                                <TableCell size="small" align="right" />
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
