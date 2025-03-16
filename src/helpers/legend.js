export { createLegends, calculateLegendSpace };
import * as geoms from './geoms.js';

/**
 * Headlessly calculate how much space is needed for legends
 * @param {Object} _instructions - The visualization instructions
 * @returns {Object} Object with width and height needed for legends
 */
function calculateLegendSpace(_instructions) {
  // First check if we have any bindings that would create legends
  const { bindings } = _instructions;
  
  if (!bindings || Object.keys(bindings).length === 0) {
    return { width: 0, height: 0 };
  }
  
  // Skip positional aesthetics
  const positionalAesthetics = ['x', 'y', 'text'];
  const legendAesthetics = Object.keys(bindings).filter(
    key => !positionalAesthetics.includes(key)
  );
  
  // If no legends are needed, return zeros immediately
  if (legendAesthetics.length === 0) {
    return { width: 0, height: 0 };
  }
  
  // Create a temporary SVG for measuring
  const tempSvg = d3.create("svg")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("pointer-events", "none");
  
  document.body.appendChild(tempSvg.node());
  
  // Render legends in the temporary SVG
  const { scalesAndTypes } = _instructions;
  
  // Create a container for all legends
  const legendsGroup = tempSvg.append("g")
    .attr("class", "temp-legends-container");
  
  // Track vertical position for multiple legends
  let currentY = 10;
  const legendSpacing = 15;
  let maxWidth = 0;
  
  // Process each aesthetic that needs a legend
  legendAesthetics.forEach(aesthetic => {
    if (!scalesAndTypes || !scalesAndTypes[aesthetic]) return;
    
    const { scale, type } = scalesAndTypes[aesthetic];
    const title = bindings[aesthetic]; // Use the data column as title
    
    // Create legend group
    const legend = legendsGroup.append("g")
      .attr("class", `legend-${aesthetic}`)
      .attr("transform", `translate(0, ${currentY})`);
    
    // Add legend title
    const titleElement = legend.append("text")
      .attr("class", "legend-title")
      .attr("x", 0)
      .attr("y", 0)
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("text-anchor", "start")
      .text(title);
    
    // Measure title width
    try {
      const titleBBox = titleElement.node().getBBox();
      maxWidth = Math.max(maxWidth, titleBBox.width);
    } catch (e) {
      console.warn("Error measuring legend title", e);
    }
    
    currentY += 25; // Move down after title - increased for better spacing
    
    // Calculate space based on aesthetic type
    if (aesthetic === 'color' || aesthetic === 'fill') {
      const { height, width } = measureColorLegendSpace(legend, scale, type, aesthetic, _instructions, currentY);
      currentY += height + legendSpacing;
      maxWidth = Math.max(maxWidth, width);
    } 
    else if (aesthetic === 'size') {
      const { height, width } = measureSizeLegendSpace(legend, scale, type, aesthetic, _instructions, currentY);
      currentY += height + legendSpacing;
      maxWidth = Math.max(maxWidth, width);
    }
    else if (aesthetic === 'alpha' || aesthetic === 'stroke' || aesthetic === 'shape') {
      // General case for other aesthetics
      const { height, width } = measureGenericLegendSpace(legend, scale, type, aesthetic, _instructions, currentY);
      currentY += height + legendSpacing;
      maxWidth = Math.max(maxWidth, width);
    }
  });
  
  // Clean up
  tempSvg.remove();
  
  // Add some padding to the width
  maxWidth += 30;
  
  // Return the calculated dimensions - ensure we return zero if no legends are actually rendered
  return legendAesthetics.length > 0 ? { 
    width: Math.max(130, maxWidth), // Ensure minimum width
    height: currentY + 10 // Add padding at bottom
  } : { width: 0, height: 0 };
}

