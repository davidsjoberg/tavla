export {prepare_extended_instructions, transform_data, get_geometries, extractRenderFunctions};
import * as sup from './support_funs.js';

function get_geometries(_instructions, _geometry_database) {
    // Create a set to store unique geometries
    const geometries = new Set();

    // Iterate over the layers object
    for (const layer in _instructions.layers) {
        if (_instructions.layers[layer].geometry) {
            geometries.add(_instructions.layers[layer].geometry);
        }
    }

    // Helper function to filter geometry database
    function filterGeoms(database, keys) {
        return Object.fromEntries(
            Object.entries(database).filter(([key]) => keys.has(key)) // Use Set's `has` method
        );
    }

    // Filter the geometry database
    const filteredGeomDatabase = filterGeoms(_geometry_database, geometries);

    // Add the filtered geometry database to the instructions
    _instructions.geoms = filteredGeomDatabase;

    // Return the modified instructions
    return _instructions;
}


function transform_data(_instructions) {
    // Iterate through layers and apply geometry-specific data transformations
    for (const layer in _instructions.layers) {
        const layerInfo = _instructions.layers[layer];
        const geometryType = layerInfo.geometry;
        
        // Get the geometry from _instructions.geoms
        if (_instructions.geoms && _instructions.geoms[geometryType]) {
            const geometry = _instructions.geoms[geometryType];
            
            // If the geometry has a data_transform function, use it
            if (geometry.data_transform && typeof geometry.data_transform === 'function') {
                // Call the geometry-specific data transformation function
                const transformedData = geometry.data_transform(_instructions.data, layerInfo);
                
                // If transformation returns data, store it in the layer
                if (transformedData) {
                    _instructions.layers[layer].transformed_data = transformedData;
                }
            }
        }
    }
    
    return _instructions;
}

                        
function prepare_extended_instructions(_instructions) {
    // This function prepares everything that each layer need to know except data

    // Support funs
    function createAccessor(value) {
        return function(d) {
            return d[value];
        };
    }

    // Geometry rules of geometry delegation
    const binding_rules = sup.extractBindingRules(_instructions)

    // Create layer instructions
    for (const layer in _instructions.layers) {

        /////////// LAYER PARAMS /////////////
        const layertype = _instructions.layers[layer].geometry;

        // Populate attributes with nonense if null (so that it works)
        let attributes;
        if (_instructions.layers[layer].attributes == null) {
            attributes = ['not_something_real'];
        } else {
            attributes = Object.keys(_instructions.layers[layer].attributes);
        }

        // Layer bindints should be overrided if layer specified
        let layer_bindings_and_cols = { ..._instructions.bindings }; // Shallow copy of _instructions.bindings
        if (_instructions.layers[layer].bindings) {
            const updated_bindings = Object.keys(_instructions.layers[layer].bindings);
            updated_bindings.forEach(key => {
                    layer_bindings_and_cols[key] = _instructions.layers[layer].bindings[key];
                })
            };
        let declared_bindings = Object.keys(layer_bindings_and_cols)

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
            Object.entries(layer_bindings_and_cols)
                .filter(([key, _]) => grouping_bindings.includes(key) || (!attributes.includes(key)))
                .filter(([key, _]) => accepted_bindings.includes(key))
        );
        
        function createAccessors(data, bindings) {
            const accessors = {};
            // Instead of using data[0], find a row that has defined values for each binding.
            const sample = data.find(d =>
                Object.values(bindings).every(key => d[key] !== undefined)
            ) || data[0];
            
            for (const key in bindings) {
                const value = bindings[key];
                accessors[key] = d => d[value];
            }
            
            return accessors;
        }
        
        const accessors = createAccessors(_instructions.data, filteredBindings);
        
        /////////// EXTEND INSTRUCTIONS ////////////
        _instructions.layers[layer].delegations = delegates;
        _instructions.layers[layer].accessors = accessors;
    }

    return _instructions;
}

// Add this new function to re-export from support_funs
function extractRenderFunctions(_instructions) {
    return sup.extractRenderFunctions(_instructions);
}


