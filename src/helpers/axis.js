export { plot_axis };

/**
 * Format numbers with space as thousands separator
 */
function formatNumber(value) {
  // For integers or decimals, format with space as thousands separator
  if (typeof value === 'number') {
    // For whole numbers
    if (Number.isInteger(value)) {
      return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    } 
    // For decimals, format only the integer part
    else {
      const parts = value.toString().split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
      return parts.join('.');
    }
  }
  return value;
}

function plot_axis(_svg, _instructions) {
  const { dimensions, scalesAndTypes, labels } = _instructions;
  
  // Create an overlay group for axes to ensure they're on top of all data elements
  const axesGroup = _svg.append("g")
    .attr("class", "axes-layer")
    .attr("pointer-events", "none"); // Prevent axes from blocking interactions
  
  // X Axis with custom number formatting
  const xAxis = g => g
    .attr("transform", `translate(0,${dimensions.ctrHeight})`)
    .call(
      d3.axisBottom(scalesAndTypes.x.scale)
        .ticks(scalesAndTypes.x.type === "number" ? 6 : null)
        .tickFormat(scalesAndTypes.x.type === "number" ? formatNumber : null)
        .tickSizeOuter(0)
    )
    .attr("color", "black")
    .call(g => {
      // Fix the x-axis line appearance
      g.select(".domain")
        .attr("stroke", "black")
        .attr("stroke-width", 1.5)
        // Ensure x-axis line is precisely positioned
        .attr("d", `M0.5,0.5H${dimensions.ctrWidth + 0.5}`);
    });

  // Y Axis with custom number formatting
  const yAxis = g => g
    .call(
      d3.axisLeft(scalesAndTypes.y.scale)
        .ticks(scalesAndTypes.y.type === "number" ? 6 : null)
        .tickFormat(scalesAndTypes.y.type === "number" ? formatNumber : null)
        .tickSizeOuter(0)
    )
    .attr("color", "black")
    .call(g => {
      // Replace the y-axis path completely to ensure it extends correctly
      g.select(".domain").remove(); // Remove the auto-generated path
      
      // Add a custom line that definitively goes from top to bottom
      g.append("path")
        .attr("class", "domain")
        .attr("stroke", "black")
        .attr("stroke-width", 1.5)
        .attr("d", `M0.5,0H0.5V${dimensions.ctrHeight}`)
        .attr("fill", "none");
    });

  // Add axes to the SVG with proper order to avoid overlapping artifacts
  axesGroup.append("g")
    .attr("class", "y-axis")
    .call(yAxis);

  axesGroup.append("g")
    .attr("class", "x-axis")
    .call(xAxis);

  // X Axis Label
  if (labels && labels.x) {
    axesGroup.append("text")
      .attr("class", "x-axis-label")
      .attr("x", dimensions.ctrWidth / 2)
      .attr("y", dimensions.ctrHeight + dimensions.marginBottom * 0.7)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .attr("fill", "black")
      .text(labels.x);
  }

  // Y Axis Label
  if (labels && labels.y) {
    axesGroup.append("text")
      .attr("class", "y-axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -dimensions.ctrHeight / 2)
      .attr("y", -dimensions.marginLeft * 0.7)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .attr("fill", "black")
      .text(labels.y);
  }

  return _svg;
}
