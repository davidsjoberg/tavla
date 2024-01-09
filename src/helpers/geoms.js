export{add_points, add_text};

function add_points(_svg, _instructions, _xscale, _yscale, _colorscale, _attributes) {

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
    

    let geomPoint = _svg.append('g')
        .selectAll('.point')
        .data(_instructions['data'])
        .join('path')
        .attr(
            "transform",
            d => `translate(${_xscale(d[bindings['x']])}, ${_yscale(d[bindings['y']])})`
      )
        .attr("fill", d =>  _colorscale(d[_instructions['bindings']['color']]))
        // .attr("fill", d => color(d.species))
        // .attr("d", d => shape(d.category))

    if(Object.hasOwn(bindings, "size")) {
        geomPoint.attr("d", d3.symbol().size((d) => d[bindings['y']]*150));
    }


    for (let _attr in _attributes) {
        if (_attr == "color") {
            geomPoint.attr("fill", _attributes[_attr])
        }
        if (_attr == "stroke") {
            geomPoint.attr("stroke", _attributes[_attr])
        }
        if(!Object.hasOwn(bindings, "size")) {
            console.log('hej')
            if (_attr === "size") {
                geomPoint.attr("d", d3.symbol().size(_attributes[_attr]).type(d3.symbolCircle));
            } else {
                geomPoint.attr("d", d3.symbol().type(d3.symbolCircle));
                }
          };
        };
        
      return(_svg)
      
          }





function add_text(_svg, _instructions, _xscale, _yscale, _colorscale, _attributes) {

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
        

    let geomText = _svg.append('g').selectAll('text')
        .data(_instructions['data'])
        .join('text')
        .attr('x', d => _xscale(d[bindings['x']]))
        .attr('y', d => _yscale(d[bindings['y']])-15)
        .attr('text-anchor', "middle")
        .text(d => d[bindings['text']])
        .attr('fill', d => _colorscale(d[bindings['color']]));

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