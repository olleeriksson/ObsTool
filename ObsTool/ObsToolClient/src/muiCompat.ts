// Adapter replacing @mui/styles (JSS) with tss-react (emotion-based).
// Exposes the curried withStyles(styles)(Component) API so all 24+ class components
// continue to work without changes.

import type { ComponentType } from "react";
import { withStyles as _withStyles } from "tss-react/mui";

export type WithStyles<Styles> =
  Styles extends (...args: any[]) => infer ClassStyles
    ? { classes: { [K in keyof ClassStyles]: string } }
    : { classes: { [K in keyof Styles]: string } };

// Identity function — only exists for TypeScript inference of class name keys.
export const createStyles = <Styles>(styles: Styles): Styles => styles;

// Curried adapter: withStyles(styles)(Component) → tss-react's withStyles(Component, styles)
export const withStyles = (styles: any, _options?: object) =>
  <Props extends { classes?: any }>(component: ComponentType<Props>): ComponentType<Omit<Props, "classes">> =>
    (_withStyles as any)(component, styles);
