import * as textUtils from './text_utils.js';
import * as sizeUtils from './size_utils.js';

export {
  geomDatabase,
  getGeometryScaleConfig,
  getLegendRepresentation,
  getGeometryMargins,
  getPrimaryGeometry,
  applyGeometryScaleAdjustments,
  ensureElementsWithinBounds
};

/**
 * Database of geometry specifications
 * Each geometry is completely self-contained with all its required functionality
 */
const geomDatabase = {
    point: {
        id: 'point',
        description: 'Scatter plot points',
        utilities: ['getSymbolPath'],
        
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
        
        // Scale configuration specifically for this geometry
        scale_config: {
            padding: {
                x: 0.05,    // 5% padding on both sides of x-axis
                y: 0.05     // 5% padding on both sides of y-axis
            },
            useNice: false, // Don't use nice() for scatter plots to prevent overexpansion
            enforceZero: false // Don't force y-axis to include zero
        },
        
        // Function to adjust scales based on this geometry's needs
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
            
            // Calculate default sizes based on panel dimensions
            const defaultSizes = sizeUtils.calculateDefaultSizes(_instructions.dimensions);
            
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
            
            // Size - updated with panel-aware defaults and unit handling
            if (var_bindings.includes('size')) {
                // When size is bound to data, scale the values relative to panel
                geomPoints.attr('d', d => {
                    // Get data value from scale
                    const scaledValue = scalesAndTypes.size.scale(accessors.size(d));
                    
                    // For bound sizes, we use the scale's output as a multiplier for the default
                    const finalSize = sizeUtils.scaleToPanel(
                        scaledValue / 50, // Normalize scale output to be reasonable multipliers
                        'point',
                        'symbolSize',
                        defaultSizes
                    );
                    
                    return d3.symbol().type(d3.symbolCircle).size(finalSize)();
                });
            } else if (var_attributes.includes('size')) {
                // When size is provided as an attribute
                // Parse the size value to detect units
                const parsedSize = sizeUtils.parseSizeValue(attributes.size);
                
                // Convert to pixels based on unit and panel size
                const finalSize = sizeUtils.convertToPixels(
                    parsedSize,
                    'point',
                    'symbolSize',
                    defaultSizes
                );
                
                geomPoints.attr('d', d3.symbol().size(finalSize).type(d3.symbolCircle)());
            } else {
                // Use the default size based on panel dimensions
                geomPoints.attr('d', d3.symbol().size(defaultSizes.point.symbolSize).type(d3.symbolCircle)());
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
            
            // Stroke width - updated with panel-aware defaults and unit handling
            if (var_attributes.includes('strokeWidth')) {
                const parsedStrokeWidth = sizeUtils.parseSizeValue(attributes.strokeWidth);
                const finalStrokeWidth = sizeUtils.convertToPixels(
                    parsedStrokeWidth, 
                    'point', 
                    'strokeWidth',
                    defaultSizes
                );
                geomPoints.attr('stroke-width', finalStrokeWidth);
            } else {
                // Use the default stroke width based on panel dimensions
                geomPoints.attr('stroke-width', defaultSizes.point.strokeWidth);
            }
            
            // Alpha (transparency)
            if (var_bindings.includes('alpha')) {
                geomPoints.attr('opacity', d => scalesAndTypes.alpha.scale(accessors.alpha(d)));
            } else if (var_attributes.includes('alpha')) {
                geomPoints.attr('opacity', attributes.alpha);
            } else {
                geomPoints.attr('opacity', 0.7);
            }
        },
        
        // Legend representation configuration
        legend_representation: {
            discrete: (value, color, attributes) => {
                const shape = attributes.shape || 'circle';
                if (shape === 'circle') {
                    return {
                        type: 'circle',
                        attrs: {
                            cx: 6,
                            cy: 0,
                            r: 6,
                            fill: color,
                            stroke: 'black',
                            'stroke-width': 0.5
                        }
                    };
                } else {
                    return {
                        type: 'path',
                        attrs: {
                            transform: 'translate(6, 0)',
                            d: getSymbolPath(shape, 100),
                            fill: color,
                            stroke: 'black',
                            'stroke-width': 0.5
                        }
                    };
                }
            },
            continuous: (min, max, scale, attributes) => {
                // Configuration for continuous scales in legends
                return {
                    type: 'gradient',
                    height: 100,
                    width: 20,
                    valuePlacement: 'right'
                };
            }
        }
    },
    
    line: {
        id: 'line',
        description: 'Line chart',
        utilities: ['getStrokeDashArray'],
        
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
            
            // Calculate default sizes based on panel dimensions
            const defaultSizes = sizeUtils.calculateDefaultSizes(_instructions.dimensions);

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

            // Line size (thickness) - updated with panel-aware defaults and unit handling
            if (var_bindings.includes('size')) {
                geomLines.attr('stroke-width', d => {
                    // Get data value from scale
                    const scaledValue = scalesAndTypes.size.scale(accessors.size(d[0]));
                    
                    // Convert to appropriate size based on panel dimensions
                    return sizeUtils.scaleToPanel(
                        scaledValue / 50, // Normalize scale output
                        'line',
                        'strokeWidth',
                        defaultSizes
                    );
                });
            } else if (var_attributes.includes('size')) {
                // Parse the size value to detect units
                const parsedSize = sizeUtils.parseSizeValue(attributes.size);
                
                // Convert to pixels based on unit and panel size
                const finalSize = sizeUtils.convertToPixels(
                    parsedSize,
                    'line',
                    'strokeWidth',
                    defaultSizes
                );
                
                geomLines.attr('stroke-width', finalSize);
            } else {
                // Use the default size based on panel dimensions
                geomLines.attr('stroke-width', defaultSizes.line.strokeWidth);
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
        },
        
        // Legend representation configuration
        legend_representation: {
            discrete: (value, color, attributes) => {
                const lineType = attributes.lineType;
                const strokeDash = getStrokeDashArray(lineType);
                
                return {
                    type: 'line',
                    attrs: {
                        x1: 0,
                        y1: 0,
                        x2: 20, 
                        y2: 0,
                        stroke: color,
                        'stroke-width': (attributes.size || 2) * 1.2,
                        'stroke-dasharray': strokeDash
                    },
                    withPoint: attributes.withPoints === true,
                    pointAttrs: attributes.withPoints === true ? {
                        cx: 10,
                        cy: 0,
                        r: 4,
                        fill: color,
                        stroke: attributes.pointStroke || 'black',
                        'stroke-width': 0.8
                    } : null
                };
            },
            continuous: (min, max, scale, attributes) => {
                return {
                    type: 'gradient',
                    height: 100,
                    width: 20,
                    valuePlacement: 'right'
                };
            }
        }
    },
    
    text: {
        id: 'text',
        description: 'Text labels',
        utilities: ['calculateTextPosition'],
        
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

        // Render function for text geometry - with extreme size reduction
        render_function: function render_geom(_svg, layerName, _instructions, layerInfo, scalesAndTypes) {
            const { accessors, delegations, attributes, transformed_data } = layerInfo;
            const { var_bindings, var_attributes, var_groupies } = delegations;
            let layer_data = transformed_data || _instructions.data;
            
            // Calculate default sizes based on panel dimensions
            const defaultSizes = sizeUtils.calculateDefaultSizes(_instructions.dimensions);

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
                    .attr('text-anchor', attributes.textAnchor || 'middle')     // Center horizontally
                    .attr('dominant-baseline', attributes.baseline || 'middle')  // Center vertically
                    .text(accessors.text(d));
            });

            // Size - updated with ULTRA SMALL size handling
            if (var_bindings.includes('size')) {
                textElements.attr('font-size', d => {
                    // Get data value from scale
                    const scaledValue = scalesAndTypes.size.scale(accessors.size(d));
                    
                    // Apply an extreme size reduction
                    const baseSize = Math.pow(scaledValue / 50, 0.05) * (defaultSizes.text.fontSize * 0.6);
                    return baseSize; // Much smaller than previous implementation
                });
            } else if (var_attributes.includes('size')) {
                // Parse the size value to detect units
                const parsedSize = sizeUtils.parseSizeValue(attributes.size);
                
                // For relative sizes, scale down drastically
                if (parsedSize.unit === 'relative') {
                    parsedSize.value = parsedSize.value * 0.2; // Reduce by 80%
                }
                
                // Convert to pixels based on unit and panel size
                const finalSize = sizeUtils.convertToPixels(
                    parsedSize,
                    'text',
                    'fontSize',
                    defaultSizes
                );
                
                textElements.attr('font-size', finalSize);
            } else {
                // Use the default size based on panel dimensions
                // This is already heavily reduced in the calculateDefaultSizes function
                textElements.attr('font-size', defaultSizes.text.fontSize);
            }

            // Additional font weight adjustment to improve readability at small sizes
            textElements.attr('font-weight', attributes.fontWeight || 'normal');

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
        },
        
        // Legend representation configuration
        legend_representation: {
            discrete: (value, color, attributes) => {
                return {
                    type: 'text',
                    attrs: {
                        x: 6,
                        y: 0,
                        'text-anchor': 'middle',
                        fill: color,
                        'font-size': attributes.size || 12
                    },
                    text: 'T'
                };
            },
            continuous: (min, max, scale, attributes) => {
                return {
                    type: 'gradient',
                    height: 100,
                    width: 20,
                    valuePlacement: 'right'
                };
            }
        }
    },
    
    bar: {
        id: 'bar',
        description: 'Bar chart',
        utilities: [],
        
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
            
            // Calculate default sizes based on panel dimensions
            const defaultSizes = sizeUtils.calculateDefaultSizes(_instructions.dimensions);

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
                
                // Check if color is bound to data, otherwise use a single category
                // This fixes the issue with simple bar charts that have no color binding
                let colorValues;
                if (accessors.color) {
                    colorValues = [...new Set(layer_data.map(d => accessors.color(d)))];
                } else {
                    colorValues = ['default']; // Use a single default when no color binding
                }
                
                // Create a scale for bar positioning within group
                const barPadding = attributes.barPadding !== undefined ? attributes.barPadding : 0.05;
                const subgroupScale = d3.scaleBand()
                    .domain(colorValues)
                    .range([0, scalesAndTypes.x.scale.bandwidth()])
                    .padding(barPadding);
                
                // For each category, create bars for each subgroup
                const data = []; // Collect all bar data first instead of appending directly
                
                groupedBarData.forEach((categoryData, category) => {
                    if (colorValues.length === 1 && colorValues[0] === 'default') {
                        // Handle simple bar chart case with no color binding
                        categoryData.forEach(d => {
                            const yValue = accessors.y(d);
                            const barY = yValue >= 0 ? scalesAndTypes.y.scale(yValue) : zeroY;
                            const barHeight = Math.abs(zeroY - scalesAndTypes.y.scale(yValue));
                            
                            // Ensure positive bars don't touch the x-axis
                            const adjustedHeight = yValue >= 0 ? 
                                Math.max(0, barHeight - axisBuffer) : barHeight;
                            
                            data.push({
                                x: scalesAndTypes.x.scale(category),
                                y: barY,
                                width: scalesAndTypes.x.scale.bandwidth(),
                                height: adjustedHeight,
                                color: attributes.color || 'steelblue',
                                stroke: attributes.stroke || 'none',
                                strokeWidth: attributes.strokeWidth || 1,
                                opacity: attributes.alpha || 0.8,
                                originalData: d
                            });
                        });
                    } else {
                        // Handle grouped bar chart case with color binding
                        categoryData.forEach(d => {
                            const colorValue = accessors.color ? accessors.color(d) : 'default';
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
                                color: var_bindings.includes('color') && accessors.color ? 
                                    scalesAndTypes.color.scale(colorValue) : (attributes.color || 'steelblue'),
                                stroke: attributes.stroke || 'none',
                                strokeWidth: attributes.strokeWidth || 1,
                                opacity: attributes.alpha || 0.8,
                                originalData: d
                            });
                        });
                    }
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
        },
        
        // Legend representation configuration
        legend_representation: {
            discrete: (value, color, attributes) => {
                return {
                    type: 'rect',
                    attrs: {
                        x: 0,
                        y: -6,
                        width: 12,
                        height: 12,
                        fill: color,
                        stroke: attributes.stroke || 'black',
                        'stroke-width': 0.5
                    }
                };
            },
            continuous: (min, max, scale, attributes) => {
                return {
                    type: 'gradient',
                    height: 100,
                    width: 20,
                    valuePlacement: 'right'
                };
            }
        }
    }
};

