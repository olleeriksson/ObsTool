import * as React from "react";
import * as enzyme from "enzyme";
import { IDso } from "../types/Types";
import DsoExtended from "./DsoExtended";
import * as sinon from "sinon";

const dso: IDso = {
    id: 0,
    catalog: "",
    name: "",
    commonName: "",
    otherCommonNames: "",
    type: "",
    con: "",
    mag: "",
    sb: "",
    u2k: "",
    ti: ""
};

it("renders the loading text", () => {
    const object = enzyme.mount(<DsoExtended dso={dso} />);
    expect(object.find("div").first().text()).toEqual("Loading DSO object");
});

it("logs to console, verified with sinon spy", () => {
    const consoleSpy = sinon.spy(console, "log");

    enzyme.shallow(<DsoExtended dso={dso} />);

    // Using chai:
    // consoleSpy.called.should.be.true;
    // Using jest:
    expect(consoleSpy.called).toEqual(true);

    consoleSpy.restore();
});

// Sinon:
//  Spy - we can check that a method is called.
//  Stub - A stub is a spy on which we may define its behaviour when it is called in a specific way.
//    sinon.stub(userService, 'getUser').returns(new User(1, 'User1'));
//    sinon.stub(userService, 'getUser').withArgs(1).returns(new User(1, 'User1'));
//  Mock - a combination of spy and stub. We can verify afterwards that the contract was fulfilled.
it("verifies sinon stubs", () => {
});

it("renders the correct text", () => {
    const hello = enzyme.mount(<DsoExtended dso={dso} />);
    const deb = hello.find("div").first();
    console.log("---------------------------");
    console.log(deb.text());
    console.log("---------------------------");
    expect(hello.find("div").first().text()).toEqual("Loading DSO object");
});
