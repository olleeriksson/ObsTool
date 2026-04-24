import * as React from "react";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import NativeSelect from "@mui/material/NativeSelect";
import Input from "@mui/material/Input";
import FormHelperText from "@mui/material/FormHelperText";

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
      <FormControl className={classes}>
        <InputLabel shrink={true} htmlFor={this.props.name + "-label-placeholder"}>
          {this.props.label}
        </InputLabel>
        <NativeSelect
          value={this.props.value}
          onChange={this.handleChange}
          input={<Input name="seeing" id={this.props.name + "-select-placeholder"} />}
          name={this.props.name}
        >
          {options}
        </NativeSelect>
        {this.props.helperText && <FormHelperText>{this.props.helperText}</FormHelperText>}
      </FormControl>
    );
  }
}

export default SelectComponent;
