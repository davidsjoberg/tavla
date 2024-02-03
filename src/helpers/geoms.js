export{loop_over_layers};

function loop_over_layers(_svg, _instructions) {
    const { scalesAndTypes } = _instructions;
    for (let layer in _instructions.layers) {
        const { geometry, accessors, delegations, attributes } = _instructions.layers[layer];
        const { var_bindings, var_attributes, var_groupies } = delegations;
        
        switch (geometry) {

            //////// POINTS //////////
            case "point":
                const groupedPointData = d3.group(_instructions.data, d => {
                    const groupKey = var_groupies.map(key => accessors[key](d));
                    return groupKey.join('|'); 
                });
                
                const geomPoints = _svg.append('g')
                    .selectAll('.point-group')
                    .data(groupedPointData)
                    .join('g')
                    .attr('class', 'point-group')
                    .selectAll('.point')
                    .data(d => d[1]) // Use the grouped data array for each point
                    .join('path')
                    .attr('transform', d => `translate(${scalesAndTypes.x.scale(accessors.x(d))}, ${scalesAndTypes.y.scale(accessors.y(d))})`)
                    .attr('fill', 'blue');

                // size
                if (var_bindings.includes('size')) {
                    geomPoints.attr('d', d3.symbol().size(d => scalesAndTypes.size.scale(accessors.size(d))));
                } else if (var_attributes.includes('size')) {
                    geomPoints.attr('d', d3.symbol().size(attributes.size * 64).type(d3.symbolCircle));
                } else {
                    geomPoints.attr('d', d3.symbol().size(64).type(d3.symbolCircle));
                }

                // colorss
                if (var_bindings.includes('color')) {
                    geomPoints.attr('fill', d => scalesAndTypes.color.scale(accessors.color(d)));
                } else if (var_attributes.includes('color')) {
                    geomPoints.attr('fill', attributes.color);
                } else {
                    geomPoints.attr('fill', 'black');
                }

                // stroke
                if (var_bindings.includes('stroke')) {
                    geomPoints.attr('stroke', d => scalesAndTypes.stroke.scale(accessors.stroke(d)));
                } else if (var_attributes.includes('stroke')) {
                    geomPoints.attr('stroke', attributes.stroke);
                } else {
                    geomPoints.attr('stroke', 'none')
                }

                break;
            
            //////// LINES //////////
            case "line":
                const groupedLineData = d3.group(_instructions.data, d => {
                    const groupKey = var_groupies.map(key => accessors[key](d));
                    return groupKey.join('|'); // Use a separator to create a unique key
                });

                const geomLines = _svg.append('g')
                    .selectAll('.line-group')
                    .data(groupedLineData)
                    .join('g')
                    .attr('class', 'line-group')
                    .selectAll('.line')
                    .data(d => [d[1]]) // Use the grouped data array for each line
                    .join('path')
                    .attr('d', d3.line()
                        .x(d => scalesAndTypes.x.scale(accessors.x(d)))
                        .y(d => scalesAndTypes.y.scale(accessors.y(d)))
                    )
                    .attr('fill', 'none')

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

                break;

            //////// Bars //////////
            case "bar":
                const groupedBarData = d3.group(_instructions.data, d => {
                    const groupKey = var_groupies.map(key => accessors[key](d));
                    return groupKey.join('|');
                });

                const barGroups = _svg.append('g')
                    .selectAll('.bar-group')
                    .data(groupedBarData)
                    .join('g')
                    .attr('class', 'bar-group');

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
                break;
            
            //////// Texts //////////
            case "text":
                const groupedTextData = d3.group(_instructions.data, d => {
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
                    .text(d => accessors.text(d));
                
                // size
                if (var_bindings.includes('size')) {
                    textElements.attr('font-size', d => Math.pow(scalesAndTypes.size.scale(accessors.size(d)), 0.2)*7);
                } else if (var_attributes.includes('size')) {
                    textElements.attr('font-size', attributes.size);
                } else {
                    textElements.attr('font-size', 20);
                }            

                // color
                if (var_bindings.includes('color')) {
                    textElements.attr('fill', d => scalesAndTypes.color.scale(accessors.color(d)));
                } else if (var_attributes.includes('color')) {
                    textElements.attr('fill', attributes.color)
                } else {
                    textElements.attr('fill', 'black');
                }

                break;

        }
    }
    return _svg;
}
