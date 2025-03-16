export function extractBindingRules(_instructions) {
    const { geoms } = _instructions;

    if (!geoms) {
        throw new Error('filteredGeomDatabase not found in instructions');
    }

    const binding_rules = Object.fromEntries(
        Object.entries(geoms).map(([geometry, data]) => [
            geometry,
            data.binding_rules
        ])
    );

    return binding_rules;
}

export function extractRenderFunctions(_instructions) {
    const { geoms } = _instructions;

    if (!geoms) {
        throw new Error('geoms not found in instructions');
    }

    const render_functions = Object.fromEntries(
        Object.entries(geoms).map(([geometry, data]) => [
            geometry,
            data.render_function
        ])
    );

    return render_functions;
}

export function getPointsAlongPaths(_svg, layerId, numPoints = 10) {
    // Select all elements within the layer
    const elements = _svg.selectAll(`#${layerId} *`);

    // Initialize an array to store points
    const pointsAlongPaths = [];

    elements.each(function () {
        // Check if the element is a path
        if (this.tagName === 'path') {
            const path = this;

            // Extract stroke width
            const strokeWidth = parseFloat(path.getAttribute('stroke-width')) || 0;

            // Get the transformation from the 'transform' attribute, if present
            const transformAttr = path.getAttribute('transform');
            let offsetX = 0, offsetY = 0;

            if (transformAttr && transformAttr.startsWith('translate')) {
                // Parse the translate(x, y) values
                const match = /translate\(([^,]+),\s*([^)]+)\)/.exec(transformAttr);
                if (match) {
                    offsetX = parseFloat(match[1]);
                    offsetY = parseFloat(match[2]);
                }
            }

            // Get the total length of the path
            const pathLength = path.getTotalLength();

            // Calculate the interval for points
            const interval = pathLength / (numPoints - 1);

            // Get the parent group and its attributes
            const parentGroup = path.closest('g');
            const groupAttributes = {};
            if (parentGroup) {
                Array.from(parentGroup.attributes).forEach(attr => {
                    groupAttributes[attr.name] = attr.value;
                });
            }

            // Generate points along the path
            const points = [];
            for (let i = 0; i < numPoints; i++) {
                const point = path.getPointAtLength(i * interval);
                points.push({
                    x: point.x + offsetX,
                    y: point.y + offsetY
                });
            }

            // Add the points for this path to the result
            pointsAlongPaths.push({
                element: path,
                points,
                groupAttributes: groupAttributes,
                layerId: layerId,
            });
        }
    });

    return pointsAlongPaths;
}

/**
 * Calculate geometry extents based on data values rather than headless rendering
 * @param {Object} _instructions Plot instructions
 * @returns {Object} Object containing xExtent and yExtent
 */
export function calculateGeometryExtents(_instructions) {
  // Check that we have all required properties
  if (!_instructions || !_instructions.data || !_instructions.bindings) {
    console.warn('Missing required properties in instructions for calculateGeometryExtents');
    return {
      xExtent: [0, 1],
      yExtent: [0, 1]
    };
  }

  const { layers, data, bindings } = _instructions;
  
  // Initialize extents with extreme values
  let xMin = Infinity, xMax = -Infinity;
  let yMin = Infinity, yMax = -Infinity;
  
  // Process each layer to determine extents
  if (layers) {
    Object.entries(layers).forEach(([layerName, layerInfo]) => {
      if (!layerInfo) return;
      
      const { geometry, attributes } = layerInfo;
      const layerData = layerInfo.transformed_data || data;
      
      // Extract the column names from bindings or layer-specific bindings
      const xColumn = layerInfo.bindings?.x || bindings.x;
      const yColumn = layerInfo.bindings?.y || bindings.y;
      const colorColumn = layerInfo.bindings?.color || bindings.color;
      
      if (geometry === 'bar' && attributes?.type === 'stack' && colorColumn) {
        // Handle stacked bar charts by calculating group totals
        const groupedData = d3.group(layerData, d => d[xColumn]);
        
        groupedData.forEach((group, key) => {
          // Calculate sum of values for each stack
          const stackedValues = {};
          group.forEach(item => {
            const colorKey = item[colorColumn];
            if (!stackedValues[colorKey]) stackedValues[colorKey] = 0;
            stackedValues[colorKey] += +(item[yColumn] || 0);
          });
          
          // Calculate total stack height
          const total = Object.values(stackedValues).reduce((sum, val) => sum + val, 0);
          
          // Update y extent based on stacked total
          yMax = Math.max(yMax, total);
          
          // For bar charts, include the minimum value as well
          const minValue = Math.min(...Object.values(stackedValues));
          yMin = Math.min(yMin, minValue);
        });
      } else {
        // For other chart types, calculate simple min/max
        layerData.forEach(d => {
          if (xColumn && yColumn) {
            const x = +d[xColumn];
            const y = +d[yColumn];
            
            if (!isNaN(x)) {
              xMin = Math.min(xMin, x);
              xMax = Math.max(xMax, x);
            }
            
            if (!isNaN(y)) {
              yMin = Math.min(yMin, y);
              yMax = Math.max(yMax, y);
            }
          }
        });
      }
    });
  }
  
  // Handle case where no valid extents were found
  if (xMin === Infinity) xMin = 0;
  if (xMax === -Infinity) xMax = 1;
  if (yMin === Infinity) yMin = 0;
  if (yMax === -Infinity) yMax = 1;
  
  // Add padding to extents to ensure all geometries are fully visible
  const xPadding = (xMax - xMin) * 0.05;
  const yPadding = (yMax - yMin) * 0.10;
  
  xMin -= xPadding;
  xMax += xPadding;
  yMin -= yPadding; // Important: Add padding to yMin even if it's negative
  yMax += yPadding;
  
  return {
    xExtent: [xMin, xMax],
    yExtent: [yMin, yMax]
  };
}

// Provide alias for backward compatibility
export const calculateExtents = calculateGeometryExtents;

/**
 * Adjust scales based on the calculated extents
 * @param {Object} _instructions Plot instructions
 * @param {Object} extents Object containing xExtent and yExtent
 */
export function adjustScales(_instructions, extents) {
  // Check if scales exist
  if (!_instructions || !_instructions.scalesAndTypes) {
    console.warn('scalesAndTypes not found in instructions for adjustScales');
    return _instructions;
  }
  
  // Adjust X scale if it's a numerical scale
  if (_instructions.scalesAndTypes.x && _instructions.scalesAndTypes.x.type === "number") {
    _instructions.scalesAndTypes.x.scale.domain(extents.xExtent).nice();
  }
  
  // Adjust Y scale if it's a numerical scale
  if (_instructions.scalesAndTypes.y && _instructions.scalesAndTypes.y.type === "number") {
    _instructions.scalesAndTypes.y.scale.domain(extents.yExtent).nice();
  }
  
  return _instructions;
}