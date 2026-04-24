import * as React from "react";
import { withStyles, createStyles } from "src/muiCompat";
import type { Theme } from "@mui/material/styles";
import type { WithStyles } from "src/muiCompat";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import ObsSessionPage from "./ObsSessionPage";

const styles = (theme: Theme) => createStyles({
    root: {
        marginTop: theme.spacing(1),
    },
    column: {
        marginTop: theme.spacing(2),
        // padding: "1em !important",
    },
    observationPaper: {
        marginTop: theme.spacing(2),
        padding: theme.spacing(2),
    },
});

interface INewObsSessionViewProps extends WithStyles<typeof styles> {
}

class NewObsSessionView extends React.Component<INewObsSessionViewProps> {
    constructor(props: INewObsSessionViewProps) {
        super(props);
    }

    public render() {
        const { classes } = this.props;

        return <div className={classes.root}>
            <Grid container={true} spacing={5} justifyContent="center">
                <Grid item={true} xs={12} sm={8} className={classes.column}>
                    <Paper className={classes.observationPaper} elevation={1}>
                        <ObsSessionPage />
                    </Paper>
                </Grid>
            </Grid>
        </div>;
    }
}

export default withStyles(styles)(NewObsSessionView);
