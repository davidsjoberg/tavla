export{plot_axis}

function plot_axis(_svg, _instructions) {
  const { bindings, dimensions, scalesAndTypes } = _instructions;
  const { x, y } = bindings;

  const yAxis = d3.axisLeft(scalesAndTypes.y.scale)
    .tickSizeOuter(0)
    .ticks(4);

  const yAxisDOM = _svg.append('g')
    .style("font-size", "14px")
    .call(yAxis)
    .call(g => g.select(".domain").remove());

  yAxisDOM.selectAll("text")
    .style("font-size", "12px")
    .style("color", "grey");

  const xAxis = d3.axisBottom(scalesAndTypes.x.scale)
    .tickSizeOuter(0)
    .ticks(5);

  const xAxisDOM = _svg.append('g')
    .style('transform', `translateY(${dimensions.ctrHeight}px)`)
    .call(xAxis)
    .call(g => g.select(".domain").remove());

  xAxisDOM.selectAll("text")
    .style("font-size", "12px")
    .style("color", "grey");

  // X axis label
  const xAxisLabel = _svg.append("text")
    .attr("text-anchor", "middle")
    .attr("x", dimensions.ctrWidth / 2)
    .attr("y", dimensions.marginTop + dimensions.ctrHeight + dimensions.marginBottom * .4)
    .style('font-size', '14px')
    .style('fill', '1d1d1d')
    .text(_instructions.labels && _instructions.labels.x ? _instructions.labels.x : _instructions.bindings.x);
    
  // Y axis label
  const yAxisLabel = _svg.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("y", -dimensions.marginLeft * .7)
    .attr("x", -dimensions.marginTop - dimensions.ctrHeight / 2)
    .style('font-size', '14px')
    .style('fill', '1d1d1d')
    .text(_instructions.labels && _instructions.labels.y ? _instructions.labels.y : _instructions.bindings.y);

  return _svg;
}
