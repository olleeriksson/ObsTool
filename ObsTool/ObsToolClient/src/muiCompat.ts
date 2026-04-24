// MUI v6 removed withStyles/createStyles from @mui/material/styles at runtime.
// This shim sources them from @mui/styles (the legacy JSS package) which still works.

import type { ComponentType } from "react";
import { withStyles as _withStyles, createStyles as _createStyles } from "@mui/styles";

export type WithStyles<Styles> =
  Styles extends (...args: any[]) => infer ClassStyles
    ? { classes: { [K in keyof ClassStyles]: string } }
    : { classes: { [K in keyof Styles]: string } };

// Generic is on the inner function so TypeScript infers Props from the component argument,
// not from the (already-evaluated) styles argument.
export const withStyles = _withStyles as unknown as (
  styles: any,
  options?: object
) => <Props extends { classes?: any }>(
  component: ComponentType<Props>
) => ComponentType<Omit<Props, "classes">>;

// Returns the actual styles object type so WithStyles<typeof styles> resolves correctly.
export const createStyles = _createStyles as unknown as <Styles>(styles: Styles) => Styles;
