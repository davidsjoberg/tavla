/**
 * Utilities for size calculations and conversions
 */

export {
  calculateDefaultSizes,
  parseSizeValue,
  scaleToPanel,
  convertToPixels
};

/**
 * Calculate default sizes based on panel dimensions
 * @param {Object} dimensions - Chart dimensions object
 * @return {Object} Object with default sizes for different elements
 */
function calculateDefaultSizes(dimensions) {
  // Get the plot area
  const plotArea = dimensions.ctrWidth * dimensions.ctrHeight;
  
  // Base scale factor - square root of plot area, normalized to a reference size
  // Reference is based on a "standard" 500x300 chart (sqrt(150000) = ~387)
  const scaleFactor = Math.sqrt(plotArea) / 387;
  
  // Apply different scaling strategies for different elements
  return {
    // Point geometry sizes (in square pixels)
    point: {
      symbolSize: Math.max(30, Math.min(120, 64 * scaleFactor)), // Default symbol size (sq pixels)
      strokeWidth: Math.max(0.5, Math.min(2, 1 * scaleFactor))   // Default stroke width (pixels)
    },
    // Line geometry sizes
    line: {
      strokeWidth: Math.max(1, Math.min(3, 2 * scaleFactor)),    // Default line width (pixels)
      pointSize: Math.max(10, Math.min(40, 25 * scaleFactor))    // Default point size for line+points (sq pixels)
    },
    // Text geometry sizes - 50% larger than smallest implementation
    text: {
      // Base size range from 4-6px to 6-9px
      fontSize: Math.max(6, Math.min(9, 7.5 * Math.pow(scaleFactor, 0.3)))
    },
    // Bar geometry sizes
    bar: {
      strokeWidth: Math.max(0.5, Math.min(2, 1 * scaleFactor)),  // Default bar stroke width (pixels)
      minWidth: Math.max(1, 3 * scaleFactor)                     // Minimum bar width (pixels)
    }
  };
}

/**
 * Parse size value, detecting if it's a number, pixel value, or unit value
 * @param {*} value - Size value to parse
 * @return {Object} Object with value and unit
 */
function parseSizeValue(value) {
  // Default result
  const result = {
    value: 1,
    unit: 'relative', // default is relative sizing (multiplier)
    original: value
  };
  
  // Handle null/undefined
  if (value === null || value === undefined) {
    return result;
  }
  
  // If it's a number, it's a relative size (multiplier)
  if (typeof value === 'number') {
    result.value = value;
    return result;
  }
  
  // If it's a string, check for units
  if (typeof value === 'string') {
    // Check for pixel values
    if (value.endsWith('px')) {
      result.value = parseFloat(value);
      result.unit = 'px';
      return result;
    }
    
    // Check for millimeter values
    if (value.endsWith('mm')) {
      result.value = parseFloat(value);
      result.unit = 'mm';
      return result;
    }
    
    // Check for point values (typography)
    if (value.endsWith('pt')) {
      result.value = parseFloat(value);
      result.unit = 'pt';
      return result;
    }
    
    // If no unit but parseable as number, treat as relative
    const parsedNumber = parseFloat(value);
    if (!isNaN(parsedNumber)) {
      result.value = parsedNumber;
      return result;
    }
  }
  
  // If we couldn't parse it, return default
  return result;
}

/**
 * Scale a relative size value based on panel dimensions
 * @param {number} value - Relative size value (multiplier)
 * @param {string} geometryType - Type of geometry (point, line, text, bar)
 * @param {string} sizeType - Type of size property (symbolSize, strokeWidth, etc)
 * @param {Object} defaultSizes - Default sizes object from calculateDefaultSizes
 * @return {number} Calculated size in pixels
 */
function scaleToPanel(value, geometryType, sizeType, defaultSizes) {
  // Get the default size for this geometry and size type
  const baseSize = 
    defaultSizes[geometryType] && defaultSizes[geometryType][sizeType] ? 
    defaultSizes[geometryType][sizeType] : 
    1; // Fallback if not found
    
  // Apply the multiplier
  return baseSize * value;
}

/**
 * Convert value with units to pixels
 * @param {Object} parsedSize - Result from parseSizeValue
 * @param {string} geometryType - Type of geometry
 * @param {string} sizeType - Type of size property
 * @param {Object} defaultSizes - Default sizes object
 * @param {number} dpi - Display DPI (default 96)
 * @return {number} Size in pixels
 */
function convertToPixels(parsedSize, geometryType, sizeType, defaultSizes, dpi = 96) {
  const { value, unit } = parsedSize;
  
  switch (unit) {
    case 'px':
      return value;
    case 'mm':
      // Convert mm to pixels (1mm = 3.78px at 96dpi)
      return value * (dpi / 25.4);
    case 'pt':
      // Convert points to pixels (1pt = 1.33px at 96dpi)
      return value * (dpi / 72);
    case 'relative':
    default:
      // Scale based on panel size
      return scaleToPanel(value, geometryType, sizeType, defaultSizes);
  }
}
