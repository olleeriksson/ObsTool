import * as React from "react";
import { withStyles } from "@material-ui/core/styles";
import { WithStyles, createStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles/createMuiTheme";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
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

interface ISingleObsSessionViewProps extends WithStyles<typeof styles> {
    obsSessionId: number;
    match: { params: any };
}

class SingleObsSessionView extends React.Component<ISingleObsSessionViewProps> {
    constructor(props: ISingleObsSessionViewProps) {
        super(props);
    }

    public componentDidMount() {
    }

    public render() {
        const { classes } = this.props;

        return <div className={classes.root}>
            <Grid container={true} spacing={40} alignItems="flex-start">
                <Grid item={true} xs={12} sm={4} className={classes.column}>
                    <Typography />
                </Grid>
                <Grid item={true} xs={12} sm={8} className={classes.column}>
                    <Paper className={classes.observationPaper} elevation={1}>
                        <ObsSessionPage obsSessionId={this.props.obsSessionId} />
                    </Paper>
                </Grid>
            </Grid>
        </div>;
    }
}

export default withStyles(styles)(SingleObsSessionView);
