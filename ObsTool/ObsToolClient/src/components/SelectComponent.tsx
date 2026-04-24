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
        SelectProps={{ native: true }}
        label={this.props.label}
        value={this.props.value}
        onChange={this.handleChange}
        className={classes}
        variant="outlined"
        margin="normal"
        InputLabelProps={{ shrink: true }}
        helperText={this.props.helperText}
      >
        {options}
      </TextField>
    );
  }
}

export default SelectComponent;
