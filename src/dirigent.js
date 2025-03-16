export {dirigent};
import * as scales from './helpers/scales.js';
import * as axis from './helpers/axis.js';
import * as geoms from './helpers/geoms.js';
import * as render from './helpers/render.js';
import * as panel from './helpers/panel.js';
import * as preps from './helpers/preps.js';

function dirigent(_div, _instructions, _plot_width, _plotId) {
  try {
    // Step 1: Add geoms needed
    _instructions = preps.get_geometries(_instructions, geoms.geomDatabase); 
    
    // Step 2: Set up dimensions with dynamic title height measurement
    _instructions.dimensions = panel.panel_dimensions(_plot_width, _instructions);

    // Steps 3-10: Continue with data preparation and scale adjustments
    _instructions = preps.transform_data(_instructions);
    _instructions = scales.make_scales_to_bindings(_instructions);
    _instructions = preps.prepare_extended_instructions(_instructions);
    
    // Step 6: Create a headless SVG for calculating bounds
    const tempSvg = d3.create("svg")
      .attr("width", _instructions.dimensions.width)
      .attr("height", _instructions.dimensions.height)
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("pointer-events", "none");
    
    document.body.appendChild(tempSvg.node());
    
    // Step 7: Create container group - use the SAME transform as the final visualization will use
    const tempContainer = tempSvg.append("g")
      .attr("transform", `translate(${_instructions.dimensions.marginLeft}, ${_instructions.dimensions.marginTop})`);
    
    // Step 8: Render all layers headlessly
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
    
    // Step 9: Get the bounding box of all rendered elements
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
      
      // Check if any content is outside the plot panel
      const needsXAdjustment = minX < 0 || maxX > plotWidth;
      const needsYAdjustment = minY < 0 || maxY > plotHeight;
      
      // Step 10: Convert pixel coordinates to data coordinates
      const xScale = _instructions.scalesAndTypes.x.scale;
      const yScale = _instructions.scalesAndTypes.y.scale;
      
      // Use different adjustment strategies based on geometry type
      const primaryGeometryType = Object.values(_instructions.layers)[0]?.geometry;
      
      if (primaryGeometryType) {
        // Adjust scales based on geometry type
        switch(primaryGeometryType) {
          case 'bar':
            if (_instructions.scalesAndTypes.y.type === "number") {
              // For bar charts, always start from 0
              const yMax = yScale.invert ? yScale.invert(minY) : 1;
              yScale.domain([0, yMax * 1.05]).nice();
            }
            break;
            
          case 'point':
            // For scatter plots, use the actual data extents with a small padding
            if (_instructions.scalesAndTypes.x.type === "number" && needsXAdjustment) {
              const xDataMin = xScale.invert ? xScale.invert(minX) : 0;
              const xDataMax = xScale.invert ? xScale.invert(maxX) : 1;
              const xPadding = (xDataMax - xDataMin) * 0.05;
              xScale.domain([xDataMin - xPadding, xDataMax + xPadding]).nice();
            }
            
            if (_instructions.scalesAndTypes.y.type === "number" && needsYAdjustment) {
              // Y is inverted in SVG
              const yDataMin = yScale.invert ? yScale.invert(maxY) : 0;
              const yDataMax = yScale.invert ? yScale.invert(minY) : 1;
              const yPadding = (yDataMax - yDataMin) * 0.05;
              yScale.domain([yDataMin - yPadding, yDataMax + yPadding]).nice();
            }
            break;
            
          default:
            // For other chart types, use moderate padding
            if (_instructions.scalesAndTypes.x.type === "number" && needsXAdjustment) {
              const xDataMin = xScale.invert ? xScale.invert(minX) : 0;
              const xDataMax = xScale.invert ? xScale.invert(maxX) : 1;
              const xPadding = (xDataMax - xDataMin) * 0.05;
              xScale.domain([xDataMin - xPadding, xDataMax + xPadding]).nice();
            }
            
            if (_instructions.scalesAndTypes.y.type === "number" && needsYAdjustment) {
              // Y is inverted in SVG
              const yDataMin = yScale.invert ? yScale.invert(maxY) : 0;
              const yDataMax = yScale.invert ? yScale.invert(minY) : 1;
              const yPadding = (yDataMax - yDataMin) * 0.1;
              yScale.domain([yDataMin - yPadding, yDataMax + yPadding]).nice();
            }
            break;
        }
      }
      
    } catch (e) {
      console.error("Error calculating bounds:", e);
    } finally {
      // Clean up temporary SVG
      tempSvg.remove();
    }
    
    // Step 11: Create the final SVG for display with measured title height
    let svg = d3.select(_div)
      .append("svg")
      .attr("id", _plotId)
      .attr("width", _instructions.dimensions.width)
      .attr("height", _instructions.dimensions.height);
    
    // Step 12: Render titles with measured positions
    svg = panel.render_titles(svg, _instructions);
    
    // Step 13: Make plot panel
    svg = panel.plot_panel(svg, _instructions);

    // Step 14: Plot layers - draw data layers BEFORE axes so axes appear on top
    svg = render.render_layer(svg, _instructions);
    
    // Step 15: Add axis - draw axes AFTER data layers so they're on top
    svg = axis.plot_axis(svg, _instructions);
    
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
