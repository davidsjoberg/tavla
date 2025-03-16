export {dirigent};
import * as scales from './helpers/scales.js';
import * as axis from './helpers/axis.js';
import * as geoms from './helpers/geoms.js';
import * as render from './helpers/render.js';
import * as panel from './helpers/panel.js';
import * as preps from './helpers/preps.js';
import * as legend from './helpers/legend.js';

function dirigent(_div, _instructions, _plot_width, _plotId) {
  try {
    // Step 1: Add geoms needed
    _instructions = preps.get_geometries(_instructions, geoms.geomDatabase); 
    
    // Step 2: Set up INITIAL dimensions without legend calculations
    // This creates a basic dimensions object that we'll refine later
    const titleHeight = _instructions.labels ? panel.measureTitleHeight(_instructions, _plot_width) : 0;
    
    // Calculate initial dimensions with basic margins - no legend space yet
    _instructions.dimensions = {
      width: _plot_width,
      height: _plot_width / 1.6 + titleHeight,
      marginTop: _plot_width * 0.02 + titleHeight,
      marginRight: _plot_width * 0.06,
      marginBottom: _plot_width * 0.08,
      marginLeft: _plot_width * 0.08,
      titleHeight: titleHeight,
      ctrWidth: _plot_width - (_plot_width * 0.08 * 2) - (_plot_width * 0.06),
      ctrHeight: (_plot_width / 1.6) - (_plot_width * 0.02 + titleHeight) - (_plot_width * 0.08)
    };
    
    // Step 3: Now we can create scales using these initial dimensions
    _instructions = preps.transform_data(_instructions);
    _instructions = scales.make_scales_to_bindings(_instructions);
    _instructions = preps.prepare_extended_instructions(_instructions);
    
    // Step 4: NOW calculate final dimensions with proper legend space
    _instructions.dimensions = panel.panel_dimensions(_plot_width, _instructions);
    
    // Step 5: Update scale ranges to match new dimensions
    _instructions = scales.updateScaleRanges(_instructions);
    
    // Step 6: Create a headless SVG for calculating data bounds
    const tempSvg = d3.create("svg")
      .attr("width", _instructions.dimensions.width)
      .attr("height", _instructions.dimensions.height)
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("pointer-events", "none");
    
    document.body.appendChild(tempSvg.node());
    
    // Step 7: Create container group with correct transform
    const tempContainer = tempSvg.append("g")
      .attr("transform", `translate(${_instructions.dimensions.marginLeft}, ${_instructions.dimensions.marginTop})`);
    
    // Step 8: Render all layers headlessly to measure
    const render_functions_list = preps.extractRenderFunctions(_instructions);
    
    // Create separate layer groups to track each layer's elements
    const layerGroups = {};
    
    for (let layer in _instructions.layers) {
      const layerInfo = _instructions.layers[layer];
      const { geometry } = layerInfo;
      
      // Create a specific group for this layer
      layerGroups[layer] = tempContainer.append("g")
        .attr("class", `headless-layer-${layer}`);
      
      const handler = render_functions_list[geometry];
      if (handler) {
        handler(layerGroups[layer], layer, _instructions, layerInfo, _instructions.scalesAndTypes);
      }
    }
    
    // Step 9: Calculate bounds and adjust scales
    try {
      // First collect bounding boxes for each individual layer
      const layerBoundingBoxes = {};
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      
      // Process each layer separately to understand which ones extend the boundaries
      for (let layer in layerGroups) {
        const layerGroup = layerGroups[layer];
        const layerElements = layerGroup.selectAll("*").nodes();
        
        let layerMinX = Infinity, layerMinY = Infinity;
        let layerMaxX = -Infinity, layerMaxY = -Infinity;
        
        layerElements.forEach(element => {
          try {
            const bbox = element.getBBox();
            layerMinX = Math.min(layerMinX, bbox.x);
            layerMinY = Math.min(layerMinY, bbox.y);
            layerMaxX = Math.max(layerMaxX, bbox.x + bbox.width);
            layerMaxY = Math.max(layerMaxY, bbox.y + bbox.height);
          } catch (e) {
            // Skip elements that don't have a bounding box
          }
        });
        
        if (layerMinX !== Infinity) {
          layerBoundingBoxes[layer] = {
            minX: layerMinX,
            minY: layerMinY,
            maxX: layerMaxX,
            maxY: layerMaxY,
            width: layerMaxX - layerMinX,
            height: layerMaxY - layerMinY
          };
          
          // Update the overall bounds
          minX = Math.min(minX, layerMinX);
          minY = Math.min(minY, layerMinY);
          maxX = Math.max(maxX, layerMaxX);
          maxY = Math.max(maxY, layerMaxY);
        }
      }
      
      // Get plot panel dimensions
      const plotWidth = _instructions.dimensions.ctrWidth;
      const plotHeight = _instructions.dimensions.ctrHeight;
      
      // First ensure elements are within bounds
      _instructions = ensureElementsWithinBounds(_instructions, layerBoundingBoxes);
      
      // Then apply consistent padding
      _instructions = applyUniversalPadding(_instructions);
      
    } catch (e) {
      console.error("Error calculating bounds:", e);
    } finally {
      // Clean up temporary SVG
      tempSvg.remove();
    }
    
    // Step 10: Create the final SVG for display
    let svg = d3.select(_div)
      .append("svg")
      .attr("id", _plotId)
      .attr("width", _instructions.dimensions.width)
      .attr("height", _instructions.dimensions.height);
    
    // Step 11: Render titles, panel, layers, axes, and legends
    svg = panel.render_titles(svg, _instructions);
    svg = panel.plot_panel(svg, _instructions);
    svg = render.render_layer(svg, _instructions);
    svg = axis.plot_axis(svg, _instructions);
    svg = legend.createLegends(svg, _instructions);
    
    return svg.node();
  } catch (error) {
    console.error("Error in dirigent:", error);
    
    // Return a simple error SVG
    const errorSvg = d3.select(_div)
      .append("svg")
      .attr("id", _plotId)
      .attr("width", _plot_width)
      .attr("height", _plot_width / 1.6)
      .append("text")
      .attr("x", _plot_width / 2)
      .attr("y", _plot_width / 3)
      .attr("text-anchor", "middle")
      .attr("fill", "red")
      .text("Error rendering visualization");
    
    return errorSvg.node().parentNode;
  }
}

