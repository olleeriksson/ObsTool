import * as React from "react";
import Popper from "@mui/material/Popper";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { withStyles, createStyles, WithStyles } from "src/muiCompat";
import type { Theme } from "@mui/material/styles";
import { IDso } from "../types/Types";
import ConstellationMap from "./ConstellationMap";
import { toDsoMapObject } from "./DsoMapUtils";

const styles = (theme: Theme) => createStyles({
  // Portal the preview beside the row without affecting the report column layout.
  overlay: {
    pointerEvents: "none",
    zIndex: theme.zIndex.tooltip,
  },
  preview: {
    maxWidth: "calc(100vw - 32px)",
    padding: theme.spacing(1.5),
    boxSizing: "border-box",
  },
});

interface IDsoMapHoverProps extends WithStyles<typeof styles> {
  dso?: IDso;
  children: React.ReactNode;
}

// Show a temporary map only after the pointer rests on this object for 700 milliseconds.
function DsoMapHover({ dso, children, classes }: IDsoMapHoverProps) {
  const anchor = React.useRef<HTMLDivElement>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [open, setOpen] = React.useState(false);
  const [previewWidth, setPreviewWidth] = React.useState(440);
  const selectedObject = toDsoMapObject(dso);

  // Cancel pending previews when the row changes or is removed.
  React.useEffect(() => {
    setOpen(false);
    return () => clearTimeout(timer.current);
  }, [dso]);

  // Restart the delay on every entry, including moves between neighboring objects.
  const startHover = () => {
    clearTimeout(timer.current);
    if (selectedObject) {
      timer.current = setTimeout(() => {
        // Fit the map into the right margin, keeping a square chart at smaller widths.
        const availableWidth = window.innerWidth - (anchor.current?.getBoundingClientRect().right || 0) - 24;
        setPreviewWidth(Math.min(440, Math.max(160, availableWidth)));
        setOpen(true);
      }, 700);
    }
  };

  // Leaving or clicking the row dismisses the preview immediately.
  const endHover = () => {
    clearTimeout(timer.current);
    setOpen(false);
  };

  return (
    <div ref={anchor} onMouseEnter={startHover} onMouseLeave={endHover} onClick={endHover}>
      {children}
      {open && selectedObject && (
        <Popper
          open={true}
          anchorEl={anchor.current}
          placement="right-start"
          className={classes.overlay}
          modifiers={[
            { name: "offset", options: { offset: [0, 8] } },
            { name: "flip", enabled: false },
            // Keep the preview visible even when the viewport has almost no right margin.
            { name: "preventOverflow", options: { altAxis: true, tether: false, padding: 16 } },
          ]}
        >
          <Paper className={classes.preview} style={{ width: previewWidth }} elevation={8}>
            <Typography variant="subtitle2">{`Constellation map (${selectedObject.name})`}</Typography>
            <ConstellationMap
              constellation={selectedObject.constellation || ""}
              constellationName={selectedObject.constellation}
              objects={[]}
              highlightedObjects={[selectedObject]}
              maxNumLabels={1}
              labelMode="sac"
              width="100%"
              height={Math.min(400, previewWidth - 24)}
              showControls={false}
              allowZoom={false}
            />
          </Paper>
        </Popper>
      )}
    </div>
  );
}

export default withStyles(styles)(DsoMapHover);
