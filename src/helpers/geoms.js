export{loop_over_layers, add_text};

function loop_over_layers(_svg, _instructions) {
    for (let layer in _instructions.layers) {
        const { geometry, accessors, scales, delegations, attributes } = _instructions.layers[layer];
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
                    .attr('transform', d => `translate(${scales.x(accessors.x(d))}, ${scales.y(accessors.y(d))})`)
                    .attr('fill', 'blue');
                    // .attr('d', d3.symbol().size(50).type(d3.symbolCircle));

                // size
                if (var_bindings.includes('size')) {
                    geomPoints.attr('d', d3.symbol().size(d => scales.size(accessors.size(d))));
                } else if (var_attributes.includes('size')) {
                    geomPoints.attr('d', d3.symbol().size(attributes.size * 64).type(d3.symbolCircle));
                } else {
                    geomPoints.attr('d', d3.symbol().size(64).type(d3.symbolCircle));
                }

                // color
                if (var_bindings.includes('color')) {
                    geomPoints.attr('fill', d => scales.color(accessors.color(d)));
                } else if (var_attributes.includes('color')) {
                    geomPoints.attr('fill', attributes.color);
                } else {
                    geomPoints.attr('fill', 'black');
                }

                // stroke
                if (var_bindings.includes('stroke')) {
                    geomPoints.attr('stroke', d => scales.stroke(accessors.stroke(d)));
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
                        .x(d => scales.x(accessors.x(d)))
                        .y(d => scales.y(accessors.y(d)))
                    )
                    .attr('fill', 'none')

                // size
                if (var_bindings.includes('size')) {
                    geomLines.attr('stroke-width', d => scales.size(accessors.size(d[0])));
                } else if (var_attributes.includes('size')) {
                    geomLines.attr('stroke-width', attributes.size);
                } else {
                    geomLines.attr('stroke-width', 3);
                }            

                // // color
                if (var_bindings.includes('color')) {
                    geomLines.attr('stroke', d => scales.color(accessors.color(d[0])));
                } else if (var_attributes.includes('color')) {
                    geomLines.attr('stroke', attributes.color);
                } else {
                    geomLines.attr('stroke', 'black');
                }

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
                    .attr('x', d => scales.x(accessors.x(d)))
                    .attr('y', d => scales.y(accessors.y(d)))
                    .text(d => accessors.text(d));
                
                // size
                if (var_bindings.includes('size')) {
                    console.log('vaaaaa');
                    // textElements.attr('font-size', d => Math.pow(scales.size(accessors.size(d)), 0.2)*5);
                    textElements.attr('font-size', d => Math.pow(scales.size(accessors.size(d)), 0.2)*7);
                } else if (var_attributes.includes('size')) {
                    textElements.attr('font-size', attributes.size);
                } else {
                    textElements.attr('font-size', 20);
                }            

                // color
                console.log('this', var_attributes);
                if (var_bindings.includes('color')) {
                    textElements.attr('fill', d => scales.color(accessors.color(d)));
                } else if (var_attributes.includes('color')) {
                    // textElements.attr('fill', var_attributes.color)
                    textElements.attr('fill', attributes.color)
                } else {
                    textElements.attr('fill', 'black');
                }

                break;

        }
    }
    return _svg;
}







function add_text(_svg, _instructions, _xscale, _yscale, _colorscale, _sizescale, _attributes) {

        // Remove bindings if there is an equivalent attribute, which is dominant by default
        function removeProperties(obj, propsToRemove) {
            for (let prop of propsToRemove) {
                if (obj.hasOwnProperty(prop)) {
                    delete obj[prop];
                }
            }
        }
        let bindings = Object.assign({}, _instructions['bindings']);
        removeProperties(bindings, Object.keys(_attributes));

        
    // Compulsory bindings
    let geomText = _svg.append('g').selectAll('text')
        .data(_instructions['data'])
        .join('text')
        .attr('x', d => _xscale(d[bindings['x']]))
        .attr('y', d => _yscale(d[bindings['y']])-15)
        .attr('text-anchor', "middle")
        .text(d => d[bindings['text']])

    // Binding attributes
    if(Object.hasOwn(bindings, "color")) {
        geomText.attr('fill', d => _colorscale(d[bindings['color']]));
    }
    
    if(Object.hasOwn(bindings, "size")) {
        geomText.attr('font-size', d => Math.pow(_sizescale(d[bindings['size']]), 0.2)*5);
    }

    // Set attributes
    for (let _attr in _attributes) {
        if (_attr == "color") {
            geomText.attr("color", _attributes[_attr])
        }
        if (_attr === "size") {
            geomText.attr("font-size", _attributes[_attr])
        }
        };
        
    return(_svg)
    
        }