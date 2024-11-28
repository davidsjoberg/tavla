export { loop_over_layers};
import * as sup from './support_funs.js';

function loop_over_layers(_svg, _instructions) {
    const { scalesAndTypes } = _instructions;

    const render_functions_list = sup.extractRenderFunctions(_instructions)

    for (let layer in _instructions.layers) {
        const layerInfo = _instructions.layers[layer];
        const { geometry } = layerInfo;

        const handler = render_functions_list[geometry];
        if (handler) {
            handler(_svg, _instructions, layerInfo, scalesAndTypes);
        } else {
            console.warn(`No handler for geometry type: ${geometry}`);
        }
    }
    return _svg;
}
