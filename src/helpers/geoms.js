export{loop_over_layers, add_text};

function loop_over_layers(_svg, _instructions) {
    for (let layer in _instructions.layers) {
        const { geometry, accessors, scales, groupies, attributes } = _instructions.layers[layer];
        
        switch (geometry) {
            case "point":
                const geomPoint = _svg.append('g')
                    .selectAll('.point')
                    .data(_instructions.data)
                    .join('path')
                    .attr('transform', d => `translate(${scales.x(accessors.x(d))}, ${scales.y(accessors.y(d))})`);

                if (accessors.size) {
                    geomPoint.attr('d', d3.symbol().size(d => scales.size(accessors.size(d))));
                } else {
                    geomPoint.attr('d', d3.symbol().size(attributes.size || 64).type(d3.symbolCircle));
                }

                if (accessors.color) {
                    geomPoint.attr('fill', d => scales.color(accessors.color(d)));
                } else if (attributes.color) {
                    geomPoint.attr('fill', attributes.color);
                }

                if (accessors.stroke) {
                    geomPoint.attr('stroke', d => scales.stroke(accessors.stroke(d)));
                } else if (attributes.stroke) {
                    geomPoint.attr('stroke', attributes.stroke);
                }
                break;

            case "line":
                const groupedData = d3.group(_instructions.data, d => {
                    const groupKey = groupies.map(key => accessors[key](d));
                    return groupKey.join('|'); // Use a separator to create a unique key
                });

                const geomLines = _svg.append('g')
                    .selectAll('.line-group')
                    .data(groupedData)
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

                if (accessors.size) {
                    geomLines.attr('stroke-width', d => scales.size(accessors.size(d[0])));
                } else if (attributes.size) {
                    geomLines.attr('stroke-width', attributes.size);
                }

                console.log(accessors)
                console.log(attributes)
                console.log(scales.color)
                if (accessors.color && !attributes.color) {
                    console.log('hej')
                    geomLines.attr('stroke', d => scales.color(accessors.color(d[0])));
                } else if (accessors.color && attributes.color) {
                    geomLines.attr('stroke', attributes.color);
                } else {
                    geomLines.attr('stroke', 'black');
                }

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