export { createLegends, calculateLegendSpace };
import * as geoms from './geoms.js';

/**
 * Calculates how much space is needed for legends and determines optimal layout
 */
function calculateLegendSpace(_instructions) {
  // First check if we have any bindings that would create legends
  const { bindings } = _instructions;
  
  if (!bindings || Object.keys(bindings).length === 0) {
    return { width: 0, height: 0, layout: 'none' };
  }
  
  // Skip positional aesthetics
  const positionalAesthetics = ['x', 'y', 'text'];
  const legendAesthetics = Object.keys(bindings).filter(
    key => !positionalAesthetics.includes(key)
  );
  
  // If no legends are needed, return zeros immediately
  if (legendAesthetics.length === 0) {
    return { width: 0, height: 0, layout: 'none' };
  }
  
  // Create a temporary SVG for measuring
  const tempSvg = d3.create("svg")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("pointer-events", "none");
  
  document.body.appendChild(tempSvg.node());
  
  // Measure each legend's dimensions individually
  const { scalesAndTypes } = _instructions;
  const legendDimensions = [];
  
  // Process each aesthetic that needs a legend
  legendAesthetics.forEach(aesthetic => {
    if (!scalesAndTypes || !scalesAndTypes[aesthetic]) return;
    
    const { scale, type } = scalesAndTypes[aesthetic];
    const title = bindings[aesthetic]; // Use the data column as title
    
    // Create a temporary legend group to measure
    const tempGroup = tempSvg.append("g").attr("class", `legend-measure-${aesthetic}`);
    const { width, height } = measureLegendSize(tempGroup, scale, type, aesthetic, _instructions, title);
    
    legendDimensions.push({
      aesthetic,
      width,
      height
    });
    
    // Remove this temporary legend now that we've measured it
    tempGroup.remove();
  });
  
  // Clean up
  tempSvg.remove();
  
  // Determine optimal layout based on available space and legend dimensions
  const layout = determineLegendLayout(legendDimensions, _instructions);
  
  return {
    ...layout,
    legendItems: legendDimensions
  };
}

/**
 * Measures the size of an individual legend with more accurate width calculation
 */
function measureLegendSize(legendGroup, scale, type, aesthetic, _instructions, title) {
  // Simulate creating a legend to measure its size
  
  // Add title
  const titleElement = legendGroup.append("text")
    .attr("class", "legend-title")
    .attr("x", 0)
    .attr("y", 0)
    .attr("font-size", "12px")
    .attr("font-weight", "bold")
    .attr("text-anchor", "start")
    .text(title);
  
  let titleHeight = 25; // Default height allocation for title
  let totalHeight = titleHeight;
  let maxWidth = 0;
  
  try {
    // Measure title width
    const titleBBox = titleElement.node().getBBox();
    maxWidth = Math.max(maxWidth, titleBBox.width);
    titleHeight = titleBBox.height + 10; // Add padding
  } catch (e) {
    console.warn("Error measuring legend title", e);
  }
  
  // Add dummy items based on the aesthetic type to estimate size with tighter width estimates
  if (isColorAesthetic(aesthetic)) {
    const { itemHeight, itemWidth } = measureColorLegendItems(legendGroup, scale, type, aesthetic, _instructions, titleHeight);
    totalHeight += itemHeight;
    maxWidth = Math.max(maxWidth, itemWidth);
  }
  else if (aesthetic === 'size') {
    const { itemHeight, itemWidth } = measureSizeLegendItems(legendGroup, scale, type, aesthetic, _instructions, titleHeight);
    totalHeight += itemHeight;
    maxWidth = Math.max(maxWidth, itemWidth);
  }
  else {
    const { itemHeight, itemWidth } = measureGenericLegendItems(legendGroup, scale, type, aesthetic, _instructions, titleHeight);
    totalHeight += itemHeight;
    maxWidth = Math.max(maxWidth, itemWidth);
  }
  
  // Add minimal padding - we want tight width measurements
  maxWidth += 10;
  
  return {
    width: maxWidth, // Remove minimum width constraint
    height: totalHeight + 10 // Add padding at bottom
  };
}

/**
 * Determines the optimal layout for legends with improved space efficiency
 */
