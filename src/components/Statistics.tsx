import * as React from "react";
import { withStyles } from "@material-ui/core/styles";
import { WithStyles, createStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles/createMuiTheme";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";

const styles = (theme: Theme) => createStyles({
    root: {
        width: "40%",
        marginTop: theme.spacing.unit * 3,
        overflowX: "auto",
    },
    table: {
        minWidth: "700",
    },
});

export interface IStatisticsProps extends WithStyles<typeof styles> {
    // non-style props
    foo?: number;
}

export interface IStatisticsState {
    foo?: number;
}

let id = 0;
function createData(text: string, value: number) {
    id += 1;
    return { id, text, value };
}

const rows = [
    createData("Frozen yoghurt", 159),
    createData("Ice cream sandwich", 237),
    createData("Eclair", 262),
    createData("Cupcake", 305),
    createData("Gingerbread", 356),
];

class Statistics extends React.Component<IStatisticsProps, IStatisticsState> {
    constructor(props: IStatisticsProps) {
        super(props);
    }

    public render() {
        const { classes } = this.props;

        const rowsComp = rows.map(row => {
            return (
                <TableRow key={row.id}>
                    <TableCell component="th" scope="row">{row.text}</TableCell>
                    <TableCell numeric={true}>{row.value}</TableCell>
                </TableRow>
            );
        });

        return (
            <Paper className={classes.root}>
                <Table className={classes.table}>
                    <TableHead>
                        <TableRow>
                            <TableCell>Data</TableCell>
                            <TableCell numeric={true}>Number</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rowsComp}
                    </TableBody>
                </Table>
            </Paper>
        );
    }
}

export default withStyles(styles)(Statistics);
