export{plot_panel}
export {small_grid};
export {panel_dimensions};

function small_grid(A, domain) {
    let middle_pos = []
    for (let i = 0; i < (A.length - 1); i++) {
      let diff = A[i+1]-A[i]
      middle_pos.push(A[i] + diff/2)
    }
    // If extra minor is needed before first major grid line
    if ((A[0] - (middle_pos[0]-A[0])) > domain[0]) {
      middle_pos.unshift(A[0] - (middle_pos[0]-A[0]))
    }
      // If extra minor is needed after last major grid line
    if ((A[A.length-1] + (A[A.length-1] - middle_pos[middle_pos.length-1])) < domain[1]) {
        middle_pos.push(A[A.length-1] + (A[A.length-1] - middle_pos[middle_pos.length-1]))
    }
    return middle_pos
    }

function panel_dimensions(_plot_width) {
    // Dimensions
    let dimensions = {
      width: _plot_width,
      height: _plot_width / 1.4,
      marginTop: _plot_width / 60,
      marginRight: _plot_width / 10,
      marginBottom: _plot_width / 10,
      marginLeft: _plot_width / 12
  };
    dimensions.ctrWidth = dimensions.width - dimensions.marginLeft - dimensions.marginRight
    dimensions.ctrHeight = dimensions.height - dimensions.marginTop - dimensions.marginBottom

    return dimensions
}
  
function plot_panel(_svg, _xscale, _yscale, _dimensions) {

    _svg = _svg.append("g")
    .attr(
      "transform",
      `translate(${_dimensions.marginLeft}, ${_dimensions.marginTop})`,
    )

    _svg.append("rect")
      .attr("width", _dimensions.ctrWidth)
      .attr("height", _dimensions.ctrHeight)
      .attr("fill", "#ebebeb");

      const xGrid = (g) => g
      .style('stroke', 'white')
      .style('stroke-width', 1.5)
      .selectAll('line')
      .data(_xscale.ticks(5))
      .join('line')
      .attr('x1', d => _xscale(d))
      .attr('x2', d => _xscale(d))
      .attr('y1', 0)
      .attr('y2', _dimensions.ctrHeight)

    const xGridMinor = (g) => g
      .style('stroke', 'white')
      .style('stroke-width', .5)
      .selectAll('line')
      .data(small_grid(_xscale.ticks(5), _xscale.domain()))
      .join('line')
      .attr('x1', d => _xscale(d))
      .attr('x2', d => _xscale(d))
      .attr('y1', 0)
      .attr('y2', _dimensions.ctrHeight)

    const yGrid = (g) => g
          .style('stroke', 'white')
          .style('stroke-width', 1.5)
          .selectAll('line')
          .data(_yscale.ticks(4))
          .join('line')
          .attr('y1', d => _yscale(d))
          .attr('y2', d => _yscale(d))
          .attr('x1', 0)
          .attr('x2', _dimensions.ctrWidth)

    const yGridMinor = (g) => g
          .style('stroke', 'white')
          .style('stroke-width', 0.5)
          .selectAll('line')
          .data(small_grid(_yscale.ticks(4), _yscale.domain()))
          .join('line')
          .attr('y1', d => _yscale(d))
          .attr('y2', d => _yscale(d))
          .attr('x1', 0)
          .attr('x2', _dimensions.ctrWidth)

        _svg.append('g').call(yGrid)
        _svg.append('g').call(xGrid)
        _svg.append('g').call(yGridMinor)
        _svg.append('g').call(xGridMinor)

return(_svg)

    }