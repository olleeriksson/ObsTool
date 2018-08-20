import React from "react";
import { shallow } from "enzyme";
import NavMenu from "./NavMenu";

describe("NavMenu", () => {
  it("should render correctly", () => {
    const component = shallow(<NavMenu />);
    expect(component).toMatchSnapshot();
  });
});
