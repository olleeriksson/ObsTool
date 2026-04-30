import * as React from "react";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { IInstrument } from "../types/Types";

interface IInstrumentBadgeProps {
  instrument?: IInstrument;
  compact?: boolean;
}

class InstrumentBadge extends React.Component<IInstrumentBadgeProps> {
  public render() {
    const instrument = this.props.instrument;
    if (!instrument || !instrument.key) {
      return null;
    }

    const details = `${instrument.name} | ${instrument.diameterMm} mm | FL ${instrument.focalLengthMm ?? "N/A"} mm`;
    const variant = this.props.compact ? "caption" : "body2";

    return (
      <Tooltip title={details}>
        <Typography variant={variant} color="textSecondary" style={{ lineHeight: 1.2, whiteSpace: "nowrap" }}>
          {instrument.key}
        </Typography>
      </Tooltip>
    );
  }
}

export default InstrumentBadge;

