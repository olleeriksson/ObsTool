import * as React from "react";
import { withStyles } from "@material-ui/core/styles";
import { WithStyles, createStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles/createMuiTheme";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import ObsSessionPage from "./ObsSessionPage";

const styles = (theme: Theme) => createStyles({
    root: {
        marginTop: theme.spacing.unit * 1,
    },
    column: {
        marginTop: theme.spacing.unit * 2,
        // padding: "1em !important",
    },
    observationPaper: {
        marginTop: theme.spacing.unit * 2,
        padding: theme.spacing.unit * 2,
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
            <Grid container={true} spacing={40} justify="center">
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
