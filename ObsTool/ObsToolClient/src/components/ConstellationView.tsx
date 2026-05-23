import * as React from "react";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import type { Theme } from "@mui/material/styles";
import { createStyles, withStyles } from "src/muiCompat";
import type { WithStyles } from "src/muiCompat";
import { IConstellationMapObject } from "../types/Types";
import ConstellationMap from "./ConstellationMap";
import DsoObjectsListView from "./DsoObjectsListView";

const styles = (theme: Theme) => createStyles({
    tabPanel: {
        paddingTop: theme.spacing(2),
    },
    emptyPanel: {
        minHeight: 260,
    },
});

interface IConstellationViewProps extends WithStyles<typeof styles> {
    constellationName: string;
    constellationAbbrv: string;
    objects: IConstellationMapObject[];
    objectLabel?: string;
    backgroundLabel?: string;
    highlightedLabel?: string;
}

interface IConstellationViewState {
    selectedTab: number;
}

/**
 * Used in ConstellationDialog. Holds the tabs component with a Map tab and List tab.
 * On the Map tab is a ConstellationMap.
 */
class ConstellationView extends React.Component<IConstellationViewProps, IConstellationViewState> {
    public state: IConstellationViewState = {
        selectedTab: 0,
    };

    public render() {
        const { backgroundLabel, classes, constellationAbbrv, constellationName, highlightedLabel, objectLabel, objects } = this.props;
        const highlightedObjects = objects.filter(object => object.h400);
        const backgroundObjects = objects.filter(object => object.isObserved && !object.h400);
        const normalObjects = objects.filter(object => !object.isObserved && !object.h400);

        return (
            <Box>
                <Tabs
                    value={this.state.selectedTab}
                    onChange={(_, selectedTab: number) => this.setState({ selectedTab })}
                    aria-label="Constellation view tabs"
                >
                    <Tab label="Map" />
                    <Tab label="List" />
                </Tabs>
                <div className={classes.tabPanel} hidden={this.state.selectedTab !== 0}>
                    <ConstellationMap
                        constellation={constellationAbbrv}
                        constellationName={constellationName}
                        objects={normalObjects}
                        backgroundObjects={backgroundObjects}
                        highlightedObjects={highlightedObjects}
                        objectLabel={objectLabel}
                        backgroundLabel={backgroundLabel}
                        highlightedLabel={highlightedLabel}
                        labelMode="herschel"
                        height={760}
                    />
                </div>
                <div className={`${classes.tabPanel} ${classes.emptyPanel}`} hidden={this.state.selectedTab !== 1}>
                    <DsoObjectsListView objects={objects} />
                </div>
            </Box>
        );
    }
}

export default withStyles(styles)(ConstellationView);
