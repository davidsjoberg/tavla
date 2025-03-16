export { make_scales_to_bindings, updateScaleRanges, scale_expand };

/**
 * Creates a continuous color scale between two colors
 */
function createContinuousColorScale(range, domain) {
  return d3.scaleLinear()
    .domain(domain)
    .range(range)
    .interpolate(d3.interpolateRgb);
}

/**
 * Validates and creates a scale based on binding type, data type, and user configuration
 * @param {string} bindingType - The aesthetic binding type (color, size, alpha, etc.)
 * @param {array} domain - The domain values
 * @param {object} userConfig - User-provided scale configuration
 * @param {boolean} isNumeric - Whether the data is numeric
 * @returns {object} An object containing the scale and scale type
 */
function createAppropriateScale(bindingType, domain, userConfig, isNumeric) {
  // Get default range based on binding type and data type
  const defaultRange = getDefaultRange(bindingType, domain, isNumeric);
  
  // Use user-provided range if available, otherwise use default
  const range = userConfig.range || defaultRange;
  
  // For non-color bindings with categorical data, check if we have enough values in range
  if (!isNumeric && !isColorBinding(bindingType)) {
    validateRangeForCategories(range, domain, bindingType);
  }
  
  // Create appropriate scale based on binding type and data type
  if (isNumeric) {
    // Numeric data - use continuous scale
    if (isColorBinding(bindingType)) {
      // For color bindings, use color interpolation
      return {
        scale: createContinuousColorScale(range, domain),
        type: "number"
      };
    } else {
      // For other bindings, use standard linear scale
      return {
        scale: d3.scaleLinear().domain(domain).range(range),
        type: "number"
      };
    }
  } else {
    // Categorical data - first check if we have enough values or can generate them
    if (isColorBinding(bindingType)) {
      // For color bindings, use ordinal scale with validation
      let scaleRange = range;
      
      // If only 2 colors but more categories, generate intermediate colors
      if (range.length < domain.length && range.length === 2) {
        scaleRange = generateColorGradient(range[0], range[1], domain.length);
      } else if (range.length < domain.length) {
        throw new Error(`Insufficient colors for ${bindingType}: ${range.length} colors provided for ${domain.length} categories.`);
      }
      
      return {
        scale: d3.scaleOrdinal().domain(domain).range(scaleRange),
        type: "discrete"
      };
    } else {
      // For non-color categorical data
      // If only min/max provided for categories, generate intermediate values
      let scaleRange = range;
      if (range.length === 2 && domain.length > 2) {
        // Generate a range of values between the min and max
        scaleRange = generateValueRange(range[0], range[1], domain.length);
      }
      
      return {
        scale: d3.scaleOrdinal().domain(domain).range(scaleRange),
        type: "discrete"
      };
    }
  }
}

/**
 * Check if a binding is a color-related binding
 */
function isColorBinding(bindingType) {
  return ['color', 'fill', 'stroke'].includes(bindingType);
}

/**
 * Validate that we have enough values in the range for categorical data
 */
function validateRangeForCategories(range, domain, bindingType) {
  if (range.length < domain.length) {
    // If only min/max provided, we can generate intermediate values
    if (range.length !== 2) {
      throw new Error(`Insufficient values for ${bindingType} scale: ${range.length} values provided for ${domain.length} categories.`);
    }
  }
  return true;
}

/**
 * Get default range based on binding type and data characteristics
 */
function getDefaultRange(bindingType, domain, isNumeric) {
  switch(bindingType) {
    case 'color':
    case 'fill':
      return isNumeric ? ['blue', 'red'] : d3.schemeCategory10.slice(0, domain.length);
    
    case 'stroke':
      return isNumeric ? ['#333', '#999'] : d3.schemeSet3.slice(0, domain.length);
    
    case 'size':
      return isNumeric ? [5, 100] : generateValueRange(20, 80, domain.length);
    
    case 'alpha':
      return isNumeric ? [0.2, 0.9] : generateValueRange(0.3, 0.9, domain.length);
    
    case 'strokeWidth':
      return isNumeric ? [0.5, 3] : generateValueRange(0.5, 3, domain.length);
    
    default:
      // Generic range for other bindings
      return isNumeric ? [0, 1] : domain.map((_, i) => i);
  }
}