// Updated universal padding function to use geometry-specific configurations
function applyUniversalPadding(_instructions) {
  const { scalesAndTypes, layers } = _instructions;
  
  // Get the primary geometry type
  const primaryGeometry = Object.values(layers)[0]?.geometry || 'point';
  
  // Get the geometry-specific scale configuration
  const scaleConfig = geoms.getGeometryScaleConfig(primaryGeometry);
  
  // Handle X-axis padding based on scale type
  if (scalesAndTypes.x && scalesAndTypes.x.type === "number" && 
      typeof scalesAndTypes.x.scale.invert === 'function') {
    
    // Get current domain
    const domain = scalesAndTypes.x.scale.domain();
    const dataRange = domain[1] - domain[0];
    
    // Calculate padding amount based on data range and geometry-specific config
    const padding = dataRange * scaleConfig.padding.x;
    
    // Apply padding consistently
    const newDomain = [domain[0] - padding, domain[1] + padding];
    
    // Apply nice() based on geometry preference
    if (scaleConfig.useNice) {
      scalesAndTypes.x.scale.domain(newDomain).nice();
    } else {
      scalesAndTypes.x.scale.domain(newDomain);
    }
  }
  
  // Handle Y-axis padding based on chart type
  if (scalesAndTypes.y && scalesAndTypes.y.type === "number" && 
      typeof scalesAndTypes.y.scale.invert === 'function') {
    
    // For geometries that enforce zero on Y-axis (like bars)
    if (scaleConfig.enforceZero) {
      const yMax = scalesAndTypes.y.scale.domain()[1];
      const yPadding = yMax * scaleConfig.padding.y;
      scalesAndTypes.y.scale.domain([0, yMax + yPadding])
        .nice(scaleConfig.useNice ? undefined : null);
    } 
    else {
      // For other chart types, apply padding to both sides
      const domain = scalesAndTypes.y.scale.domain();
      const dataRange = domain[1] - domain[0];
      const padding = dataRange * scaleConfig.padding.y;
      
      const newDomain = [domain[0] - padding, domain[1] + padding];
      
      // Apply nice() based on geometry preference
      if (scaleConfig.useNice) {
        scalesAndTypes.y.scale.domain(newDomain).nice();
      } else {
        scalesAndTypes.y.scale.domain(newDomain);
      }
    }
  }
  
  return _instructions;
}

