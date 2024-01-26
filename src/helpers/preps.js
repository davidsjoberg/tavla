export {prepare_extended_instructions};
    
function prepare_extended_instructions(_instructions, _scale_functions) {
    // This function prepares everything that each layer need to know except data

    // Support funs
    function createAccessor(value) {
        return function(d) {
            return d[value];
        };
    }

    // Geometry rules of geometry delegation
    const binding_rules = {
        point: {
            required_bindings: ['x', 'y'],
            accepted_bindings: ['x', 'y', 'color', 'size', 'stroke'],
            grouping_bindings: ['color', 'size', 'stroke']
        },
        line: {
            required_bindings: ['x', 'y'],
            accepted_bindings: ['x', 'y', 'color'],
            grouping_bindings: ['color']
        },
        text: {
            required_bindings: ['x', 'y', 'text'],
            accepted_bindings: ['x', 'y', 'text', 'color', 'size'],
            grouping_bindings: ['color', 'size']
        },
    };

    // Create layer instructions
    for (const layer in _instructions.layers) {

        /////////// LAYER PARAMS /////////////
        const layertype = _instructions.layers[layer].geometry;
        const attributes = Object.keys(_instructions.layers[layer].attributes);
        const declared_bindings = Object.keys(_instructions.bindings)

        const { required_bindings, accepted_bindings, grouping_bindings } = binding_rules[layertype];

        /////////// CHECKS ////////////
        // Check if all required bindings are present
        required_bindings.forEach(binding => {
            if (!declared_bindings.includes(binding)) {
                throw new Error(`Missing required binding '${binding}' in ${layer}. Type '${layertype}'.`);
            }
        });

        // Check if any attribute is a required binding
        attributes.forEach(attribute => {
            if (required_bindings.includes(attribute)) {
                throw new Error(`Attribute set to required binding '${attribute}' in ${layer}. Type '${layertype}'.`);
            }
        });


        /////////// DELEGATE AESTHETICS ////////////
        // Find the intersection of required_bindings and accepted_bindings
        
        // Data vars
        const layer_bindings = declared_bindings
            .filter(binding => !attributes.includes(binding))
            .filter(binding => accepted_bindings.includes(binding));

        // Constant vars
        const layer_attributes = attributes

        // Grouping vars
        const layer_groupies = grouping_bindings
            .filter(binding => declared_bindings.includes(binding));
        
        const delegates = {
            var_bindings : layer_bindings,
            var_attributes : layer_attributes,
            var_groupies : layer_groupies
        }


        /////////// ACCESSOR FUNCTIONS ////////////

        // Filter _instructions.bindings based on keys not in array1 or array2
        const filteredBindings = Object.fromEntries(
            Object.entries(_instructions.bindings)
                .filter(([key, _]) => grouping_bindings.includes(key) || (!attributes.includes(key)))
                .filter(([key, _]) => accepted_bindings.includes(key))
        );
        
        function createAccessors(data, bindings) {
            const accessors = {};
            
            for (const key in bindings) {
                const value = bindings[key];
                accessors[key] = d => d[value];
            }
            
            return accessors;
        }
        
        const accessors = createAccessors(_instructions.data[0], filteredBindings);
        
        /////////// EXTEND INSTRUCTIONS ////////////
        _instructions.layers[layer].delegations = delegates;
        _instructions.layers[layer].accessors = accessors;
        _instructions.layers[layer].scales = Object.fromEntries(
            Object.entries(_scale_functions)
        );
    }

    return _instructions;
}