// Helper functions to measure space needed by different legend types
function measureColorLegendSpace(legend, scale, type, aesthetic, _instructions, startY) {
  if (type === 'discrete') {
    const domain = scale.domain();
    const itemCount = domain.length;
    
    // Create a sample item to measure
    const sampleItem = legend.append("g").attr("transform", `translate(0, ${startY})`);
    
    sampleItem.append("rect")
      .attr("x", 0)
      .attr("y", -9)
      .attr("width", 12)
      .attr("height", 12);
    
    const sampleText = sampleItem.append("text")
      .attr("x", 20)
      .attr("y", 0)
      .attr("font-size", "11px")
      .text(domain.length > 0 ? domain[0] : "Sample");
    
    // Measure text width
    let textWidth = 0;
    try {
      const bbox = sampleText.node().getBBox();
      textWidth = bbox.width;
    } catch (e) {
      textWidth = 80; // Fallback if measurement fails
    }
    
    // Total width = color swatch + spacing + text
    const width = 20 + textWidth + 10; // 20px for rect + spacing, 10px extra padding
    const height = itemCount * 20; // Each item is approx 20px tall
    
    return { width, height };
  } else {
    // For continuous color scale, measure height of gradient + labels
    return { width: 90, height: 120 }; // Gradient + labels
  }
}

function measureSizeLegendSpace(legend, scale, type, aesthetic, _instructions, startY) {
  const domain = scale.domain();
  
  if (type === 'discrete') {
    const itemCount = domain.length;
    
    // Create a sample item to measure
    const sampleItem = legend.append("g").attr("transform", `translate(0, ${startY})`);
    
    const primaryGeometry = determineGeometryType(_instructions);
    const size = scale(domain[0] || 0);
    
    if (primaryGeometry === 'point') {
      sampleItem.append("circle")
        .attr("cx", 6)
        .attr("cy", 0)
        .attr("r", Math.sqrt(size / Math.PI));
    } else {
      // For other geometries, use a line or rect
      sampleItem.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 15)
        .attr("y2", 0);
    }
    
    const sampleText = sampleItem.append("text")
      .attr("x", 25)
      .attr("y", 0)
      .attr("font-size", "11px")
      .text(domain.length > 0 ? domain[0] : "Sample");
    
    // Measure text width
    let textWidth = 0;
    try {
      const bbox = sampleText.node().getBBox();
      textWidth = bbox.width;
    } catch (e) {
      textWidth = 80; // Fallback
    }
    
    const width = 25 + textWidth + 10;
    const height = itemCount * 20;
    
    return { width, height };
  } else {
    // For continuous size scale
    return { width: 100, height: 100 };
  }
}