/**
 * Returns the scale configuration for a given geometry type
 * @param {string} geometryType - Type of geometry
 * @return {object} Scale configuration
 */
function getGeometryScaleConfig(geometryType) {
    const defaultConfig = {
        padding: { x: 0.05, y: 0.05 },
        useNice: true,
        enforceZero: false
    };
    
    if (!geometryType || !geomDatabase[geometryType]) {
        return defaultConfig;
    }
    
    return geomDatabase[geometryType].scale_config || defaultConfig;
}

/**
 * Returns the legend representation for a given geometry type
 * @param {string} geometryType - Type of geometry
 * @param {boolean} isDiscrete - Whether the scale is discrete
 * @param {*} value - Value to represent
 * @param {string} color - Color to use
 * @param {object} attributes - Additional attributes
 * @return {object} Legend representation configuration
 */
function getLegendRepresentation(geometryType, isDiscrete, value, color, attributes) {
    if (!geometryType || !geomDatabase[geometryType]) {
        // Default representation is a colored rectangle
        return {
            type: 'rect',
            attrs: {
                x: 0,
                y: -6,
                width: 12,
                height: 12,
                fill: color,
                stroke: 'black',
                'stroke-width': 0.5
            }
        };
    }
    
    const legendConfig = geomDatabase[geometryType].legend_representation;
    if (!legendConfig) return null;
    
    if (isDiscrete && legendConfig.discrete) {
        return legendConfig.discrete(value, color, attributes || {});
    } else if (!isDiscrete && legendConfig.continuous) {
        return legendConfig.continuous(value, color, attributes || {});
    }
    
    return null;
}

