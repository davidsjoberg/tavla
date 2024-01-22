export {prepare_extended_instructions};
    
function prepare_extended_instructions(_instructions, _scale_functions) {
    // This function prepares everything that each layer need to know except data
    const binding_rules = {
        point: {
            required_bindings: ['x', 'y'],
            accepted_bindings: ['x', 'y', 'color', 'size', 'stroke'],
            grouping_bindings: ['color', 'size', 'stroke']
        },
        line: {
            required_bindings: ['x', 'y'],
            accepted_bindings: ['x', 'y', 'color', 'size'],
            grouping_bindings: ['color', 'size']
        },
        text: {
            required_bindings: ['x', 'y', 'text'],
            accepted_bindings: ['x', 'y', 'text', 'color', 'size'],
            grouping_bindings: ['color', 'color', 'size']
        },
    };

    for (const layer in _instructions.layers) {
        const layertype = _instructions.layers[layer].geometry;
        const attributes = Object.keys(_instructions.layers[layer].attributes);

        const { required_bindings, accepted_bindings, grouping_bindings } = binding_rules[layertype];

        // Check if all required bindings are present
        required_bindings.forEach(binding => {
            if (!Object.keys(_instructions.bindings).includes(binding)) {
                throw new Error(`Missing required binding '${binding}' in ${layer}. Type '${layertype}'.`);
            }
        });

        // Check if any attribute is a required binding
        attributes.forEach(attribute => {
            if (required_bindings.includes(attribute)) {
                throw new Error(`Attribute set to required binding '${attribute}' in ${layer}. Type '${layertype}'.`);
            }
        });

        // Find the intersection of required_bindings and accepted_bindings
        const layer_bindings = Object.keys(_instructions.bindings)
            .filter(binding => !attributes.includes(binding))
            .filter(binding => accepted_bindings.includes(binding));

        _instructions.layers[layer].scales = Object.fromEntries(
            Object.entries(_scale_functions)
        );

        // Accessors
        const accessors = Object.fromEntries(
            Object.entries(_instructions.bindings)
                // .filter(([key]) => layer_bindings.includes(key))
                .map(([key, value]) => [key, d => d[value]])
        );

        // Groupies
        const layer_grouping_bindings = grouping_bindings.filter(key => Object.keys(_instructions.bindings).includes(key))

        _instructions.layers[layer].accessors = accessors;
        _instructions.layers[layer].groupies = layer_grouping_bindings;
    }

    return _instructions;
}
