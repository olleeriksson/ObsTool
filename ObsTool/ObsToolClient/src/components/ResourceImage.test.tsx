import * as React from "react";
import { fireEvent, render } from "@testing-library/react";
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

// Verifies the error-state container claims the available flex area instead of shrink-wrapping the fallback content.
it("fills the available image bounds when the image cannot be loaded", () => {
    const { getByRole, getByTitle } = render(
        <ResourceImage
            type="image"
            name="Missing resource"
            url="missing-resource.jpg"
            inverted={false}
            rotation={0}
            zoomLevel={100}
        />
    );

    fireEvent.error(getByRole("img", { name: "Missing resource" }));

    expect(getByTitle("Image URL could not be loaded").parentElement).toHaveStyle({
        width: "100%",
        height: "100%",
    });
});

// Verifies expanded resources enlarge into the available frame while retaining their intrinsic aspect ratio.
it("contain-fits the image across the expanded resource bounds", () => {
    const { getByRole } = render(
        <ResourceImage
            type="image"
            name="Expanded resource"
            url="expanded-resource.jpg"
            inverted={false}
            rotation={0}
            zoomLevel={100}
            fitContainer={true}
        />
    );

    expect(getByRole("img", { name: "Expanded resource" })).toHaveStyle({
        width: "100%",
        height: "100%",
        objectFit: "contain",
    });
});
