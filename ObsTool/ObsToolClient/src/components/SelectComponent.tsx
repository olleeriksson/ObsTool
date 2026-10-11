import * as React from "react";
import TextField from "@mui/material/TextField";

export interface IKeyValuePair {
  key: string;
  value: string;
}
interface ISelectComponentProps {
  name: string;
  label: string;
  options: IKeyValuePair[];
  value: string;
  helperText?: string;
  classes: any;
  margin?: "dense" | "normal" | "none";
  size?: "small" | "medium";
  onChange: (event: any) => void;
}

class SelectComponent extends React.Component<ISelectComponentProps> {
  constructor(props: ISelectComponentProps) {
    super(props);
  }

  private handleChange = (event: any) => {
    this.props.onChange(event);
  }

  public render() {
    const { classes } = this.props;

    const options = this.props.options.map(o => {
      return <option
        key={this.props.name + "-option-" + o.key}
        value={o.key}
      >
        {o.value}
      </option>;
    });

    return (
      <TextField
        select
        label={this.props.label}
        value={this.props.value}
        onChange={this.handleChange}
        className={classes}
        variant="outlined"
        margin={this.props.margin || "normal"}
        size={this.props.size}
        helperText={this.props.helperText}
        slotProps={{
          select: { native: true },
          inputLabel: { shrink: true }
        }}>
        {options}
      </TextField>
    );
  }
}

export default SelectComponent;