/**
 * Generates colors evenly distributed between start and end colors
 */
function generateColorGradient(startColor, endColor, count) {
  const colorScale = d3.scaleLinear()
    .domain([0, count - 1])
    .range([startColor, endColor])
    .interpolate(d3.interpolateRgb);
    
  return Array.from({ length: count }, (_, i) => colorScale(i));
}

/**
 * Generates numeric values evenly distributed between min and max
 */
function generateValueRange(minValue, maxValue, count) {
  return Array.from({ length: count }, (_, i) => {
    return minValue + (maxValue - minValue) * (i / (count - 1));
  });
}

/**
 * Creates scales for all bindings based on data and user configurations
 */
function make_scales_to_bindings(_instructions) {
  const scalesAndTypes = {};
  
  // Extract the user-defined scale configurations
  const userScaleConfigs = _instructions.scales || {};
  
  // Helper function to extract unique values and check if they're numeric
  const extract_unique_ascending = (binding, data) => {
    if (!binding) return { values: [], isNumeric: false };
    
    const values = [...new Set(data.map(d => d[binding]))];
    const isNumeric = values.every(v => !isNaN(v) && v !== null && v !== "");
    
    return {
      values: isNumeric ? values.map(Number).sort((a, b) => a - b) : values,
      isNumeric
    };
  };
  
  // Process each binding to create appropriate scales
  for (const key in _instructions.bindings) {
    const binding = _instructions.bindings[key];
    
    // Skip if no binding is provided
    if (!binding) continue;
    
    // Extract unique values and check if they're numeric
    const { values, isNumeric } = extract_unique_ascending(binding, _instructions.data);
    
    if (values.length === 0) continue; // Skip if no values
    
    // Get user-provided scale configuration
    const userConfig = userScaleConfigs[key] || {};
    
    // Define domain based on data type and user configuration
    const domain = userConfig.domain || (isNumeric ? 
      [Math.min(...values), Math.max(...values)] : values);
    
    // Special handling for positional scales (x and y)
    if (key === 'x' || key === 'y') {
      if (isNumeric) {
        scalesAndTypes[key] = {
          scale: d3.scaleLinear().domain(domain),
          type: "number"
        };
      } else {
        scalesAndTypes[key] = {
          scale: d3.scaleBand().domain(domain).padding(0.1),
          type: "discrete"
        };
      }
      continue;
    }
    
    // For all non-positional bindings, use the generalized scale creation
    try {
      scalesAndTypes[key] = createAppropriateScale(key, domain, userConfig, isNumeric);
    } catch (error) {
      console.error(`Error creating scale for ${key}:`, error.message);
      throw error;
    }
  }
  
  // Add scales to instructions
  _instructions.scalesAndTypes = scalesAndTypes;
  
  return _instructions;
}

/**
 * Updates the range of scales based on new dimensions
 */
function updateScaleRanges(_instructions) {
  const { scalesAndTypes, dimensions } = _instructions;
  
  // Only update position scales (x and y)
  for (const key in scalesAndTypes) {
    const scaleObj = scalesAndTypes[key];
    
    if (key === 'x' && scaleObj.scale.range) {
      scaleObj.scale.range([0, dimensions.ctrWidth]);
    }
    else if (key === 'y' && scaleObj.scale.range) {
      scaleObj.scale.range([dimensions.ctrHeight, 0]);
    }
  }
  
  return _instructions;
}

function scale_expand(range_array, mult) {
  const domain = range_array[1] - range_array[0];
  return [range_array[0] - domain * mult, range_array[1] + domain * mult];
}