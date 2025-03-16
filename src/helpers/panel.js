import { calculateLegendSpace } from './legend.js';

export { plot_panel, render_titles, measureTitleHeight };
export { small_grid };
export { panel_dimensions };

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

/**
 * Creates a temporary rendering to measure the actual height needed for titles
 */
function measureTitleHeight(_instructions, _plot_width) {
    if (!_instructions.labels || (!_instructions.labels.title && !_instructions.labels.subtitle)) {
        return 0; // No titles to measure
    }
    
    // Create a temporary SVG to measure text dimensions
    const tempSvg = d3.create('svg')
        .style('position', 'absolute')
        .style('visibility', 'hidden')
        .style('pointer-events', 'none')
        .attr('width', _plot_width)
        .attr('height', 100); // Arbitrary height
    
    document.body.appendChild(tempSvg.node());
    
    const titleGroup = tempSvg.append("g")
        .attr("class", "chart-titles")
        .attr("transform", `translate(10, 10)`); // Some padding
    
    let totalHeight = 0;
    const titlePadding = 5; // Padding between title/subtitle and below subtitle
    
    // Add title if it exists
    if (_instructions.labels.title) {
        const titleText = titleGroup.append("text")
            .attr("class", "chart-title")
            .attr("x", 0)
            .attr("y", 0)
            .attr("font-size", "18px")
            .attr("font-weight", "bold")
            .text(_instructions.labels.title);
        
        const titleBBox = titleText.node().getBBox();
        totalHeight = titleBBox.height + titlePadding;
    }
    
    // Add subtitle if it exists
    if (_instructions.labels.subtitle) {
        const subtitleText = titleGroup.append("text")
            .attr("class", "chart-subtitle")
            .attr("x", 0)
            .attr("y", totalHeight)
            .attr("font-size", "14px")
            .text(_instructions.labels.subtitle);
        
        const subtitleBBox = subtitleText.node().getBBox();
        totalHeight += subtitleBBox.height + titlePadding;
    }
    
    // Remove the temporary SVG
    tempSvg.remove();
    
    // Add some extra padding and return
    return totalHeight + 10; // Extra padding at the bottom
}

function panel_dimensions(_plot_width, _instructions) {
    // Calculate title space based on actual rendered titles
    const titleHeight = _instructions ? measureTitleHeight(_instructions, _plot_width) : 0;
    
    // Calculate legend space if needed
    const legendSpace = _instructions ? calculateLegendSpace(_instructions) : { width: 0, height: 0 };
    const legendWidth = legendSpace.width;
    
    // Use consistent margins with dynamically calculated title and legend space
    const margins = {
        top: _plot_width * 0.02 + titleHeight, // Add measured titleHeight to top margin
        right: _plot_width * 0.06 + (legendWidth > 0 ? legendWidth + 30 : 0), // Add space for legend + padding if needed
        bottom: _plot_width * 0.08,
        left: _plot_width * 0.08
    };
    
    // Calculate total width including legend area
    const totalWidth = _plot_width + (legendWidth > 0 ? legendWidth + 30 : 0);
    
    // Dimensions
    let dimensions = {
        width: totalWidth,
        height: _plot_width / 1.6 + titleHeight,
        marginTop: margins.top,
        marginRight: margins.right,
        marginBottom: margins.bottom,
        marginLeft: margins.left,
        titleHeight: titleHeight,
        legendSpace: legendSpace
    };
    
    // Content area dimensions (subtract margins)
    dimensions.ctrWidth = _plot_width - margins.left - margins.right + legendWidth;
    dimensions.ctrHeight = dimensions.height - margins.top - margins.bottom;

    return dimensions;
}