// Add a new function to check if elements are within bounds
function ensureElementsWithinBounds(_instructions, layerBoundingBoxes) {
  // Gets all rendered elements and checks their bounds against the plot area
  // This is especially important for scatter plots with large points
  
  const { scalesAndTypes, dimensions } = _instructions;
  
  // Ensure we have bounding boxes to work with
  if (!layerBoundingBoxes || Object.keys(layerBoundingBoxes).length === 0) {
    return _instructions; // Can't do any adjustments
  }
  
  // Get the plot area bounds
  const plotWidth = dimensions.ctrWidth;
  const plotHeight = dimensions.ctrHeight;
  
  // Find min/max values across all layers
  let overallMinX = Infinity, overallMinY = Infinity;
  let overallMaxX = -Infinity, overallMaxY = -Infinity;
  
  Object.values(layerBoundingBoxes).forEach(bbox => {
    overallMinX = Math.min(overallMinX, bbox.minX);
    overallMinY = Math.min(overallMinY, bbox.minY);
    overallMaxX = Math.max(overallMaxX, bbox.maxX);
    overallMaxY = Math.max(overallMaxY, bbox.maxY);
  });
  
  // Check if any elements are outside the plot area
  const leftOverflow = overallMinX < 0 ? Math.abs(overallMinX) : 0;
  const rightOverflow = overallMaxX > plotWidth ? overallMaxX - plotWidth : 0;
  const topOverflow = overallMinY < 0 ? Math.abs(overallMinY) : 0;
  const bottomOverflow = overallMaxY > plotHeight ? overallMaxY - plotHeight : 0;
  
  // If there's any overflow, adjust the scales
  if (leftOverflow > 0 || rightOverflow > 0) {
    // Adjust x scale to accommodate overflow
    if (scalesAndTypes.x && scalesAndTypes.x.type === "number") {
      const xScale = scalesAndTypes.x.scale;
      if (typeof xScale.invert === 'function') {
        // Convert pixel overflow to data values
        const domain = xScale.domain();
        const dataRange = domain[1] - domain[0];
        const pixelRange = plotWidth;
        const dataPerPixel = dataRange / pixelRange;
        
        // Calculate new domain
        const newXMin = domain[0] - (leftOverflow * dataPerPixel);
        const newXMax = domain[1] + (rightOverflow * dataPerPixel);
        
        // Apply new domain
        xScale.domain([newXMin, newXMax]);
      }
    }
  }
  
  if (topOverflow > 0 || bottomOverflow > 0) {
    // Adjust y scale to accommodate overflow
    if (scalesAndTypes.y && scalesAndTypes.y.type === "number") {
      const yScale = scalesAndTypes.y.scale;
      if (typeof yScale.invert === 'function') {
        // Convert pixel overflow to data values (y is inverted)
        const domain = yScale.domain();
        const dataRange = domain[1] - domain[0];
        const pixelRange = plotHeight;
        const dataPerPixel = dataRange / pixelRange;
        
        // Calculate new domain (remembering y is inverted in SVG)
        const newYMin = domain[0] - (bottomOverflow * dataPerPixel);
        const newYMax = domain[1] + (topOverflow * dataPerPixel);
        
        // Apply new domain
        yScale.domain([newYMin, newYMax]);
      }
    }
  }
  
  return _instructions;
}
