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
    // Step 1: Add geoms needed - using the centralized geom database
    _instructions = preps.get_geometries(_instructions, geoms.geomDatabase); 
    
    // Step 2: Create scales and prepare data
    _instructions = preps.transform_data(_instructions);
    _instructions = scales.make_scales_to_bindings(_instructions);
    _instructions = preps.prepare_extended_instructions(_instructions);
    
    // Step 3: Calculate dimensions with intelligent legend layout
    _instructions.dimensions = panel.panel_dimensions(_plot_width, _instructions);
    
    // Step 4: Update scale ranges to match new dimensions
    _instructions = scales.updateScaleRanges(_instructions);
    
    // Step 5: Create a headless SVG for calculating data bounds
    const tempSvg = d3.create("svg")
      .attr("width", _instructions.dimensions.width)
      .attr("height", _instructions.dimensions.height)
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("pointer-events", "none");
    
    document.body.appendChild(tempSvg.node());
    
    // Step 6: Create container group with correct transform
    const tempContainer = tempSvg.append("g")
      .attr("transform", `translate(${_instructions.dimensions.marginLeft}, ${_instructions.dimensions.marginTop})`);
    
    // Step 7: Render all layers headlessly to measure - layer-agnostic approach
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
    
    // Step 8: Calculate bounds and adjust scales - use geometry-specific functions
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
      
      // Save bounding boxes for later use by any geometry that needs them
      _instructions.layerBoundingBoxes = layerBoundingBoxes;
      
      // First ensure elements are within bounds - use geometry-specific function
      _instructions = geoms.ensureElementsWithinBounds(_instructions, layerBoundingBoxes);
      
      // Then apply geometry-specific scale adjustments
      _instructions = geoms.applyGeometryScaleAdjustments(_instructions);
      
    } catch (e) {
      console.error("Error calculating bounds:", e);
    } finally {
      // Clean up temporary SVG
      tempSvg.remove();
    }
    
    // Step 9: Create the final SVG for display
    let svg = d3.select(_div)
      .append("svg")
      .attr("id", _plotId)
      .attr("width", _instructions.dimensions.width)
      .attr("height", _instructions.dimensions.height);
    
    // Add basic styles for legends if not already included
    if (!document.getElementById('tavla-legend-styles')) {
      const styleElement = document.createElement('style');
      styleElement.id = 'tavla-legend-styles';
      styleElement.textContent = `
        .legends-container { font-family: Arial, sans-serif; }
        .legend-title { font-weight: 600; font-size: 12px; margin-bottom: 4px; }
        .legend-item text { font-size: 11px; dominant-baseline: middle; }
        .legend-item { margin-bottom: 2px; }
      `;
      document.head.appendChild(styleElement);
    }
    
    // Step 10: Render titles, panel, layers, axes, and legends
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