function determineLegendLayout(legendItems, _instructions) {
  // Get total chart dimensions (approximate if not yet finalized)
  const plotWidth = _instructions.dimensions?.width || 600;
  const plotHeight = _instructions.dimensions?.height || 400;
  
  // Calculate total legend size if they were all stacked vertically
  let totalLegendHeight = legendItems.reduce((sum, item) => sum + item.height, 0);
  
  // Find the actual max width needed (not theoretical max)
  const maxLegendWidth = legendItems.length > 0 ? 
    Math.max(...legendItems.map(item => item.width)) : 0;
  
  // If we have a single legend or no legends, just use its width
  if (legendItems.length <= 1) {
    return {
      width: maxLegendWidth,
      height: totalLegendHeight,
      layout: legendItems.length === 0 ? 'none' : 'single-column'
    };
  }
  
  // Maximum allowable legend height (percentage of plot height)
  const maxAllowedLegendHeight = plotHeight * 0.7; // 70% of plot height
  
  // If vertical stacking is fine and doesn't exceed max height, use single column
  if (totalLegendHeight <= maxAllowedLegendHeight) {
    return {
      width: maxLegendWidth,
      height: totalLegendHeight,
      layout: 'single-column'
    };
  }
  
  // For multi-column, be more conservative with legend width
  // Determine optimal number of columns
  const numColumns = calculateOptimalColumnCount(
    legendItems, 
    plotWidth, 
    plotHeight, 
    maxAllowedLegendHeight
  );
  
  // Calculate multi-column layout with tighter spacing
  return calculateMultiColumnLayout(legendItems, numColumns);
}

/**
 * Calculates optimal number of columns for legends
 */
function calculateOptimalColumnCount(legendItems, plotWidth, plotHeight, maxAllowedHeight) {
  if (legendItems.length <= 1) return 1;
  
  // Start with 1 column and increase until we find a suitable layout
  let columns = 1;
  let currentHeight = legendItems.reduce((sum, item) => sum + item.height, 0);
  
  while (currentHeight > maxAllowedHeight && columns < legendItems.length) {
    columns++;
    
    // Estimate height with current column count
    const itemsPerColumn = Math.ceil(legendItems.length / columns);
    const columnHeights = new Array(columns).fill(0);
    
    // Distribute items across columns
    legendItems.forEach((item, i) => {
      const columnIndex = Math.floor(i / itemsPerColumn);
      columnHeights[columnIndex] += item.height;
    });
    
    // The tallest column determines the overall height
    currentHeight = Math.max(...columnHeights);
    
    // Avoid making too many columns - check total width vs plot width
    const avgItemWidth = legendItems.reduce((sum, item) => sum + item.width, 0) / legendItems.length;
    if ((avgItemWidth + 10) * columns > plotWidth * 0.25) break;  // Limit legend width to 25% of plot
  }
  
  return columns;
}

/**
 * Calculate multi-column layout with more efficient spacing
 */
function calculateMultiColumnLayout(legendItems, columns) {
  // More efficient width calculation
  const itemsPerColumn = Math.ceil(legendItems.length / columns);
  const columnHeights = new Array(columns).fill(0);
  const columnWidths = new Array(columns).fill(0);
  
  // Distribute items across columns and track actual widths
  legendItems.forEach((item, i) => {
    const columnIndex = Math.floor(i / itemsPerColumn);
    columnHeights[columnIndex] += item.height;
    columnWidths[columnIndex] = Math.max(columnWidths[columnIndex], item.width);
  });
  
  // Calculate total dimensions - tighter spacing
  const totalHeight = Math.max(...columnHeights);
  
  // Use smaller column spacing
  const columnSpacing = 10;
  let totalWidth = 0;
  
  for (let i = 0; i < columnWidths.length; i++) {
    totalWidth += columnWidths[i];
    if (i < columnWidths.length - 1) {
      totalWidth += columnSpacing;
    }
  }
  
  return {
    width: totalWidth,
    height: totalHeight,
    layout: 'multi-column',
    columns,
    columnWidths,
    columnSpacing,
    itemsPerColumn
  };
}

/**
 * Helper function to check if aesthetic is color-related
 */
function isColorAesthetic(aesthetic) {
  return ['color', 'fill', 'stroke'].includes(aesthetic);
}

/**
 * Creates legends with optimal layout and positioning
 */
