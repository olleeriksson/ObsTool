import * as React from "react";
import { render } from "@testing-library/react";
import ResourceImage from "./ResourceImage";

// Renders the resource image at each slider scale so the dialog can zoom both below and above 100%.
it.each([
    [50, "scale(0.5)"],
    [100, "scale(1)"],
    [150, "scale(1.5)"],
])("applies a %i%% zoom level to the image", (zoomLevel, expectedScale) => {
    const { getByRole } = render(
        <ResourceImage
            type="image"
            name="Test resource"
            url="test-resource.jpg"
            inverted={false}
            rotation={0}
            zoomLevel={zoomLevel}
        />
    );

    expect(getByRole("img", { name: "Test resource" })).toHaveStyle({
        transform: `rotate(0deg) ${expectedScale}`,
    });
});