/**
 * Returns margin specifications for a given geometry type
 * @param {string} geometryType - Type of geometry
 * @return {object} Margin specifications
 */
function getGeometryMargins(geometryType) {
    const defaultMargins = {
        top: 0.02,
        right: 0.06,
        bottom: 0.08,
        left: 0.08
    };
    
    if (!geometryType || !geomDatabase[geometryType]) {
        return defaultMargins;
    }
    
    return geomDatabase[geometryType].margin_specs || defaultMargins;
}

/**
 * Determines the primary geometry type from layers
 * @param {object} layers - Layers configuration
 * @return {string} Primary geometry type
 */
function getPrimaryGeometry(layers) {
    if (!layers || Object.keys(layers).length === 0) {
        return 'point'; // Default
    }
    
    // Get the first layer's geometry type
    return Object.values(layers)[0]?.geometry || 'point';
}

/**
 * Applies padding and scale adjustments based on geometry type
 * MOVED FROM dirigent.js to maintain layer-specific logic here
 * @param {object} instructions - Instruction object
 * @return {object} Updated instruction object
 */
function applyGeometryScaleAdjustments(instructions) {
    const { scalesAndTypes, layers, extents, dimensions, layerBoundingBoxes } = instructions;
    
    // Get the primary geometry type
    const primaryGeometry = getPrimaryGeometry(layers);
    
    // Get the geometry-specific configuration
    const geometry = geomDatabase[primaryGeometry];
    
    // If this geometry has a custom scale adjustment function, use it
    if (geometry && typeof geometry.adjust_scales === 'function') {
        return {
            ...instructions,
            scalesAndTypes: geometry.adjust_scales(scalesAndTypes, extents, dimensions, layerBoundingBoxes)
        };
    }
    
    // Otherwise use the standard approach with geometry's scale config
    const scaleConfig = getGeometryScaleConfig(primaryGeometry);
    
    // Handle X-axis padding based on scale type
    if (scalesAndTypes.x && scalesAndTypes.x.type === "number" && 
        typeof scalesAndTypes.x.scale.invert === 'function') {
        
        // Get current domain
        const domain = scalesAndTypes.x.scale.domain();
        const dataRange = domain[1] - domain[0];
        
        // Calculate padding amount based on data range and geometry-specific config
        const padding = dataRange * scaleConfig.padding.x;
        
        // Apply padding consistently
        const newDomain = [domain[0] - padding, domain[1] + padding];
        
        // Apply nice() based on geometry preference
        if (scaleConfig.useNice) {
            scalesAndTypes.x.scale.domain(newDomain).nice();
        } else {
            scalesAndTypes.x.scale.domain(newDomain);
        }
    }
    
    // Handle Y-axis padding based on chart type
    if (scalesAndTypes.y && scalesAndTypes.y.type === "number" && 
        typeof scalesAndTypes.y.scale.invert === 'function') {
        
        // For geometries that enforce zero on Y-axis (like bars)
        if (scaleConfig.enforceZero) {
            const yMax = scalesAndTypes.y.scale.domain()[1];
            const yPadding = yMax * scaleConfig.padding.y;
            scalesAndTypes.y.scale.domain([0, yMax + yPadding])
                .nice(scaleConfig.useNice ? undefined : null);
        } 
        else {
            // For other chart types, apply padding to both sides
            const domain = scalesAndTypes.y.scale.domain();
            const dataRange = domain[1] - domain[0];
            const padding = dataRange * scaleConfig.padding.y;
            
            const newDomain = [domain[0] - padding, domain[1] + padding];
            
            // Apply nice() based on geometry preference
            if (scaleConfig.useNice) {
                scalesAndTypes.y.scale.domain(newDomain).nice();
            } else {
                scalesAndTypes.y.scale.domain(newDomain);
            }
        }
    }
    
    return instructions;
}

