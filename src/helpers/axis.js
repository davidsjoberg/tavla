export{plot_axis}

function plot_axis(_svg, _xscale, _yscale, _dimensions, _xlab,  _ylab) {

  const yAxis = d3.axisLeft(_yscale)
    .tickSizeOuter(0)
    .ticks(4)

  const yAxisDOM = _svg.append('g')
    .style("font-size", "14px")
    .call(yAxis)
    .call(g => g.select(".domain").remove())

  yAxisDOM.selectAll("text")
    .style("font-size", "12px")
    .style("color", "grey")

  const xAxis = d3.axisBottom(_xscale)
    .tickSizeOuter(0)
    .ticks(5)

  const xAxisDOM = _svg.append('g')
    .style(
      'transform', 
      `translateY(${_dimensions.ctrHeight}px)`
      )
    .call(xAxis)
    .call(g => g.select(".domain").remove())

    xAxisDOM.selectAll("text")
      .style("font-size", "12px")
      .style("color", "grey")

    //// x axis label
    _svg.append("text")
    .attr("text-anchor", "middle")
    .attr("x", _dimensions.ctrWidth/2)
    .attr("y", _dimensions.marginTop + _dimensions.ctrHeight + _dimensions.marginBottom * .4)
    .style('font-size', '14px')
    .style('fill', '1d1d1d')
    .text(_xlab)

    //// Y axis label
    _svg.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("y", -_dimensions.marginLeft * .7)
    .attr("x", -_dimensions.marginTop - _dimensions.ctrHeight / 2)
    .style('font-size', '14px')
    .style('fill', '1d1d1d')
    .text(_ylab)

return(_svg)

    }