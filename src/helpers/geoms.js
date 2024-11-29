export {geomDatabase};

// Binding rules
const geomDatabase = {
    point: {
        // Binding rules
        binding_rules: {
            required_bindings: ['x', 'y'],
            accepted_bindings: ['x', 'y', 'color', 'size', 'stroke'],
            grouping_bindings: ['color'/* THESE bindings has been removed because it needs to be different if factor or continuous. Only if factor should they trigger a new group 'strike','stroke'*/]
        },

        // Render function for point geometry
        render_function : function render_geom(_svg, layerName, _instructions, layerInfo, scalesAndTypes) {
            const { accessors, delegations, attributes, transformed_data } = layerInfo;
            const { var_bindings, var_attributes, var_groupies } = delegations;
            let layer_data = transformed_data || _instructions.data;
        
            const geomPoints = _svg.append('g')
            .selectAll('.point-group')
            .data(d3.group(layer_data, d => {
                // Dynamically generate group key using all columns in var_groupies
                const groupKey = var_groupies.map(key => accessors[key](d)).join('|');
                return groupKey;
            }))
            .join('g')
            .attr('class', 'point-group')
            .attr('id', `layer-${layerName}`)  // Add layer ID
            .attr('group-id', d => d[0])
            .selectAll('.point')
            .data(d => d[1])
            .join('path')
            .attr('transform', d => `translate(${scalesAndTypes.x.scale(accessors.x(d))}, ${scalesAndTypes.y.scale(accessors.y(d))})`)
            .attr('fill', 'blue')
        
            // Size
            if (var_bindings.includes('size')) {
                geomPoints.attr('d', d3.symbol().size(d => scalesAndTypes.size.scale(accessors.size(d))));
            } else if (var_attributes.includes('size')) {
                geomPoints.attr('d', d3.symbol().size(attributes.size * 64).type(d3.symbolCircle));
            } else {
                geomPoints.attr('d', d3.symbol().size(64).type(d3.symbolCircle));
            }
        
            // Color
            if (var_bindings.includes('color')) {
                geomPoints.attr('fill', d => scalesAndTypes.color.scale(accessors.color(d)));
            } else if (var_attributes.includes('color')) {
                geomPoints.attr('fill', attributes.color);
            } else {
                geomPoints.attr('fill', 'black');
            }
        
            // Stroke
            if (var_bindings.includes('stroke')) {
                geomPoints.attr('stroke', d => scalesAndTypes.stroke.scale(accessors.stroke(d)));
            } else if (var_attributes.includes('stroke')) {
                geomPoints.attr('stroke', attributes.stroke);
            } else {
                geomPoints.attr('stroke', 'none');
            }

        
        }
    },
    line: {
        // Binding rules
        binding_rules: {
            required_bindings: ['x', 'y'],
            accepted_bindings: ['x', 'y', 'color'],
            grouping_bindings: ['color']
        },
    
        // Render function for line geometry
        render_function: function render_geom(_svg, layerName, _instructions, layerInfo, scalesAndTypes) {
                const { accessors, delegations, attributes, transformed_data } = layerInfo;
                const { var_bindings, var_attributes, var_groupies } = delegations;
    
                // Determine layer data
                const layer_data = transformed_data || _instructions.data;
    
                // Ensure required bindings exist
                if (!accessors.x || !accessors.y) {
                    throw new Error("Missing required accessors for 'x' and/or 'y'.");
                }

                const geomLines = _svg.append('g')
                    .selectAll('.line-group')
                    .data(d3.group(layer_data, d => {
                        // Dynamically generate group key using all columns in var_groupies
                        const groupKey = var_groupies.map(key => accessors[key](d)).join('|');
                        return groupKey;
                    }))
                    .join('g')
                    .attr('class', 'line-group')
                    .attr('id', `layer-${layerName}`)  // Add layer ID
                    .attr('group-id', d => d[0])
                    .selectAll('.line')
                    .data(d => [d[1]]) // Use the grouped data array for each line
                    .join('path')
                    .attr('d', d3.line()
                        .x(d => scalesAndTypes.x.scale(accessors.x(d)))
                        .y(d => scalesAndTypes.y.scale(accessors.y(d)))
                    )
                    .attr('fill', 'none')
                    .attr('id', `layer-${layerName}`)  // Add layer ID

                // size
                if (var_bindings.includes('size')) {
                    geomLines.attr('stroke-width', d => scalesAndTypes.size.scale(accessors.size(d[0])));
                } else if (var_attributes.includes('size')) {
                    geomLines.attr('stroke-width', attributes.size);
                } else {
                    geomLines.attr('stroke-width', 3);
                }            

                // // color
                if (var_bindings.includes('color')) {
                    geomLines.attr('stroke', d => scalesAndTypes.color.scale(accessors.color(d[0])));
                } else if (var_attributes.includes('color')) {
                    geomLines.attr('stroke', attributes.color);
                } else {
                    geomLines.attr('stroke', 'black');
                }
    }},
    text: {
        // Binding rules
        binding_rules: {
            required_bindings: ['x', 'y', 'text'],
            accepted_bindings: ['x', 'y', 'text', 'color', 'size'],
            grouping_bindings: ['color', 'size'] 
        },

        // Render function for text geometry
        render_function : function render_geom(_svg, layerName, _instructions, layerInfo, scalesAndTypes) {
            const { accessors, delegations, attributes, transformed_data } = layerInfo;
            const { var_bindings, var_attributes, var_groupies } = delegations;
            let layer_data = transformed_data || _instructions.data;

            const groupedTextData = d3.group(layer_data, d => {
                const groupKey = var_groupies.map(key => accessors[key](d));
                return groupKey.join('|');
            });

            const textElements = _svg.append('g')
                .selectAll('.text-group')
                .data(groupedTextData)
                .join('g')
                .attr('class', 'text-group')
                .selectAll('text')
                .data(d => d[1])
                .join('text')
                .attr('x', d => scalesAndTypes.x.scale(accessors.x(d)))
                .attr('y', d => scalesAndTypes.y.scale(accessors.y(d)))
                .text(d => accessors.text(d))
                .attr('id', `layer-${layerName}`)  // Add layer ID;

            // Size
            if (var_bindings.includes('size')) {
                textElements.attr('font-size', d => Math.pow(scalesAndTypes.size.scale(accessors.size(d)), 0.2) * 7);
            } else if (var_attributes.includes('size')) {
                textElements.attr('font-size', attributes.size);
            } else {
                textElements.attr('font-size', 20);
            }

            // Color
            if (var_bindings.includes('color')) {
                textElements.attr('fill', d => scalesAndTypes.color.scale(accessors.color(d)));
            } else if (var_attributes.includes('color')) {
                textElements.attr('fill', attributes.color);
            } else {
                textElements.attr('fill', 'black');
            }
        }
    },
    text: {
        // Binding rules
        binding_rules: {
            required_bindings: ['x', 'y', 'text'],
            accepted_bindings: ['x', 'y', 'text', 'color', 'size'],
            grouping_bindings: ['color', 'size'] 
        },

        // Render function for text geometry
        render_function : function render_geom(_svg, layerName, _instructions, layerInfo, scalesAndTypes) {
            const { accessors, delegations, attributes, transformed_data } = layerInfo;
            const { var_bindings, var_attributes, var_groupies } = delegations;
            let layer_data = transformed_data || _instructions.data;

            const groupedTextData = d3.group(layer_data, d => {
                const groupKey = var_groupies.map(key => accessors[key](d));
                return groupKey.join('|');
            });

            const textElements = _svg.append('g')
                .selectAll('.text-group')
                .data(groupedTextData)
                .join('g')
                .attr('class', 'text-group')
                .selectAll('text')
                .data(d => d[1])
                .join('text')
                .attr('x', d => scalesAndTypes.x.scale(accessors.x(d)))
                .attr('y', d => scalesAndTypes.y.scale(accessors.y(d)))
                .text(d => accessors.text(d))
                .attr('id', `layer-${layerName}`)  // Add layer ID;

            // Size
            if (var_bindings.includes('size')) {
                textElements.attr('font-size', d => Math.pow(scalesAndTypes.size.scale(accessors.size(d)), 0.2) * 7);
            } else if (var_attributes.includes('size')) {
                textElements.attr('font-size', attributes.size);
            } else {
                textElements.attr('font-size', 20);
            }

            // Color
            if (var_bindings.includes('color')) {
                textElements.attr('fill', d => scalesAndTypes.color.scale(accessors.color(d)));
            } else if (var_attributes.includes('color')) {
                textElements.attr('fill', attributes.color);
            } else {
                textElements.attr('fill', 'black');
            }
        }
    },
    bar: {
        // Binding rules
        binding_rules: {
            required_bindings: ['x', 'y'],
            accepted_bindings: ['x', 'y', 'color'],
            grouping_bindings: []
        },

        // Render function for bar geometry
        render_function: function render_geom(_svg, layerName, _instructions, layerInfo, scalesAndTypes) {
            const { accessors, delegations, attributes } = layerInfo;
            const { var_bindings, var_attributes, var_groupies } = delegations;
        
            const groupedBarData = d3.group(_instructions.data, d => {
                const groupKey = var_groupies.map(key => accessors[key](d));
                return groupKey.join('|');
            });
        
            const barGroups = _svg.append('g')
                .selectAll('.bar-group')
                .data(groupedBarData)
                .join('g')
                .attr('class', 'bar-group')
                .attr('id', `layer-${layerName}`)  // Add layer ID;
        
            barGroups.selectAll('.bar')
                .data(d => d[1])
                .join('rect')
                .attr('x', d => scalesAndTypes.x.scale(accessors.x(d)))
                .attr('y', d => scalesAndTypes.y.scale(accessors.y(d)))
                .attr('width', scalesAndTypes.x.scale.bandwidth())
                .attr('height', d => {
                    const yValue = accessors.y(d);
                    return _instructions.dimensions.ctrHeight - scalesAndTypes.y.scale(yValue);
                })
                .attr('fill', d => {
                    if (var_bindings.includes('color')) {
                        return scalesAndTypes.color.scale(accessors.color(d));
                    } else if (var_attributes.includes('color')) {
                        return attributes.color;
                    } else {
                        return 'blue'; // Default fill color for bars
                    }
                })
                .attr('stroke', d => {
                    if (var_bindings.includes('stroke')) {
                        return scalesAndTypes.stroke.scale(accessors.stroke(d));
                    } else if (var_attributes.includes('stroke')) {
                        return attributes.stroke;
                    } else {
                        return 'none'; // Default stroke for bars
                    }
                })
                .attr('stroke-width', d => {
                    if (var_bindings.includes('size')) {
                        return scalesAndTypes.size.scale(accessors.size(d));
                    } else if (var_attributes.includes('size')) {
                        return attributes.size;
                    } else {
                        return 1;
                    }
                })
                .attr('opacity', 0.5);
        }
    }
};