/**
 * Ensures all elements are within bounds by adjusting scales
 * MOVED FROM dirigent.js to maintain layer-specific logic here
 * @param {object} instructions - Instruction object
 * @param {object} layerBoundingBoxes - Bounding boxes for each layer
 * @return {object} Updated instruction object
 */
function ensureElementsWithinBounds(instructions, layerBoundingBoxes) {
    const { scalesAndTypes, dimensions } = instructions;
    
    // Ensure we have bounding boxes to work with
    if (!layerBoundingBoxes || Object.keys(layerBoundingBoxes).length === 0) {
        return instructions; // Can't do any adjustments
    }
    
    // Get the plot area bounds
    const plotWidth = dimensions.ctrWidth;
    const plotHeight = dimensions.ctrHeight;
    
    // Calculate a proportional safety buffer based on plot size
    const safetyBuffer = Math.max(5, Math.min(plotWidth, plotHeight) * 0.01);
    
    // Find min/max values across all layers
    let overallMinX = Infinity, overallMinY = Infinity;
    let overallMaxX = -Infinity, overallMaxY = -Infinity;
    
    Object.values(layerBoundingBoxes).forEach(bbox => {
        overallMinX = Math.min(overallMinX, bbox.minX);
        overallMinY = Math.min(overallMinY, bbox.minY);
        overallMaxX = Math.max(overallMaxX, bbox.maxX);
        overallMaxY = Math.max(overallMaxY, bbox.maxY);
    });
    
    // Add buffer to ensure elements remain fully inside
    const leftOverflow = (overallMinX < safetyBuffer) ? safetyBuffer - overallMinX : 0;
    const rightOverflow = (overallMaxX > plotWidth - safetyBuffer) ? overallMaxX - (plotWidth - safetyBuffer) : 0;
    const topOverflow = (overallMinY < safetyBuffer) ? safetyBuffer - overallMinY : 0;
    const bottomOverflow = (overallMaxY > plotHeight - safetyBuffer) ? overallMaxY - (plotHeight - safetyBuffer) : 0;
    
    // If there's any overflow, adjust the scales
    if (leftOverflow > 0 || rightOverflow > 0) {
        // Adjust x scale to accommodate overflow
        if (scalesAndTypes.x && scalesAndTypes.x.type === "number") {
            const xScale = scalesAndTypes.x.scale;
            if (typeof xScale.invert === 'function') {
                const domain = xScale.domain();
                const dataRange = domain[1] - domain[0];
                const pixelRange = plotWidth;
                const dataPerPixel = dataRange / pixelRange;
                
                const newXMin = domain[0] - (leftOverflow * dataPerPixel);
                const newXMax = domain[1] + (rightOverflow * dataPerPixel);
                
                xScale.domain([newXMin, newXMax]);
            }
        }
    }
    
    if (topOverflow > 0 || bottomOverflow > 0) {
        // Adjust y scale to accommodate overflow
        if (scalesAndTypes.y && scalesAndTypes.y.type === "number") {
            const yScale = scalesAndTypes.y.scale;
            if (typeof yScale.invert === 'function') {
                const domain = yScale.domain();
                const dataRange = domain[1] - domain[0];
                const pixelRange = plotHeight;
                const dataPerPixel = dataRange / pixelRange;
                
                const newYMin = domain[0] - (bottomOverflow * dataPerPixel);
                const newYMax = domain[1] + (topOverflow * dataPerPixel);
                
                yScale.domain([newYMin, newYMax]);
            }
        }
    }
    
    return instructions;
}