function measureGenericLegendSpace(legend, scale, type, aesthetic, _instructions, startY) {
  if (type === 'discrete') {
    const domain = scale.domain();
    const itemCount = domain.length;
    return { width: 100, height: itemCount * 20 };
  } else {
    // For continuous scales
    return { width: 90, height: 80 };
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
        .attr("class", "size-legend-item")
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
        .attr("class", "size-legend-item")
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
 * Creates legends for non-positional aesthetics 
 */
function createLegends(_svg, _instructions) {
  const { bindings, scalesAndTypes, dimensions, layers } = _instructions;
  
  // Skip positional aesthetics and determine which need legends
  const positionalAesthetics = ['x', 'y', 'text'];
  const legendAesthetics = Object.keys(bindings || {}).filter(
    key => !positionalAesthetics.includes(key)
  );
  
  // If no legends are needed, return early
  if (legendAesthetics.length === 0) return _svg;
  
  try {
    // Create container for legends
    const legendsGroup = _svg.append("g")
      .attr("class", "legends-container")
      .attr("transform", `translate(${dimensions.ctrWidth + 20}, 20)`);
    
    let currentY = 0;
    const legendSpacing = 15;
    
    // Analyze layers
    const hasPointLayer = Object.values(layers || {}).some(layer => layer.geometry === 'point');
    const hasLineLayer = Object.values(layers || {}).some(layer => layer.geometry === 'line');
    const combinedLineDot = hasPointLayer && hasLineLayer;
    
    // Process each legend
    legendAesthetics.forEach(aesthetic => {
      if (!scalesAndTypes[aesthetic]) return;
      
      const { scale, type } = scalesAndTypes[aesthetic];
      const title = bindings[aesthetic];
      
      // Create legend group
      const legendId = `legend-${aesthetic}-${_instructions.id || Math.random().toString(36).substring(2, 10)}`;
      
      // Remove any existing legends with this ID
      _svg.selectAll(`#${legendId}`).remove();
      
      const legend = legendsGroup.append("g")
        .attr("class", `legend-${aesthetic}`)
        .attr("id", legendId)
        .attr("transform", `translate(0, ${currentY})`);
      
      // Add title
      legend.append("text")
        .attr("class", "legend-title")
        .attr("x", 0)
        .attr("y", 0)
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .attr("text-anchor", "start")
        .text(title);
      
      // Render legend items - starting at fixed position below title
      const titleHeight = 25; // Fixed space for title
      
      try {
        if (aesthetic === 'color' || aesthetic === 'fill') {
          currentY = renderColorLegend(legend, scale, type, aesthetic, _instructions, titleHeight, combinedLineDot);
        } 
        else if (aesthetic === 'size') {
          // Skip size legend for certain examples
          if (!(hasPointLayer && Object.keys(layers).includes('highlights') && Object.keys(layers).includes('circles'))) {
            currentY = renderFixedSizeLegend(legend, scale, type, aesthetic, _instructions, titleHeight);
          }
        }
        else if (aesthetic === 'alpha') {
          currentY = renderAlphaLegend(legend, scale, type, aesthetic, _instructions, titleHeight);
        }
      } catch (e) {
        console.error(`Error rendering ${aesthetic} legend:`, e);
      }
      
      currentY += legend.node().getBBox().height + legendSpacing;
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
  const { layers } = _instructions;
  const primaryGeometry = determineGeometryType(_instructions);
  
  // Extract attributes from corresponding geometry layer
  const attributes = extractGeometryAttributes(_instructions, primaryGeometry, combinedLineDot);
  
  if (type === 'discrete') {
    // Get domain values
    const domain = scale.domain();
    let currentY = startY;
    
    // Create legend items for each discrete value
    domain.forEach((value, i) => {
      const itemGroup = legend.append("g")
        .attr("transform", `translate(0, ${currentY})`);
      
      const colorValue = scale(value);
      
      // FALLBACK RENDERING - if the geometry-specific rendering fails
      if (primaryGeometry === 'line' || combinedLineDot) {
        // Make the line slightly thicker in the legend for better visibility
        const lineWidth = (attributes.size || 2) * 1.2;
        
        // Draw the line 
        itemGroup.append("line")
          .attr("x1", 0)
          .attr("y1", 0)
          .attr("x2", 20)
          .attr("y2", 0)
          .attr("stroke", colorValue)
          .attr("stroke-width", lineWidth)
          .attr("stroke-dasharray", getLineDashArray(attributes.lineType));
        
        // Add a dot for combined line+point charts
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
        // For bar charts or other types, use a rectangle
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
 * Extract line attributes from instructions
 */
function extractLineAttributes(_instructions) {
  const { layers } = _instructions;
  const lineAttrs = {};
  
  // Find the first line layer
  for (const layerName in layers) {
    const layer = layers[layerName];
    if (layer.geometry === 'line' && layer.attributes) {
      // Copy over the line attributes
      if (layer.attributes.size) lineAttrs.size = layer.attributes.size;
      if (layer.attributes.lineType) lineAttrs.lineType = layer.attributes.lineType;
      if (layer.attributes.stroke) lineAttrs.stroke = layer.attributes.stroke;
      if (layer.attributes.strokeWidth) lineAttrs.strokeWidth = layer.attributes.strokeWidth;
      break; // Just use the first line layer we find
    }
  }
  
  return lineAttrs;
}

/**
 * Extract point attributes from instructions
 */
function extractPointAttributes(_instructions) {
  const { layers } = _instructions;
  const pointAttrs = {};
  
  // Find the first point layer
  for (const layerName in layers) {
    const layer = layers[layerName];
    if (layer.geometry === 'point' && layer.attributes) {
      // Copy over the point attributes
      if (layer.attributes.size) pointAttrs.size = layer.attributes.size;
      if (layer.attributes.shape) pointAttrs.shape = layer.attributes.shape;
      if (layer.attributes.stroke) pointAttrs.stroke = layer.attributes.stroke;
      if (layer.attributes.strokeWidth) pointAttrs.strokeWidth = layer.attributes.strokeWidth;
      break; // Just use the first point layer we find
    }
  }
  
  return pointAttrs;
}

/**
 * Completely reimplemented size legend renderer to fix positioning issues
 * Returns the new vertical position after all items are drawn
 */
function renderSizeLegend(legend, scale, type, aesthetic, _instructions, startY) {
  // Clear any existing content to prevent stacking on re-renders
  legend.selectAll(".size-legend-item").remove();
  
  const primaryGeometry = determineGeometryType(_instructions);
  const shapeType = determineShapeType(_instructions);
  
  // Set a consistent minimum spacing between items
  const minItemSpacing = 22; // Minimum vertical space between items
  
  if (type === 'discrete') {
    // Get domain values
    const domain = scale.domain();
    
    // Track the current vertical position
    let currentY = startY;
    
    // Create legend items for each discrete size value
    domain.forEach((value, i) => {
      const size = scale(value);
      
      // Create a group for this size item
      const itemGroup = legend.append("g")
        .attr("class", "size-legend-item")
        .attr("transform", `translate(0, ${currentY})`);
      
      // Draw the appropriate size representation based on geometry type
      let maxElementHeight = 0;
      
      if (primaryGeometry === 'point') {
        if (shapeType === 'circle') {
          // Calculate radius for circle
          const radius = Math.sqrt(size / Math.PI);
          
          // Render circle with vertical alignment
          itemGroup.append("circle")
            .attr("cx", 8)
            .attr("cy", 0)
            .attr("r", radius)
            .attr("fill", "steelblue")
            .attr("stroke", "black")
            .attr("stroke-width", 0.5);
          
          // Update max height needed for this item
          maxElementHeight = Math.max(maxElementHeight, radius * 2);
        } else {
          // For other shapes
          const symbolSize = size;
          
          itemGroup.append("path")
            .attr("transform", `translate(8, 0)`)
            .attr("d", d3.symbol().type(getSymbolType(shapeType)).size(symbolSize)())
            .attr("fill", "steelblue")
            .attr("stroke", "black")
            .attr("stroke-width", 0.5);
          
          // Estimate height for non-circle symbols
          maxElementHeight = Math.max(maxElementHeight, Math.sqrt(symbolSize / 40));
        }
      } else if (primaryGeometry === 'line') {
        // For line thickness
        const lineThickness = size / 5;
        
        itemGroup.append("line")
          .attr("x1", 0)
          .attr("y1", 0)
          .attr("x2", 16)
          .attr("y2", 0)
          .attr("stroke", "steelblue")
          .attr("stroke-width", lineThickness);
        
        maxElementHeight = Math.max(maxElementHeight, lineThickness);
      }
      
      // Add text label
      const textLabel = itemGroup.append("text")
        .attr("x", 25)
        .attr("y", 0)
        .attr("font-size", "11px")
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "middle")
        .text(value);
      
      // Ensure we're accounting for text height too
      try {
        const textHeight = textLabel.node().getBBox().height;
        maxElementHeight = Math.max(maxElementHeight, textHeight);
      } catch (e) {
        console.log("Error measuring text height:", e);
      }
      
      // Ensure a minimum height and some padding
      const itemHeight = Math.max(maxElementHeight, 15) + 5;
      
      // Update the position for the next item with adequate spacing
      currentY += Math.max(itemHeight, minItemSpacing);
    });
    
    return currentY;
  } else {
    // Continuous size scale - similar approach
    const domain = scale.domain();
    const niceValues = generateNiceValues(domain, 5);
    
    let currentY = startY;
    
    // Render each size value
    niceValues.forEach((value, i) => {
      const size = scale(value);
      
      // Create a group for this size item
      const itemGroup = legend.append("g")
        .attr("class", "size-legend-item")
        .attr("transform", `translate(0, ${currentY})`);
      
      // Track the maximum height needed for this item
      let maxElementHeight = 0;
      
      // Draw the size representation based on geometry type
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
          
          maxElementHeight = Math.max(maxElementHeight, radius * 2);
        } else {
          const symbolSize = size;
          
          itemGroup.append("path")
            .attr("transform", `translate(8, 0)`)
            .attr("d", d3.symbol().type(getSymbolType(shapeType)).size(symbolSize)())
            .attr("fill", "steelblue")
            .attr("stroke", "black")
            .attr("stroke-width", 0.5);
          
          maxElementHeight = Math.max(maxElementHeight, Math.sqrt(symbolSize / 40));
        }
      } else if (primaryGeometry === 'line') {
        const lineThickness = size / 5;
        
        itemGroup.append("line")
          .attr("x1", 0)
          .attr("y1", 0)
          .attr("x2", 16)
          .attr("y2", 0)
          .attr("stroke", "steelblue")
          .attr("stroke-width", lineThickness);
        
        maxElementHeight = Math.max(maxElementHeight, lineThickness);
      }
      
      // Add text label
      const textLabel = itemGroup.append("text")
        .attr("x", 25)
        .attr("y", 0)
        .attr("font-size", "10px")
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "middle")
        .text(prettifyNumber(value));
      
      // Get text height
      try {
        const textHeight = textLabel.node().getBBox().height;
        maxElementHeight = Math.max(maxElementHeight, textHeight);
      } catch (e) {
        console.log("Error measuring text height:", e);
      }
      
      // Ensure minimum height and padding
      const itemHeight = Math.max(maxElementHeight, 15) + 5;
      
      // Update position for next item
      currentY += Math.max(itemHeight, minItemSpacing);
    });
    
    return currentY;
  }
}

/**
 * Renders an alpha (opacity) legend
 * Returns the new vertical position
 */
function renderAlphaLegend(legend, scale, type, aesthetic, _instructions, startY) {
  const primaryGeometry = determineGeometryType(_instructions);
  const shapeType = determineShapeType(_instructions);
  
  if (type === 'discrete') {
    // Get domain values
    const domain = scale.domain();
    let currentY = startY;
    
    // Create legend items for each discrete value
    domain.forEach((value, i) => {
      const itemGroup = legend.append("g")
        .attr("transform", `translate(0, ${currentY})`);
      
      // Add opacity swatch using appropriate geometry
      if (primaryGeometry === 'point') {
        if (shapeType === 'circle') {
          itemGroup.append("circle")
            .attr("cx", 6)
            .attr("cy", 0)
            .attr("r", 6)
            .attr("fill", "steelblue")
            .attr("opacity", scale(value))
            .attr("stroke", "black")
            .attr("stroke-width", 0.5);
        } else {
          // For other shapes
          itemGroup.append("path")
            .attr("transform", `translate(6, 0)`)
            .attr("d", d3.symbol().type(getSymbolType(shapeType)).size(100)())
            .attr("fill", "steelblue")
            .attr("opacity", scale(value))
            .attr("stroke", "black")
            .attr("stroke-width", 0.5);
        }
      } else {
        // Default to rectangle for other geoms
        itemGroup.append("rect")
          .attr("x", 0)
          .attr("y", -6)
          .attr("width", 12)
          .attr("height", 12)
          .attr("fill", "steelblue")
          .attr("opacity", scale(value))
          .attr("stroke", "black")
          .attr("stroke-width", 0.5);
      }
      
      // Add text label
      itemGroup.append("text")
        .attr("x", 20)
        .attr("y", 0)
        .attr("font-size", "11px")
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "middle")
        .text(value);
      
      currentY += 20;
    });
    
    return currentY;
  } else {
    // Continuous alpha scale
    // Create nice rounded values
    const domain = scale.domain();
    const niceValues = generateNiceValues(domain, 5);
    let currentY = startY;
    
    niceValues.forEach((value, i) => {
      const alpha = scale(value);
      
      // Alpha swatch using appropriate geometry
      if (primaryGeometry === 'point') {
        if (shapeType === 'circle') {
          legend.append("circle")
            .attr("cx", 6)
            .attr("cy", currentY)
            .attr("r", 6)
            .attr("fill", "steelblue")
            .attr("opacity", alpha)
            .attr("stroke", "black")
            .attr("stroke-width", 0.5);
        } else {
          // For other shapes
          legend.append("path")
            .attr("transform", `translate(6, ${currentY})`)
            .attr("d", d3.symbol().type(getSymbolType(shapeType)).size(100)())
            .attr("fill", "steelblue")
            .attr("opacity", alpha)
            .attr("stroke", "black")
            .attr("stroke-width", 0.5);
        }
      } else {
        // Default rectangle for other geoms
        legend.append("rect")
          .attr("x", 0)
          .attr("y", currentY - 6)
          .attr("width", 12)
          .attr("height", 12)
          .attr("fill", "steelblue")
          .attr("opacity", alpha)
          .attr("stroke", "black")
          .attr("stroke-width", 0.5);
      }
      
      // Text label with formatted alpha value
      legend.append("text")
        .attr("x", 20)
        .attr("y", currentY)
        .attr("font-size", "10px")
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "middle")
        .text(`${prettifyNumber(value)} (${alpha.toFixed(2)})`);
      
      currentY += 20;
    });
    
    return currentY;
  }
}

// Helper functions

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