function render_titles(_svg, _instructions) {
    const { labels, dimensions } = _instructions;
    
    if (!labels) return _svg;
    
    // Create a title container at the top of the chart
    const titleGroup = _svg.append("g")
        .attr("class", "chart-titles")
        .attr("transform", `translate(${dimensions.marginLeft}, ${dimensions.marginTop * 0.25})`);
    
    let currentY = 0;
    const titlePadding = 5;
    
    // Add title if it exists
    if (labels.title) {
        titleGroup.append("text")
            .attr("class", "chart-title")
            .attr("x", 0)
            .attr("y", currentY)
            .attr("dy", "1em") // Align with top of text, not baseline
            .attr("font-size", "18px")
            .attr("font-weight", "bold")
            .attr("fill", "#333333")
            .text(labels.title);
        
        currentY += 24; // Approximate height of title + padding
    }
    
    // Add subtitle if it exists
    if (labels.subtitle) {
        titleGroup.append("text")
            .attr("class", "chart-subtitle")
            .attr("x", 0)
            .attr("y", currentY)
            .attr("dy", "1em") // Align with top of text, not baseline
            .attr("font-size", "14px")
            .attr("font-weight", "normal")
            .attr("fill", "#666666")
            .text(labels.subtitle);
    }
    
    return _svg;
}

function plot_panel(_svg, _instructions) {

  ///////// PANEL //////////
  _svg = _svg.append("g")
      .attr(
          "transform",
          `translate(${_instructions.dimensions.marginLeft}, ${_instructions.dimensions.marginTop})`,
      );

  // Revert back to light gray for plot area
  _svg.append("rect")
      .attr("width", _instructions.dimensions.ctrWidth)
      .attr("height", _instructions.dimensions.ctrHeight)
      .attr("fill", "#ebebeb"); // Reverted back to light gray

  ///////// X GRID //////////
  switch(_instructions.scalesAndTypes.x.type) {
    case 'number':
      const xGrid = (g) => g
        .style('stroke', 'white') // Back to white grid lines on gray background
        .style('stroke-width', 1.5)
        .selectAll('line')
        .data(_instructions.scalesAndTypes.x.scale.ticks(5))
        .join('line')
        .attr('x1', d => _instructions.scalesAndTypes.x.scale(d))
        .attr('x2', d => _instructions.scalesAndTypes.x.scale(d))
        .attr('y1', 0)
        .attr('y2', _instructions.dimensions.ctrHeight);

      const xGridMinor = (g) => g
        .style('stroke', 'white') // Back to white minor grid lines
        .style('stroke-width', .5)
        .selectAll('line')
        .data(small_grid(_instructions.scalesAndTypes.x.scale.ticks(5), _instructions.scalesAndTypes.x.scale.domain()))
        .join('line')
        .attr('x1', d => _instructions.scalesAndTypes.x.scale(d))
        .attr('x2', d => _instructions.scalesAndTypes.x.scale(d))
        .attr('y1', 0)
        .attr('y2', _instructions.dimensions.ctrHeight);

      _svg.append('g').call(xGridMinor);
      _svg.append('g').call(xGrid);
      break;

    case 'discrete':

  }
  
  ///////// Y GRID //////////
  switch(_instructions.scalesAndTypes.y.type) {
    case 'number':
      const yGrid = (g) => g
        .style('stroke', 'white') // Back to white grid lines
        .style('stroke-width', 1.5)
        .selectAll('line')
        .data(_instructions.scalesAndTypes.y.scale.ticks(4))
        .join('line')
        .attr('y1', d => _instructions.scalesAndTypes.y.scale(d))
        .attr('y2', d => _instructions.scalesAndTypes.y.scale(d))
        .attr('x1', 0)
        .attr('x2', _instructions.dimensions.ctrWidth);

      const yGridMinor = (g) => g
        .style('stroke', 'white') // Back to white minor grid lines
        .style('stroke-width', 0.5)
        .selectAll('line')
        .data(small_grid(_instructions.scalesAndTypes.y.scale.ticks(4), _instructions.scalesAndTypes.y.scale.domain()))
        .join('line')
        .attr('y1', d => _instructions.scalesAndTypes.y.scale(d))
        .attr('y2', d => _instructions.scalesAndTypes.y.scale(d))
        .attr('x1', 0)
        .attr('x2', _instructions.dimensions.ctrWidth);

      _svg.append('g').call(yGridMinor);
      _svg.append('g').call(yGrid);
      break;

    case 'discrete':

  }
  
  return _svg;
}