function createLegends(_svg, _instructions) {
  const { bindings, scalesAndTypes, dimensions } = _instructions;
  
  // Skip positional aesthetics and determine which need legends
  const positionalAesthetics = ['x', 'y', 'text'];
  const legendAesthetics = Object.keys(bindings || {}).filter(
    key => !positionalAesthetics.includes(key)
  );
  
  // If no legends are needed, return early
  if (legendAesthetics.length === 0) return _svg;
  
  try { 
    // Create container for legends - position exactly at the right edge of the plot area
    const legendsGroup = _svg.append("g")
      .attr("class", "legends-container") // Reduced X padding
      .attr("transform", `translate(${dimensions.ctrWidth + 20}, 20)`);
    
    // Extract layout information
    const layout = _instructions.legendLayout || {
      layout: 'single-column',
      columns: 1, // Use tighter spacing
      columnSpacing: 12,
      itemsPerColumn: legendAesthetics.length
    };
    
    // Track current positions for placing legends
    const currentY = Array(layout.columns || 1).fill(0);
    
    // Analyze layers
    const hasPointLayer = Object.values(_instructions.layers || {}).some(layer => layer.geometry === 'point');
    const hasLineLayer = Object.values(_instructions.layers || {}).some(layer => layer.geometry === 'line');
    const combinedLineDot = hasPointLayer && hasLineLayer;
    
    // Process each legend with improved positioning
    legendAesthetics.forEach((aesthetic, index) => {
      if (!scalesAndTypes[aesthetic]) return;
      
      const { scale, type } = scalesAndTypes[aesthetic];
      const title = bindings[aesthetic];
      
      // Determine column for this legend in multi-column layout
      const column = layout.layout === 'multi-column' 
        ? Math.floor(index / layout.itemsPerColumn)
        : 0;
      
      // Calculate x-position based on column - tighter layout
      let xPosition = 0;
      if (layout.layout === 'multi-column' && column > 0) {
        // Sum widths of previous columns plus spacing
        for (let i = 0; i < column; i++) {
          xPosition += layout.columnWidths[i] + layout.columnSpacing;
        }
      }
      
      // Create legend with the right ID and position
      const legendId = `legend-${aesthetic}-${_instructions.id || Math.random().toString(36).substring(2, 10)}`;
      
      // Remove any existing legends with this ID
      _svg.selectAll(`#${legendId}`).remove();
      
      const legend = legendsGroup.append("g")
        .attr("class", `legend-${aesthetic}`)
        .attr("id", legendId)
        .attr("transform", `translate(${xPosition}, ${currentY[column]})`);
      
      // Add title
      legend.append("text")
        .attr("class", "legend-title")
        .attr("x", 0)
        .attr("y", 0)
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .attr("text-anchor", "start")
        .text(title);
      
      // Render legend items below title with improved spacing
      const titleHeight = 25; // Fixed height for title
      
      try {
        let legendHeight = titleHeight;
        
        if (isColorAesthetic(aesthetic)) {
          legendHeight = renderColorLegend(legend, scale, type, aesthetic, _instructions, titleHeight, combinedLineDot);
        } 
        else if (aesthetic === 'size') {
          if (!(hasPointLayer && Object.keys(_instructions.layers).includes('highlights') && Object.keys(_instructions.layers).includes('circles'))) {
            legendHeight = renderFixedSizeLegend(legend, scale, type, aesthetic, _instructions, titleHeight);
          }
        }
        else if (aesthetic === 'alpha' || aesthetic === 'strokeWidth') {
          legendHeight = renderGenericLegend(legend, scale, type, aesthetic, _instructions, titleHeight);
        }
        
        // Update current Y position for this column
        currentY[column] = currentY[column] + (legendHeight - titleHeight) + 15; // Add spacing
      } catch (e) {
        console.error(`Error rendering ${aesthetic} legend:`, e);
      }
    });
    
    return _svg;
  } catch (error) {
    console.error("Error in createLegends:", error);
    return _svg; // Return the original SVG without legends rather than crashing
  }
}

/**
 * Renders a color/fill legend (discrete or continuous)
 * Returns the new vertical position
 */
