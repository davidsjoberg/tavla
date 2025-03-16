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
            
            // Store path points for possible future use without visualizing them
            const occupiedGridPoints = sup.getPointsAlongPaths(_svg, layerId, 6);
            _instructions.layers[layer].pointspace = occupiedGridPoints;
        } else {
            console.warn(`No handler for geometry type: ${geometry}`);
        }
    }

    return _svg;
}