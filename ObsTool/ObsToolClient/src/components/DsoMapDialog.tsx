import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import { IConstellationMapObject } from "../types/Types";
import ConstellationMap from "./ConstellationMap";

interface IDsoMapDialogProps {
  selectedObject: IConstellationMapObject;
  open: boolean;
  onClose: () => void;
  closeOnClick?: boolean;
  contentClassName?: string;
}

// Share the DsoExtra locator dialog with the report list's persistent map.
export default function DsoMapDialog({ selectedObject, open, onClose, closeOnClick = false, contentClassName }: IDsoMapDialogProps) {
  const titleId = React.useId();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby={titleId}
      fullWidth={true}
      maxWidth="sm"
      slotProps={{
        paper: {
          style: { width: "92vw", maxWidth: 760 },
          // Report-list maps close on any click inside, including the title and chart.
          onClickCapture: closeOnClick ? onClose : undefined,
        },
      }}
    >
      <DialogTitle id={titleId}>{`Constellation map (${selectedObject.name})`}</DialogTitle>
      <DialogContent className={contentClassName} style={contentClassName ? undefined : { paddingTop: 8 }}>
        <ConstellationMap
          constellation={selectedObject.constellation || ""}
          constellationName={selectedObject.constellation}
          objects={[]}
          highlightedObjects={[selectedObject]}
          maxNumLabels={1}
          labelMode="sac"
          width="100%"
          height={500}
          showControls={false}
          allowZoom={true}
        />
      </DialogContent>
    </Dialog>
  );
}