/**
 * Gets the stroke-dasharray value for a line type
 */
function getStrokeDashArray(lineType) {
  switch(lineType) {
    case 'dashed':
      return "5,5";
    case 'dotted':
      return "1,3";
    case 'dashdot':
      return "10,5,2,5";
    default:
      return null; // Solid line
  }
}

/**
 * Gets the d3 symbol path for a given shape
 */
function getSymbolPath(shape, size) {
  const symbolMap = {
    'circle': d3.symbolCircle,
    'cross': d3.symbolCross,
    'diamond': d3.symbolDiamond,
    'square': d3.symbolSquare,
    'star': d3.symbolStar,
    'triangle': d3.symbolTriangle,
    'wye': d3.symbolWye
  };
  
  const symbolFunc = symbolMap[shape] || d3.symbolCircle;
  return d3.symbol().type(symbolFunc).size(size)();
}

/**
 * Updates scales range based on data values and geometry default sizes
 * @param {object} instructions - Instruction object with dimensions and scales
 */
function updateScaleRanges(instructions) {
    const { dimensions, scalesAndTypes } = instructions;
    const defaultSizes = sizeUtils.calculateDefaultSizes(dimensions);
    
    // For each scale type, update based on panel size
    for (const key in scalesAndTypes) {
        if (key === 'size') {
            // Size scales should be based on panel dimensions
            // For example, point sizes might range from 0.2x to 3x the default
            const minSize = defaultSizes.point.symbolSize * 0.2;  // 20% of default 
            const maxSize = defaultSizes.point.symbolSize * 3;    // 3x default
            
            // If it's a numeric scale, use these values as the range
            if (scalesAndTypes[key].type === "number") {
                scalesAndTypes[key].scale.range([minSize, maxSize]);
            }
        }
        // Similar adjustments could be made for other scale types
    }
    
    return instructions;
}

// ...other helper functions...