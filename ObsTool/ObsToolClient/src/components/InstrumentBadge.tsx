import * as React from "react";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { IInstrument } from "../types/Types";
import SvgIcon from "./icons/SvgIcon";
import TelescopeIcon, { isKnownTelescopeIconVariant, resolveTelescopeIconVariant } from "./icons/TelescopeIcon";

interface IInstrumentBadgeProps {
  instrument?: IInstrument;
  compact?: boolean;
  iconSize?: number;
  labelWidth?: number;
  nonDetection?: boolean;
  nonDetectionIconSize?: number;
  imageClassName?: string;
}

/**
 * Renders the observation-side telescope image and optional instrument key as one tooltip target.
 */
class InstrumentBadge extends React.Component<IInstrumentBadgeProps> {
  public render() {
    const instrument = this.props.instrument;
    const iconSize = this.props.iconSize || 28;
    const labelWidth = this.props.labelWidth || iconSize;
    const hasSelectedIcon = isKnownTelescopeIconVariant(instrument?.iconReference);

    const diameterText = instrument && instrument.diameterMm !== undefined && instrument.diameterMm !== null
      ? `${instrument.diameterMm} mm`
      : "N/A";
    const focalLengthText = instrument && instrument.focalLengthMm !== undefined && instrument.focalLengthMm !== null
      ? `FL ${instrument.focalLengthMm} mm`
      : "FL N/A";
    const details = instrument
      ? `${instrument.name} | ${diameterText} | ${focalLengthText}`
      : "";
    const variant = this.props.compact ? "caption" : "body2";
    const icon = this.props.nonDetection
      ? <VisibilityOffIcon fontSize="inherit" sx={{ fontSize: this.props.nonDetectionIconSize || iconSize }} />
      : hasSelectedIcon
        ? <TelescopeIcon variant={resolveTelescopeIconVariant(instrument?.iconReference)} size={iconSize} />
        : <SvgIcon variant="observation1" size={iconSize * 0.75} />;

    const content = (
      <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
        <div className={this.props.imageClassName}>
          {icon}
        </div>
        {instrument && instrument.key && hasSelectedIcon
          ? (
            <Typography variant={variant} color="textSecondary" style={{ width: labelWidth, textAlign: "center", marginTop: -4, lineHeight: 1.2, whiteSpace: "nowrap" }}>
              {instrument.key}
            </Typography>
          )
          : null}
      </div>
    );

    return instrument && instrument.key && hasSelectedIcon
      ? <Tooltip title={details}>{content}</Tooltip>
      : content;
  }
}

export default InstrumentBadge;
