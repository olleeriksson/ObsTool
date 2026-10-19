import * as React from "react";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import type { Theme } from "@mui/material/styles";
import { createStyles, withStyles } from "src/muiCompat";
import type { WithStyles } from "src/muiCompat";
import { IConstellationMapObject } from "../types/Types";
import ConstellationMap from "./ConstellationMap";
import { InterstellarumChart } from "./InterstellarumAtlas";
import DsoObjectsListView from "./DsoObjectsListView";

const styles = (theme: Theme) => createStyles({
    // Keep tabs above a panel that consumes the remaining dialog height.
    root: {
        display: "flex",
        flexDirection: "column",
        flex: "1 1 auto",
        minHeight: 0,
    },
    tabPanel: {
        flex: "1 1 auto",
        minHeight: 0,
        overflow: "auto",
        paddingTop: theme.spacing(2),
    },
    emptyPanel: {
        minHeight: 260,
    },
});

interface IConstellationViewProps extends WithStyles<typeof styles> {
    chart?: InterstellarumChart;
    constellationName: string;
    constellationAbbrv: string;
    objects: IConstellationMapObject[];
    objectLabel?: string;
    backgroundLabel?: string;
    highlightedLabel?: string;
}

interface IConstellationViewState {
    selectedTab: number;
    mapHeight: number;
}

/**
 * Used in ConstellationDialog. Holds the tabs component with a Map tab and List tab.
 * On the Map tab is a ConstellationMap.
 */
class ConstellationView extends React.Component<IConstellationViewProps, IConstellationViewState> {
    public state: IConstellationViewState = {
        selectedTab: 0,
        mapHeight: 760,
    };

    private panelObserver?: ResizeObserver;

    // Measure the panel's content box so the map grows with dialog and viewport resizing.
    private setMapPanelRef = (panel: HTMLDivElement | null) => {
        this.panelObserver?.disconnect();
        if (!panel || typeof ResizeObserver === "undefined") { return; }
        this.panelObserver = new ResizeObserver(entries => {
            const availableHeight = entries[0]?.contentRect.height;
            if (availableHeight && availableHeight > 0) {
                // Account for the map border while retaining a usable map on very short screens.
                const mapHeight = Math.max(240, Math.floor(availableHeight) - 2);
                if (mapHeight !== this.state.mapHeight) { this.setState({ mapHeight }); }
            }
        });
        this.panelObserver.observe(panel);
    };

    // Release the panel observer when the dialog view is removed.
    public componentWillUnmount() {
        this.panelObserver?.disconnect();
    }

    // Render the statistics overview with labels for every visible group, including single objects.
    public render() {
        const { backgroundLabel, classes, constellationAbbrv, constellationName, highlightedLabel, objectLabel, objects } = this.props;
        // Split observed and unseen objects by H400 membership so observed H400 targets retain their emphasis.
        const highlightedObjects = objects.filter(object => !object.isObserved && object.h400);
        const backgroundObjects = objects.filter(object => object.isObserved && !object.h400);
        const highlightedBackgroundObjects = objects.filter(object => object.isObserved && object.h400);
        const normalObjects = objects.filter(object => !object.isObserved && !object.h400);

        return (
            <Box className={classes.root}>
                <Tabs
                    value={this.state.selectedTab}
                    onChange={(_, selectedTab: number) => this.setState({ selectedTab })}
                    aria-label="Constellation view tabs"
                >
                    <Tab label="Map" />
                    <Tab label="List" />
                </Tabs>
                <div className={classes.tabPanel} ref={this.setMapPanelRef} hidden={this.state.selectedTab !== 0}>
                    <ConstellationMap
                        chart={this.props.chart}
                        constellation={constellationAbbrv}
                        constellationName={constellationName}
                        objects={normalObjects}
                        backgroundObjects={backgroundObjects}
                        highlightedObjects={highlightedObjects}
                        highlightedBackgroundObjects={highlightedBackgroundObjects}
                        highlightedBackgroundLabel="Observed H400"
                        objectLabel={objectLabel}
                        backgroundLabel={backgroundLabel}
                        highlightedLabel={highlightedLabel}
                        labelMode="sac"
                        labelSingleObject={true}
                        showBackgroundLabels={true}
                        enableLabelVisibilityFilter={true}
                        height={this.state.mapHeight}
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
