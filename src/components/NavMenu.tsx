import * as React from "react";
import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { withStyles } from "@material-ui/core/styles";
import { WithStyles, createStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles/createMuiTheme";
import Grid from "@material-ui/core/Grid";
import Search from "./Search";

const styles = (theme: Theme) => createStyles({
    mainGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(12, 1fr)",
    },
    subGrid: {
    },
    paper: {
        height: 140,
        width: 100
    },
});

interface INavMenuProps extends WithStyles<typeof styles> {
}

class NavMenu extends React.Component<INavMenuProps> {
    constructor(props: INavMenuProps) {
        super(props);
    }

    public render() {
        const { classes } = this.props;

        return <div>
            <Grid container={true} className={classes.mainGrid} spacing={16}>
                <Grid item={true} className={classes.subGrid} xs={1}>
                    <NavLink to={"/"} exact={true} activeClassName="active">
                        <FontAwesomeIcon icon="home" /> Home
                    </NavLink>
                </Grid>
                <Grid item={true} className={classes.subGrid} xs={1}>
                    <NavLink to={"/sessions"} activeClassName="active">
                        <FontAwesomeIcon icon="table" /> Observation sessions
                    </NavLink>
                </Grid>
                <Grid item={true} className={classes.subGrid} xs={1}>
                    <NavLink to={"/"} exact={true} activeClassName="active">
                        <FontAwesomeIcon icon="plus" className="" /> Add session
                    </NavLink>
                </Grid>
                <Grid item={true} className={classes.subGrid} xs={1}>
                    <NavLink to={"/sessions"} activeClassName="active">
                        <FontAwesomeIcon icon="search" /> Search observations
                    </NavLink>
                </Grid>
                <Grid item={true} className={classes.subGrid} xs={1}>
                    <Search />
                </Grid>
            </Grid>
        </div>;
    }
}

export default withStyles(styles)(NavMenu);