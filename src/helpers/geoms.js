export{add_points, add_text};

function add_points(_svg, _instructions, _xscale, _yscale, _colorscale, _attributes) {

    // Geom layer

    // const shape = d3.scaleOrdinal(
    //     penguins.map(d => d.species),
    //     d3.symbolsType.map(s => d3.symbol().type(s)())
    //   )
    
    // const color = d3.scaleOrdinal(d3.schemeCategory10)

    let geomPoint = _svg.append('g')
        .selectAll('.point')
        .data(_instructions['data'])
        .join('path')
        .attr(
            "transform",
            d => `translate(${_xscale(d[_instructions['bindings']['x']])}, ${_yscale(d[_instructions['bindings']['y']])})`
      )
        .attr("fill", d =>  _colorscale(d[_instructions['bindings']['color']]))
        // .attr("fill", d => color(d.species))
        // .attr("d", d => shape(d.category))


    for (let _attr in _attributes) {
        console.log(_attr);
        if (_attr == "color") {
            geomPoint.attr("fill", _attributes[_attr])
        }
        if (_attr == "stroke") {
            geomPoint.attr("stroke", _attributes[_attr])
        }
        if (_attr === "size") {
            geomPoint.attr("d", d3.symbol().size(_attributes[_attr]).type(d3.symbolCircle));
        } else {
            geomPoint.attr("d", d3.symbol().type(d3.symbolCircle));
            }
      };
      return(_svg)
      
          }

function add_text(_svg, _instructions, _xscale, _yscale, _colorscale, _attributes) {

// Geom layer 
    let geomText = _svg.append('g').selectAll('text')
        .data(_instructions['data'])
        .join('text')
        .attr('x', d => _xscale(d[_instructions['bindings']['x']]))
        .attr('y', d => _yscale(d[_instructions['bindings']['y']])-15)
        .attr('text-anchor', "middle")
        .text(d => d[_instructions['bindings']['text']])
        .attr('fill', d => _colorscale(d[_instructions['bindings']['color']]));

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