export function extractBindingRules(_instructions) {
    const { geoms } = _instructions;

    if (!geoms) {
        throw new Error('filteredGeomDatabase not found in instructions');
    }

    const binding_rules = Object.fromEntries(
        Object.entries(geoms).map(([geometry, data]) => [
            geometry,
            data.binding_rules
        ])
    );

    return binding_rules;
}

export function extractRenderFunctions(_instructions) {
    const { geoms } = _instructions;

    if (!geoms) {
        throw new Error('geoms not found in instructions');
    }

    const render_functions = Object.fromEntries(
        Object.entries(geoms).map(([geometry, data]) => [
            geometry,
            data.render_function
        ])
    );

    return render_functions;
}