function renderColorLegend(legend, scale, type, aesthetic, _instructions, startY, combinedLineDot) {
  const primaryGeometry = determineGeometryType(_instructions);
  const attributes = extractGeometryAttributes(_instructions, primaryGeometry);
  
  if (type === 'discrete') {
    // Get domain values
    const domain = scale.domain();
    let currentY = startY;
    
    // Create legend items for each discrete value
    domain.forEach((value, i) => {
      const itemGroup = legend.append("g")
        .attr("class", "legend-item")
        .attr("transform", `translate(0, ${currentY})`);
      
      const colorValue = scale(value);
      
      // Render appropriate swatch based on geometry
      if (primaryGeometry === 'line' || combinedLineDot) {
        // Line swatch
        const lineWidth = (attributes.size || 2) * 1.2;
        
        itemGroup.append("line")
          .attr("x1", 0)
          .attr("y1", 0)
          .attr("x2", 20)
          .attr("y2", 0)
          .attr("stroke", colorValue)
          .attr("stroke-width", lineWidth)
          .attr("stroke-dasharray", getLineDashArray(attributes.lineType));
        
        // Add dot for combined line+point charts
        if (combinedLineDot) {
          itemGroup.append("circle")
            .attr("cx", 10)
            .attr("cy", 0)
            .attr("r", 4)
            .attr("fill", colorValue)
            .attr("stroke", attributes.stroke || "black")
            .attr("stroke-width", 0.8);
        }
      }
      else if (primaryGeometry === 'point') {
        const shapeType = determineShapeType(_instructions);
        // Point swatch
        if (shapeType === 'circle') {
          itemGroup.append("circle")
            .attr("cx", 6)
            .attr("cy", 0)
            .attr("r", 6)
            .attr("fill", colorValue)
            .attr("stroke", "black")
            .attr("stroke-width", 0.5);
        } else {
          itemGroup.append("path")
            .attr("transform", `translate(6, 0)`)
            .attr("d", d3.symbol().type(getSymbolType(shapeType)).size(100)())
            .attr("fill", colorValue)
            .attr("stroke", "black")
            .attr("stroke-width", 0.5);
        }
      }
      else {
        // Default rectangle swatch
        itemGroup.append("rect")
          .attr("x", 0)
          .attr("y", -6)
          .attr("width", 12)
          .attr("height", 12)
          .attr("fill", colorValue)
          .attr("stroke", "black")
          .attr("stroke-width", 0.5);
      }
      
      // Add text label
      itemGroup.append("text")
        .attr("x", 30)
        .attr("y", 0)
        .attr("font-size", "11px")
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "middle")
        .text(value);
      
      currentY += 20; // Default vertical spacing
    });
    
    return currentY;
  } else {
    // For continuous color scale
    const gradientId = `gradient-${aesthetic}-${_instructions.id || Math.random().toString(36).substring(2, 10)}`;
    
    // Generate nice values for continuous scale
    const domain = scale.domain();
    const niceMin = prettifyNumber(domain[0]);
    const niceMax = prettifyNumber(domain[1]);
    
    // Create color stops for the gradient
    const colorRange = generateColorRangeValues(scale, 10);
    
    // Create gradient definition
    const defs = legend.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", gradientId)
      .attr("x1", "0%")
      .attr("x2", "0%")
      .attr("y1", "0%")
      .attr("y2", "100%");
    
    colorRange.forEach((color, i) => {
      gradient.append("stop")
        .attr("offset", `${i / (colorRange.length - 1) * 100}%`)
        .attr("stop-color", color);
    });
    
    // Draw gradient rectangle
    legend.append("rect")
      .attr("x", 0)
      .attr("y", startY)
      .attr("width", 20)
      .attr("height", 100)
      .attr("fill", `url(#${gradientId})`)
      .attr("stroke", "black")
      .attr("stroke-width", 0.5);
    
    // Add labels for min and max values
    legend.append("text")
      .attr("x", 30)
      .attr("y", startY)
      .attr("font-size", "10px")
      .attr("text-anchor", "start")
      .attr("dominant-baseline", "middle")
      .text(niceMax);
    
    legend.append("text")
      .attr("x", 30)
      .attr("y", startY + 100)
      .attr("font-size", "10px")
      .attr("text-anchor", "start")
      .attr("dominant-baseline", "middle")
      .text(niceMin);
    
    return startY + 100;
  }
}

/**
 * Special fixed size legend renderer to avoid positioning issues - simplified version
 */
