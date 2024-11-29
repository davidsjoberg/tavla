export { render_layer };
import * as sup from './support_funs.js';

function render_layer(_svg, _instructions) {
    const { scalesAndTypes } = _instructions;

    const render_functions_list = sup.extractRenderFunctions(_instructions);

    for (let layer in _instructions.layers) {
        const layerInfo = _instructions.layers[layer];
        const { geometry } = layerInfo;

        const handler = render_functions_list[geometry];
        if (handler) {
            // Pass descriptive layer ID instead of a raw index
            const layerId = `layer-${layer}`;

            // Render the layer
            handler(_svg, layer, _instructions, layerInfo, scalesAndTypes);
            const numPoints = 20;
            const occupiedGridPoints = sup.getPointsAlongPaths(_svg, layerId, numPoints);
            _instructions.layers[layer].pointspace = occupiedGridPoints
            console.log(occupiedGridPoints);
            sup.addTransformedPointsToSVG(_svg, layerId, numPoints)


        } else {
            console.warn(`No handler for geometry type: ${geometry}`);
        }
    }

    return _svg;
}