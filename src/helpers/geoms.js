export{add_points, add_text};

function add_points(_svg, _data, _xscale, _yscale, _colorscale, _xaccessor, _yaccessor, _textaccessor, _attributes) {

    // Geom layer

    // const shape = d3.scaleOrdinal(
    //     penguins.map(d => d.species),
    //     d3.symbolsType.map(s => d3.symbol().type(s)())
    //   )
    
    const color = d3.scaleOrdinal(d3.schemeCategory10)

    let geomPoint = _svg.append('g')
        .selectAll('.point')
        .data(_data)
        .join('path')
        .attr(
            "transform",
            d => `translate(${_xscale(_xaccessor(d))}, ${_yscale(_yaccessor(d))})`
      )
        .attr("id", "symboler")
        .attr("fill", d =>  _colorscale(_textaccessor(d)))
        // .attr("fill", d => color(d.species))
        // .attr("d", d => shape(d.category))

    for (let _attr in _attributes) {
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

function add_text(_svg, _data, _xscale, _yscale, _colorscale, _xaccessor, _yaccessor, _textaccessor, _attributes) {

// Geom layer 
    let geomText = _svg.append('g').selectAll('text')
        .data(_data)
        .join('text')
        .attr('x', d => _xscale(_xaccessor(d)))
        .attr('y', d => _yscale(_yaccessor(d))-15)
        .attr('text-anchor', "middle")
        .text(d => d.category)
        .attr('fill', d => _colorscale(_textaccessor(d)));

    // for (let _attr in _attributes) {
    //     if (_attr == "color") {
    //         geomText.attr("color", _attributes[_attr])
    //     }
    //     if (_attr === "size") {
    //         geomText.attr("font-size", _attributes[_attr])
    //     }
    //     };
        
    return(_svg)
    
        }