function renderFixedSizeLegend(legend, scale, type, aesthetic, _instructions, startY) {
  const primaryGeometry = determineGeometryType(_instructions);
  const shapeType = determineShapeType(_instructions);
  
  // Fixed spacing between legend items
  const itemSpacing = 25;
  
  // Create a container group for all size items to ensure proper positioning
  const sizeGroup = legend.append("g")
    .attr("class", "size-legend-group")
    .attr("transform", `translate(0, ${startY})`);
  
  if (type === 'discrete') {
    const domain = scale.domain();
    let itemY = 0;
    
    // Render each discrete value
    domain.forEach(value => {
      const size = scale(value);
      
      // Create group for this item
      const itemGroup = sizeGroup.append("g")
        .attr("class", "legend-item")
        .attr("transform", `translate(0, ${itemY})`);
      
      // Render appropriate shape based on geometry
      if (primaryGeometry === 'point') {
        if (shapeType === 'circle') {
          // Circle
          const radius = Math.sqrt(size / Math.PI);
          itemGroup.append("circle")
            .attr("cx", 8)
            .attr("cy", 0)
            .attr("r", radius)
            .attr("fill", "steelblue")
            .attr("stroke", "black")
            .attr("stroke-width", 0.5);
        } else {
          // Other shape
          itemGroup.append("path")
            .attr("transform", `translate(8, 0)`)
            .attr("d", d3.symbol().type(getSymbolType(shapeType)).size(size)())
            .attr("fill", "steelblue")
            .attr("stroke", "black")
            .attr("stroke-width", 0.5);
        }
      } else if (primaryGeometry === 'line') {
        // Line
        itemGroup.append("line")
          .attr("x1", 0)
          .attr("y1", 0)
          .attr("x2", 16)
          .attr("y2", 0)
          .attr("stroke", "steelblue")
          .attr("stroke-width", size / 5);
      }
      
      // Add text label
      itemGroup.append("text")
        .attr("x", 25)
        .attr("y", 0)
        .attr("font-size", "11px")
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "middle")
        .text(value);
      
      // Move to next position
      itemY += itemSpacing;
    });
    
    return startY + itemY;
  } else {
    // Continuous size scale
    const domain = scale.domain();
    const niceValues = generateNiceValues(domain, 5);
    let itemY = 0;
    
    // Render each value
    niceValues.forEach(value => {
      const size = scale(value);
      
      // Create group for this item
      const itemGroup = sizeGroup.append("g")
        .attr("class", "legend-item")
        .attr("transform", `translate(0, ${itemY})`);
      
      // Render appropriate shape based on geometry
      if (primaryGeometry === 'point') {
        if (shapeType === 'circle') {
          const radius = Math.sqrt(size / Math.PI);
          itemGroup.append("circle")
            .attr("cx", 8)
            .attr("cy", 0)
            .attr("r", radius)
            .attr("fill", "steelblue")
            .attr("stroke", "black")
            .attr("stroke-width", 0.5);
        } else {
          itemGroup.append("path")
            .attr("transform", `translate(8, 0)`)
            .attr("d", d3.symbol().type(getSymbolType(shapeType)).size(size)())
            .attr("fill", "steelblue")
            .attr("stroke", "black")
            .attr("stroke-width", 0.5);
        }
      } else if (primaryGeometry === 'line') {
        itemGroup.append("line")
          .attr("x1", 0)
          .attr("y1", 0)
          .attr("x2", 16)
          .attr("y2", 0)
          .attr("stroke", "steelblue")
          .attr("stroke-width", size / 5);
      }
      
      // Add text label
      itemGroup.append("text")
        .attr("x", 25)
        .attr("y", 0)
        .attr("font-size", "11px")
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "middle")
        .text(prettifyNumber(value));
      
      // Move to next position
      itemY += itemSpacing;
    });
    
    return startY + itemY;
  }
}

/**
 * Returns the stroke-dasharray value for a line type
 */
function getLineDashArray(lineType) {
  switch(lineType) {
    case 'dashed':
      return "5,5";
    case 'dotted':
      return "1,3";
    case 'dashdot':
      return "10,5,2,5";
    default:
      return null; // Solid line
  }
}

/**
 * Generic legend renderer for additional aesthetic bindings
 */
