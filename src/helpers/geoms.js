import * as textUtils from './text_utils.js';

export {geomDatabase};

// Binding rules
const geomDatabase = {
    point: {
        // Binding rules
        binding_rules: {
            required_bindings: ['x', 'y'],
            accepted_bindings: ['x', 'y', 'color', 'fill', 'size', 'alpha', 'stroke', 'shape'],
            grouping_bindings: ['color', 'fill', 'shape']
        },

        // Margin specifications for point geometry
        margin_specs: {
            top: 0.01,     // 1% of width
            right: 0.02,   // 2% of width
            bottom: 0.08,  // 8% of width
            left: 0.02     // 2% of width
        },
        
        // Scale adjustment function for point geometry
        adjust_scales: function(scalesAndTypes, extents, dimensions, layerBoundingBoxes) {
            // Analyze all layers to determine proper padding
            let needsExtraPadding = false;
            let textLayerPresent = false;
            
            // Check if we have text layers that might extend beyond points
            if (layerBoundingBoxes) {
                for (const layerId in layerBoundingBoxes) {
                    // Check if this layer is significantly larger than others
                    const bbox = layerBoundingBoxes[layerId];
                    if (bbox.width > dimensions.ctrWidth * 0.8 || 
                        bbox.height > dimensions.ctrHeight * 0.8) {
                        needsExtraPadding = true;
                    }
                    
                    // Check for text layers specifically
                    if (layerId.includes('text') || layerId.includes('label')) {
                        textLayerPresent = true;
                    }
                }
            }
            
            // Adjust padding based on presence of text or large elements
            const paddingFactor = (needsExtraPadding || textLayerPresent) ? 0.05 : 0.03;
            
            if (scalesAndTypes.x.type === "number" && typeof scalesAndTypes.x.scale.invert === 'function') {
                const xPadding = (extents.xDataMax - extents.xDataMin) * paddingFactor;
                // Apply padding evenly for x-axis
                scalesAndTypes.x.scale.domain([
                    extents.xDataMin - xPadding, 
                    extents.xDataMax + xPadding
                ]).nice();
            }
            
            if (scalesAndTypes.y.type === "number" && typeof scalesAndTypes.y.scale.invert === 'function') {
                const yPadding = (extents.yDataMax - extents.yDataMin) * paddingFactor;
                // Apply padding evenly for y-axis
                scalesAndTypes.y.scale.domain([
                    extents.yDataMin - yPadding, 
                    extents.yDataMax + yPadding
                ]).nice();
            }
            
            return scalesAndTypes;
        },

        // Render function for point geometry
        render_function: function render_geom(_svg, layerName, _instructions, layerInfo, scalesAndTypes) {
            const { accessors, delegations, attributes, transformed_data } = layerInfo;
            const { var_bindings, var_attributes, var_groupies } = delegations;
            let layer_data = transformed_data || _instructions.data;
        
            const geomPoints = _svg.append('g')
                .selectAll('.point-group')
                .data(d3.group(layer_data, d => {
                    const groupKey = var_groupies.map(key => accessors[key](d)).join('|');
                    return groupKey;
                }))
                .join('g')
                .attr('class', 'point-group')
                .attr('id', `layer-${layerName}`)
                .attr('group-id', d => d[0])
                .selectAll('.point')
                .data(d => d[1])
                .join('path')
                .attr('transform', d => `translate(${scalesAndTypes.x.scale(accessors.x(d))}, ${scalesAndTypes.y.scale(accessors.y(d))})`)
        
            // Size
            if (var_bindings.includes('size')) {
                geomPoints.attr('d', d => d3.symbol().type(d3.symbolCircle).size(scalesAndTypes.size.scale(accessors.size(d)))());
            } else if (var_attributes.includes('size')) {
                geomPoints.attr('d', d3.symbol().size(attributes.size * 64).type(d3.symbolCircle)());
            } else {
                geomPoints.attr('d', d3.symbol().size(64).type(d3.symbolCircle)());
            }
        
            // Shape
            if (var_bindings.includes('shape')) {
                // Not implemented yet - would need a scale for shape types
            }
            
            // Fill
            if (var_bindings.includes('fill')) {
                geomPoints.attr('fill', d => scalesAndTypes.fill.scale(accessors.fill(d)));
            } else if (var_bindings.includes('color')) {
                geomPoints.attr('fill', d => scalesAndTypes.color.scale(accessors.color(d)));
            } else if (var_attributes.includes('fill')) {
                geomPoints.attr('fill', attributes.fill);
            } else if (var_attributes.includes('color')) {
                geomPoints.attr('fill', attributes.color);
            } else {
                geomPoints.attr('fill', 'steelblue');
            }
        
            // Stroke color
            if (var_bindings.includes('stroke')) {
                geomPoints.attr('stroke', d => scalesAndTypes.stroke.scale(accessors.stroke(d)));
            } else if (var_attributes.includes('stroke')) {
                geomPoints.attr('stroke', attributes.stroke);
            } else {
                geomPoints.attr('stroke', 'black');
            }
            
            // Stroke width
            if (var_attributes.includes('strokeWidth')) {
                geomPoints.attr('stroke-width', attributes.strokeWidth);
            } else {
                geomPoints.attr('stroke-width', 1);
            }
            
            // Alpha (transparency)
            if (var_bindings.includes('alpha')) {
                geomPoints.attr('opacity', d => scalesAndTypes.alpha.scale(accessors.alpha(d)));
            } else if (var_attributes.includes('alpha')) {
                geomPoints.attr('opacity', attributes.alpha);
            } else {
                geomPoints.attr('opacity', 0.7);
            }
        }
    },
    
    line: {
        // Binding rules
        binding_rules: {
            required_bindings: ['x', 'y'],
            accepted_bindings: ['x', 'y', 'color', 'fill', 'size', 'alpha', 'stroke', 'lineType'],
            grouping_bindings: ['color', 'fill', 'lineType']
        },
        
        // Margin specifications for line geometry
        margin_specs: {
            top: 0.02,     // 2% of width
            right: 0.06,   // 6% of width
            bottom: 0.08,  // 8% of width
            left: 0.08     // 8% of width
        },
        
        // Scale adjustment function for line geometry - improve padding consistency
        adjust_scales: function(scalesAndTypes, extents, dimensions) {
            // Apply more consistent padding for line charts
            if (scalesAndTypes.x.type === "number" && typeof scalesAndTypes.x.scale.invert === 'function') {
                // Use a fixed percentage for padding to ensure consistency
                const xRange = extents.xDataMax - extents.xDataMin;
                const xPadding = xRange * 0.1; // 10% padding on each side
                
                scalesAndTypes.x.scale.domain([
                    extents.xDataMin - xPadding, 
                    extents.xDataMax + xPadding
                ]).nice();
            }
            
            if (scalesAndTypes.y.type === "number" && typeof scalesAndTypes.y.scale.invert === 'function') {
                // Use percentage-based padding for Y axis as well
                const yRange = extents.yDataMax - extents.yDataMin;
                const yPadding = yRange * 0.1; // 10% padding on top and bottom
                
                scalesAndTypes.y.scale.domain([
                    extents.yDataMin - yPadding, 
                    extents.yDataMax + yPadding
                ]).nice();
            }
            
            return scalesAndTypes;
        },
    
        // Render function for line geometry
        render_function: function render_geom(_svg, layerName, _instructions, layerInfo, scalesAndTypes) {
            const { accessors, delegations, attributes, transformed_data } = layerInfo;
            const { var_bindings, var_attributes, var_groupies } = delegations;

            const layer_data = transformed_data || _instructions.data;

            if (!accessors.x || !accessors.y) {
                throw new Error("Missing required accessors for 'x' and/or 'y'.");
            }

            const geomLines = _svg.append('g')
                .selectAll('.line-group')
                .data(d3.group(layer_data, d => {
                    const groupKey = var_groupies.map(key => accessors[key](d)).join('|');
                    return groupKey;
                }))
                .join('g')
                .attr('class', 'line-group')
                .attr('id', `layer-${layerName}`)
                .attr('group-id', d => d[0])
                .selectAll('.line')
                .data(d => [d[1]])
                .join('path')
                .attr('d', d3.line()
                    .x(d => scalesAndTypes.x.scale(accessors.x(d)))
                    .y(d => scalesAndTypes.y.scale(accessors.y(d)))
                )
                .attr('fill', 'none');

            // Line size (thickness)
            if (var_bindings.includes('size')) {
                geomLines.attr('stroke-width', d => scalesAndTypes.size.scale(accessors.size(d[0])));
            } else if (var_attributes.includes('size')) {
                geomLines.attr('stroke-width', attributes.size);
            } else {
                geomLines.attr('stroke-width', 2);
            }            

            // Line color
            if (var_bindings.includes('color')) {
                geomLines.attr('stroke', d => scalesAndTypes.color.scale(accessors.color(d[0])));
            } else if (var_attributes.includes('color')) {
                geomLines.attr('stroke', attributes.color);
            } else {
                geomLines.attr('stroke', 'steelblue');
            }
            
            // Line type (dashed, dotted, etc)
            if (var_bindings.includes('lineType')) {
                // Would need a scale for line types
            } else if (var_attributes.includes('lineType')) {
                switch(attributes.lineType) {
                    case 'dashed':
                        geomLines.attr('stroke-dasharray', '5,5');
                        break;
                    case 'dotted':
                        geomLines.attr('stroke-dasharray', '1,3');
                        break;
                    case 'dashdot':
                        geomLines.attr('stroke-dasharray', '10,5,2,5');
                        break;
                }
            }
            
            // Alpha (transparency)
            if (var_bindings.includes('alpha')) {
                geomLines.attr('opacity', d => scalesAndTypes.alpha.scale(accessors.alpha(d[0])));
            } else if (var_attributes.includes('alpha')) {
                geomLines.attr('opacity', attributes.alpha);
            } else {
                geomLines.attr('opacity', 0.9);
            }
        }
    },
    
    text: {
        // Binding rules
        binding_rules: {
            required_bindings: ['x', 'y', 'text'],
            accepted_bindings: ['x', 'y', 'text', 'color', 'fill', 'size', 'alpha'],
            grouping_bindings: ['color', 'fill', 'size'] 
        },
        
        // Margin specifications for text geometry
        margin_specs: {
            top: 0.02,     // 2% of width
            right: 0.06,   // 6% of width
            bottom: 0.08,  // 8% of width
            left: 0.08     // 8% of width
        },
        
        // Scale adjustment function for text geometry
        adjust_scales: function(scalesAndTypes, extents, dimensions) {
            if (scalesAndTypes.x.type === "number" && typeof scalesAndTypes.x.scale.invert === 'function') {
                const xPadding = (extents.xDataMax - extents.xDataMin) * 0.05;
                scalesAndTypes.x.scale.domain([
                    extents.xDataMin - xPadding, 
                    extents.xDataMax + xPadding
                ]).nice();
            }
            
            if (scalesAndTypes.y.type === "number" && typeof scalesAndTypes.y.scale.invert === 'function') {
                const yPadding = (extents.yDataMax - extents.yDataMin) * 0.08;
                scalesAndTypes.y.scale.domain([
                    extents.yDataMin - yPadding, 
                    extents.yDataMax + yPadding
                ]).nice();
            }
            
            return scalesAndTypes;
        },

        // Render function for text geometry
        render_function: function render_geom(_svg, layerName, _instructions, layerInfo, scalesAndTypes) {
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
                .attr('id', `layer-${layerName}`);

            // Use the text utilities for positioning
            textElements.each(function(d) {
                const position = textUtils.calculateTextPosition(d, accessors, scalesAndTypes, _instructions, attributes);
                d3.select(this)
                    .attr('x', position.x)
                    .attr('y', position.y)
                    .attr('text-anchor', 'middle') // Center text horizontally
                    .text(accessors.text(d));
            });

            // Size
            if (var_bindings.includes('size')) {
                textElements.attr('font-size', d => Math.pow(scalesAndTypes.size.scale(accessors.size(d)), 0.2) * 7);
            } else if (var_attributes.includes('size')) {
                textElements.attr('font-size', attributes.size);
            } else {
                textElements.attr('font-size', 12);
            }

            // Fill/Color
            if (var_bindings.includes('color')) {
                textElements.attr('fill', d => scalesAndTypes.color.scale(accessors.color(d)));
            } else if (var_bindings.includes('fill')) {
                textElements.attr('fill', d => scalesAndTypes.fill.scale(accessors.fill(d)));
            } else if (var_attributes.includes('color')) {
                textElements.attr('fill', attributes.color);
            } else if (var_attributes.includes('fill')) {
                textElements.attr('fill', attributes.fill);
            } else {
                textElements.attr('fill', 'black');
            }
            
            // Alpha (transparency)
            if (var_bindings.includes('alpha')) {
                textElements.attr('opacity', d => scalesAndTypes.alpha.scale(accessors.alpha(d)));
            } else if (var_attributes.includes('alpha')) {
                textElements.attr('opacity', attributes.alpha);
            } else {
                textElements.attr('opacity', 0.85);
            }
        }
    },
    
    bar: {
        // Binding rules
        binding_rules: {
            required_bindings: ['x', 'y'],
            accepted_bindings: ['x', 'y', 'color', 'fill', 'alpha', 'stroke'],
            grouping_bindings: ['color', 'fill']
        },
        
        // Margin specifications for bar geometry
        margin_specs: {
            top: 0.02,     // 2% of width
            right: 0.06,   // 6% of width
            bottom: 0.08,  // 8% of width
            left: 0.08     // 8% of width
        },
        
        // Scale adjustment function for bar geometry
        adjust_scales: function(scalesAndTypes, extents, dimensions) {
            // For x-axis (usually categorical for bar charts), we don't need special handling
            
            // For y-axis, ensure it always includes zero
            if (scalesAndTypes.y.type === "number" && typeof scalesAndTypes.y.scale.invert === 'function') {
                // Always include zero and add padding to the top
                const yMax = extents.yDataMax * 1.05;
                const yMin = 0; // Always start from 0 for bar charts
                
                scalesAndTypes.y.scale.domain([yMin, yMax]).nice();
            }
            
            return scalesAndTypes;
        },

        // Data transformation function for bar geometry
        data_transform: function(data, layerInfo) {
            // We'll keep the original data structure
            return data;
        },

        // Render function for bar geometry with improved text label positioning
        render_function: function render_geom(_svg, layerName, _instructions, layerInfo, scalesAndTypes) {
            const { accessors, delegations, attributes } = layerInfo;
            const { var_bindings, var_attributes, var_groupies } = delegations;
            const layer_data = _instructions.data;

            // Get bar type - default to 'dodge' if not specified
            const barType = attributes.type || 'dodge';
            
            // Group data by x categories
            const groupedBarData = d3.group(layer_data, d => accessors.x(d));

            // Create group for bars
            const barGroups = _svg.append('g')
                .attr('class', 'bar-group')
                .attr('id', `layer-${layerName}`);

            // Calculate zero y-position for proper height rendering
            const zeroY = scalesAndTypes.y.scale(0);
            
            // Set padding values with safe defaults
            const groupPadding = attributes.groupPadding !== undefined ? attributes.groupPadding : 0.1;
            
            // Set x-scale padding
            if (scalesAndTypes.x.scale.padding) {
                scalesAndTypes.x.scale.padding(groupPadding);
            }
            
            // Render based on bar type
            if (barType === 'dodge') {
                // Calculate a small adjustment to prevent bars from touching the axis
                const axisBuffer = 2; // 2px buffer for more space
                
                // Get unique color values to create subgroups
                const colorValues = [...new Set(layer_data.map(d => accessors.color(d)))];
                
                // Create a scale for bar positioning within group
                const barPadding = attributes.barPadding !== undefined ? attributes.barPadding : 0.05;
                const subgroupScale = d3.scaleBand()
                    .domain(colorValues)
                    .range([0, scalesAndTypes.x.scale.bandwidth()])
                    .padding(barPadding);
                
                // For each category, create bars for each subgroup
                const data = []; // Collect all bar data first instead of appending directly
                
                groupedBarData.forEach((categoryData, category) => {
                    categoryData.forEach(d => {
                        const colorValue = accessors.color(d);
                        const yValue = accessors.y(d);
                        const barY = yValue >= 0 ? scalesAndTypes.y.scale(yValue) : zeroY;
                        const barHeight = Math.abs(zeroY - scalesAndTypes.y.scale(yValue));
                        
                        // Ensure positive bars don't touch the x-axis
                        const adjustedHeight = yValue >= 0 ? 
                            Math.max(0, barHeight - axisBuffer) : barHeight;
                        
                        data.push({
                            x: scalesAndTypes.x.scale(category) + subgroupScale(colorValue),
                            y: barY,
                            width: subgroupScale.bandwidth(),
                            height: adjustedHeight,
                            color: var_bindings.includes('color') ? 
                                scalesAndTypes.color.scale(colorValue) : 'steelblue',
                            stroke: attributes.stroke || 'none',
                            strokeWidth: attributes.strokeWidth || 1,
                            opacity: attributes.alpha || 0.8,
                            originalData: d
                        });
                    });
                });
                
                // Add all bars at once to avoid stray lines
                barGroups.selectAll('.bar')
                    .data(data)
                    .enter()
                    .append('rect')
                    .attr('class', 'bar')
                    .attr('x', d => d.x)
                    .attr('y', d => d.y)
                    .attr('width', d => d.width)
                    .attr('height', d => d.height)
                    .attr('fill', d => d.color)
                    .attr('stroke', d => d.stroke)
                    .attr('stroke-width', d => d.strokeWidth)
                    .attr('opacity', d => d.opacity);
            } 
            else if (barType === 'stack') {
                // Fix stacked bar implementation with similar approach
                // Calculate a small adjustment to prevent bars from touching the axis
                const axisBuffer = 2; // 2px buffer for clarity
                
                // Get unique color values for stacking
                const colorValues = [...new Set(layer_data.map(d => accessors.color(d)))];
                
                // Prepare data for d3.stack
                const stackData = Array.from(groupedBarData, ([key, values]) => {
                    const obj = { category: key };
                    values.forEach(v => {
                        obj[accessors.color(v)] = accessors.y(v);
                    });
                    return obj;
                });
                
                // Create stack generator
                const stackGen = d3.stack()
                    .keys(colorValues)
                    .order(d3.stackOrderNone)
                    .offset(d3.stackOffsetNone);
                
                // Generate stacked data
                const stackedData = stackGen(stackData);
                
                // Prepare all bars data first
                const allBars = [];
                
                stackedData.forEach((layer, i) => {
                    layer.forEach((d, j) => {
                        // Apply buffer to prevent covering axis
                        const rawHeight = scalesAndTypes.y.scale(d[0]) - scalesAndTypes.y.scale(d[1]);
                        // If this is the bottom segment, adjust height
                        const isBottom = d[0] === 0;
                        const height = isBottom ? Math.max(0, rawHeight - axisBuffer) : rawHeight;
                        
                        allBars.push({
                            x: scalesAndTypes.x.scale(stackData[j].category),
                            y: scalesAndTypes.y.scale(d[1]),
                            width: scalesAndTypes.x.scale.bandwidth(),
                            height: height,
                            fill: var_bindings.includes('color') ? 
                                scalesAndTypes.color.scale(colorValues[i]) : 'steelblue',
                            stroke: attributes.stroke || 'none',
                            strokeWidth: attributes.strokeWidth || 1,
                            opacity: attributes.alpha || 0.8,
                            class: `bar-stack-${i}`
                        });
                    });
                });
                
                // Draw all stacked bars at once to avoid artifacts
                barGroups.selectAll('.bar-stack')
                    .data(allBars)
                    .enter()
                    .append('rect')
                    .attr('class', d => d.class)
                    .attr('x', d => d.x)
                    .attr('y', d => d.y)
                    .attr('width', d => d.width)
                    .attr('height', d => d.height)
                    .attr('fill', d => d.fill)
                    .attr('stroke', d => d.stroke)
                    .attr('stroke-width', d => d.strokeWidth)
                    .attr('opacity', d => d.opacity);
            }
            
            return barGroups;
        }
    }
};