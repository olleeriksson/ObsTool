import * as React from "react";
import { withStyles, createStyles } from "src/muiCompat";
import type { Theme } from "@mui/material/styles";
import type { WithStyles } from "src/muiCompat";
import Grid from "@mui/material/Grid2";
import Paper from "@mui/material/Paper";
import ObsSessionPage from "./ObsSessionPage";

const styles = (theme: Theme) => createStyles({
    root: {
        marginTop: theme.spacing(1),
    },
    column: {
        marginTop: theme.spacing(1),
        // padding: "1em !important",
    },
    observationPaper: {
        marginTop: theme.spacing(1),
        padding: theme.spacing(1),
    },
});

interface ISingleObsSessionViewProps extends WithStyles<typeof styles> {
    obsSessionId: number;
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
            <Grid container spacing={5} justifyContent="center">
                <Grid size={{ xs: 12, md: 12 }} className={classes.column}>
                    <Paper className={classes.observationPaper} elevation={1}>
                        <ObsSessionPage obsSessionId={this.props.obsSessionId} />
                    </Paper>
                </Grid>
            </Grid>
        </div>;
    }
}

export default withStyles(styles)(SingleObsSessionView);