function renderGenericLegend(legend, scale, type, aesthetic, _instructions, startY) {
  const primaryGeometry = determineGeometryType(_instructions);
  const shapeType = determineShapeType(_instructions);
  
  // Get default style properties based on aesthetic type
  const defaultStyle = getDefaultStyleForAesthetic(aesthetic);
  
  if (type === 'discrete') {
    const domain = scale.domain();
    let currentY = startY;
    
    domain.forEach((value, i) => {
      const itemGroup = legend.append("g")
        .attr("class", "legend-item")
        .attr("transform", `translate(0, ${currentY})`);
      
      // Render an appropriate visual based on the aesthetic type
      renderAestheticSwatch(itemGroup, aesthetic, scale(value), primaryGeometry, shapeType, defaultStyle);
      
      // Add text label
      itemGroup.append("text")
        .attr("x", 25)
        .attr("y", 0)
        .attr("font-size", "11px")
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "middle")
        .text(value);
      
      currentY += 20;
    });
    
    return currentY;
  } else {
    // Continuous scale implementation
    const domain = scale.domain();
    const niceValues = generateNiceValues(domain, 5);
    let currentY = startY;
    
    niceValues.forEach((value, i) => {
      const itemGroup = legend.append("g")
        .attr("class", "legend-item")
        .attr("transform", `translate(0, ${currentY})`);
      
      // Render appropriate swatch based on aesthetic
      renderAestheticSwatch(itemGroup, aesthetic, scale(value), primaryGeometry, shapeType, defaultStyle);
      
      // Add text label with formatted value
      itemGroup.append("text")
        .attr("x", 25)
        .attr("y", 0)
        .attr("font-size", "10px")
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "middle")
        .text(`${prettifyNumber(value)}`);
      
      currentY += 20;
    });
    
    return currentY;
  }
}

/**
 * Renders a swatch appropriate for the given aesthetic
 */
function renderAestheticSwatch(group, aesthetic, value, geometry, shapeType, defaultStyle) {
  switch(aesthetic) {
    case 'alpha':
      group.append("rect")
        .attr("x", 0)
        .attr("y", -8)
        .attr("width", 16)
        .attr("height", 16)
        .attr("fill", defaultStyle.fill)
        .attr("opacity", value)
        .attr("stroke", "black")
        .attr("stroke-width", 0.5);
      break;
    
    case 'strokeWidth':
      group.append("circle")
        .attr("cx", 8)
        .attr("cy", 0)
        .attr("r", 8)
        .attr("fill", "none")
        .attr("stroke", defaultStyle.stroke)
        .attr("stroke-width", value);
      break;
    
    default:
      // Generic swatch
      group.append("rect")
        .attr("x", 0)
        .attr("y", -8)
        .attr("width", 16)
        .attr("height", 16)
        .attr("fill", defaultStyle.fill)
        .attr("stroke", "black")
        .attr("stroke-width", 0.5);
  }
}

/**
 * Returns default style properties for an aesthetic for legend rendering
 */
function getDefaultStyleForAesthetic(aesthetic) {
  switch(aesthetic) {
    case 'alpha':
      return { fill: "steelblue", stroke: "black" };
    case 'strokeWidth':
      return { fill: "none", stroke: "steelblue" };
    // Add more aesthetics as needed
    default:
      return { fill: "steelblue", stroke: "black" };
  }
}

// Helper functions to measure different types of legends
function measureColorLegendItems(legend, scale, type, aesthetic, _instructions, startY) {
  if (type === 'discrete') {
    const domain = scale.domain();
    const itemCount = domain.length;
    const itemHeight = itemCount * 20;
    return { itemHeight, itemWidth: 100 }; // Narrower width estimate
  } else {
    return { itemHeight: 100, itemWidth: 70 }; // Narrower width for gradient
  }
}

function measureSizeLegendItems(legend, scale, type, aesthetic, _instructions, startY) {
  const domain = scale.domain();
  
  if (type === 'discrete') {
    const itemCount = domain.length;
    return { itemHeight: itemCount * 25, itemWidth: 80 }; // Narrower width
  } else {
    return { itemHeight: 120, itemWidth: 80 }; // Narrower width
  }
}

function measureGenericLegendItems(legend, scale, type, aesthetic, _instructions, startY) {
  if (type === 'discrete') {
    const domain = scale.domain();
    return { itemHeight: domain.length * 20, itemWidth: 80 }; // Narrower width
  } else {
    return { itemHeight: 100, itemWidth: 80 }; // Narrower width
  }
}

/**
 * Generates aesthetically pleasing, evenly spaced, rounded values for legends
 */
