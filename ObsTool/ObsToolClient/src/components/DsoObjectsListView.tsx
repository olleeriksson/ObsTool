import * as React from "react";
import Checkbox from "@mui/material/Checkbox";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import type { Theme } from "@mui/material/styles";
import { createStyles, withStyles } from "src/muiCompat";
import type { WithStyles } from "src/muiCompat";
import { IConstellationMapObject } from "../types/Types";
import { formatMapObjectLabel } from "./ConstellationMapUtils";

const styles = (theme: Theme) => createStyles({
    root: {
        marginTop: theme.spacing(2),
        overflowX: "auto",
    },
    observed: {
        color: theme.palette.text.secondary,
    },
    flag: {
        whiteSpace: "nowrap",
    },
});

interface IDsoObjectsListViewProps extends WithStyles<typeof styles> {
    objects: IConstellationMapObject[];
}

class DsoObjectsListView extends React.Component<IDsoObjectsListViewProps> {
    public render() {
        const { classes, objects } = this.props;
        const sortedObjects = [...objects].sort((a, b) => (a.herschelId || 0) - (b.herschelId || 0));

        return (
            <Paper className={classes.root}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Herschel</TableCell>
                            <TableCell align="right">H400</TableCell>
                            <TableCell>SAC object</TableCell>
                            <TableCell>RA</TableCell>
                            <TableCell>DEC</TableCell>
                            <TableCell align="right">Observed</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedObjects.map(object => (
                            <TableRow key={object.herschelId || object.dsoId || object.name} className={object.isObserved ? classes.observed : undefined}>
                                <TableCell>{object.herschelNo}</TableCell>
                                <TableCell className={classes.flag} align="right">{object.h400 ? "Yes" : ""}</TableCell>
                                <TableCell>{formatMapObjectLabel(object, "sac")}</TableCell>
                                <TableCell>{formatRa(object.ra)}</TableCell>
                                <TableCell>{formatDec(object.dec)}</TableCell>
                                <TableCell className={classes.flag} align="right">
                                    <Checkbox
                                        size="small"
                                        checked={Boolean(object.isObserved)}
                                        disabled={true}
                                        inputProps={{ "aria-label": `${formatMapObjectLabel(object, "sac")} observed` }}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>
        );
    }
}

function formatRa(value: string) {
    const parts = value.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
        return `${parts[0]}h ${parts[1]}m`;
    }

    return value;
}

function formatDec(value: string) {
    const trimmed = value.trim();
    const match = /^([+-]?\d+(?:\.\d+)?)(.*)$/.exec(trimmed);
    if (match == null) {
        return value;
    }

    return `${match[1]}\u00b0${match[2]}`;
}

export default withStyles(styles)(DsoObjectsListView);
