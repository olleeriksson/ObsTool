import * as React from "react";
import { withStyles, createStyles } from "src/muiCompat";
import type { Theme } from "@mui/material/styles";
import type { WithStyles } from "src/muiCompat";
import Badge from "@mui/material/Badge";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import classNames from "classnames";
import { IHerschelInfo } from "../types/Types";
import HerschelIcon from "../herschel.png";
// Swap to this import if the SVG asset becomes preferred again.
// import HerschelIcon from "../herschel.svg";

const styles = (theme: Theme) => createStyles({
  root: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    marginLeft: "1.5em",
    minWidth: 48,
  },
  clickable: {
    cursor: "pointer",
  },
  icon: {
    display: "block",
    height: 40,
    objectFit: "contain",
    width: 40,
    border: "1px solid #aaaaaa",
  },
  overlay: {
    "& .MuiBadge-badge": {
      backgroundColor: "#64a8e8",
      color: "#fff",
    },
  },
  label: {
    lineHeight: 1,
    marginTop: theme.spacing(0.25),
    whiteSpace: "nowrap",
  },
  active: {
    filter: "drop-shadow(0 0 2px rgba(25, 118, 210, 0.65))",
  },
});

interface HerschelBadgeProps extends WithStyles<typeof styles> {
  herschelObjects?: IHerschelInfo[];
  allowDetails?: boolean;
  isExpanded?: boolean;
  onClick?: () => void;
}

class HerschelBadge extends React.Component<HerschelBadgeProps> {
  private getLabel() {
    const herschelObjects = this.props.herschelObjects || [];
    if (herschelObjects.length === 0) {
      return "";
    }

    const firstHerschelNo = herschelObjects[0].herschelNo;
    return herschelObjects.length > 1 ? `${firstHerschelNo} +${herschelObjects.length - 1}` : firstHerschelNo;
  }

  private getOverlayLabel() {
    const herschelObjects = this.props.herschelObjects || [];
    if (herschelObjects.length === 0 || !herschelObjects[0].h400) {
      return "";
    }

    return herschelObjects.length > 1 ? "H400.." : "H400";
  }

  private getTooltip() {
    return `Herschel object ${this.getLabel()}. Click for more details.`;
  }

  public render() {
    const { classes } = this.props;
    const herschelObjects = this.props.herschelObjects || [];
    if (herschelObjects.length === 0) {
      return null;
    }

    const overlayLabel = this.getOverlayLabel();
    const icon = <img src={HerschelIcon} className={classes.icon} alt="" />;
    const content = (
      <span className={classNames(classes.root, { [classes.active]: this.props.isExpanded })}>
        {overlayLabel ? (
          <Badge badgeContent={overlayLabel} className={classes.overlay}>
            {icon}
          </Badge>
        ) : icon}
        <Typography className={classes.label} variant="caption" component="span">
          { "HERSCHEL"/* {this.getLabel()} */}
        </Typography>
      </span>
    );

    if (!this.props.allowDetails) {
      return content;
    }

    return (
      <Tooltip title={this.getTooltip()}>
        <ButtonBase
          className={classNames(classes.root, classes.clickable)}
          onClick={this.props.onClick}
          aria-expanded={this.props.isExpanded}
          aria-label="Show Herschel details"
        >
          {content}
        </ButtonBase>
      </Tooltip>
    );
  }
}

export default withStyles(styles)(HerschelBadge);