function generateNiceValues(domain, count) {
  const min = domain[0];
  const max = domain[1];
  const range = max - min;
  
  // Determine appropriate magnitude for rounding
  const magnitude = Math.pow(10, Math.floor(Math.log10(range / count)));
  
  // Create nice rounded values
  return Array.from({ length: count }, (_, i) => {
    // Generate value at this position
    const rawValue = min + (range * i / (count - 1));
    
    // Round to appropriate magnitude
    return Math.round(rawValue / magnitude) * magnitude;
  });
}

/**
 * Format numbers more attractively for legend display
 */
function prettifyNumber(value) {
  if (typeof value !== 'number') return value;
  
  // For very large numbers, use k, M notation
  if (Math.abs(value) >= 1000) {
    const lookup = [
      { value: 1, symbol: "" },
      { value: 1e3, symbol: "k" },
      { value: 1e6, symbol: "M" },
      { value: 1e9, symbol: "B" },
    ];
    const item = lookup.slice().reverse().find(item => Math.abs(value) >= item.value);
    return (Math.round((value / item.value) * 10) / 10) + item.symbol;
  }
  
  // For small numbers, round to make them prettier
  if (Math.abs(value) < 0.01) return Math.round(value * 1000) / 1000;
  if (Math.abs(value) < 0.1) return Math.round(value * 100) / 100;
  if (Math.abs(value) < 1) return Math.round(value * 10) / 10;
  
  // For medium numbers, round to nearest whole or half number
  if (Math.abs(value) < 10) return Math.round(value * 2) / 2;
  if (Math.abs(value) < 100) return Math.round(value);
  if (Math.abs(value) < 1000) return Math.round(value / 5) * 5;
  
  return Math.round(value);
}

/**
 * Generate evenly spaced values from a scale's domain
 */
function generateRangeValues(scale, count) {
  const domain = scale.domain();
  const min = domain[0];
  const max = domain[1];
  const step = (max - min) / (count - 1);
  
  return Array.from({ length: count }, (_, i) => min + i * step);
}

/**
 * Generate color values for a color scale
 */
function generateColorRangeValues(scale, count) {
  const domain = scale.domain();
  const min = domain[0];
  const max = domain[1];
  const step = (max - min) / (count - 1);
  
  return Array.from({ length: count }, (_, i) => scale(min + i * step));
}

/**
 * Format numeric values for legend display
 */
function formatLegendValue(value) {
  return prettifyNumber(value);
}

/**
 * Determines the primary geometry type used in the plot
 */
function determineGeometryType(_instructions) {
  // Prioritize line over point when both exist
  const layers = _instructions.layers || {};
  const hasLine = Object.values(layers).some(layer => layer.geometry === 'line');
  
  if (hasLine) return 'line';
  
  // Grab the first layer's geometry as the primary type
  const firstLayer = Object.values(layers)[0];
  return firstLayer ? firstLayer.geometry : 'point';
}

/**
 * Determines the shape used in scatter points
 */
function determineShapeType(_instructions) {
  // Default shape is circle if not specified
  let shape = 'circle';
  
  // Look through point layers for shape binding or attribute
  const layers = _instructions.layers || {};
  for (const layerKey in layers) {
    const layer = layers[layerKey];
    if (layer.geometry === 'point') {
      // Check if shape is bound to data
      if (_instructions.bindings && _instructions.bindings.shape) {
        shape = 'variable'; // Variable shape - use circle for legend
      }
      // Check if shape is specified as an attribute
      else if (layer.attributes && layer.attributes.shape) {
        shape = layer.attributes.shape;
      }
    }
  }
  
  return shape;
}

/**
 * Gets the d3 symbol type based on shape name
 */
function getSymbolType(shape) {
  const symbolMap = {
    'circle': d3.symbolCircle,
    'cross': d3.symbolCross,
    'diamond': d3.symbolDiamond,
    'square': d3.symbolSquare,
    'star': d3.symbolStar,
    'triangle': d3.symbolTriangle,
    'wye': d3.symbolWye
  };
  
  return symbolMap[shape] || d3.symbolCircle;
}

/**
 * Extract attributes from the appropriate geometry layer
 */
function extractGeometryAttributes(_instructions, geometryType) {
  const { layers } = _instructions;
  const attributes = {};
  
  for (const layerName in layers) {
    const layer = layers[layerName];
    if (layer.geometry === geometryType && layer.attributes) {
      // Copy all attributes from the first matching layer
      return { ...layer.attributes };
    }
  }
  
  return attributes;
}
