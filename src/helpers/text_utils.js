/**
 * Text positioning utilities for better label placement
 */

export { calculateTextPosition };

function calculateTextPosition(d, accessors, scalesAndTypes, instructions, attributes = {}) {
    // Get base positions from the data - these are the exact point coordinates
    const x = scalesAndTypes.x.scale(accessors.x(d));
    const y = scalesAndTypes.y.scale(accessors.y(d));
    
    // Only apply offsets if explicitly specified in attributes
    const xOffset = attributes.xOffset || 0;
    const yOffset = attributes.yOffset || 0;
    
    // For bar charts, use special positioning
    if (attributes.barType) {
        return positionLabelForBar(d, accessors, scalesAndTypes, attributes, instructions);
    }
    
    // For regular point labels, center at the data point by default
    return {
        x: x + xOffset,
        y: y + yOffset
    };
}

/**
 * Calculate position adjustment based on data point context
 */
function getPositionAdjustment(d, accessors, scalesAndTypes, attributes) {
    // Default position adjustment
    const adjustment = { x: 0, y: 0 };
    
    // Adjust labels to be above points by default
    if (attributes.position === 'above' || (!attributes.position && accessors.y)) {
        adjustment.y = -10; // Default offset above data points
    } else if (attributes.position === 'below') {
        adjustment.y = 15; // Default offset below data points
    }
    
    // If the text is for a data value, check if we should adjust based on value
    if (accessors.text && accessors.y && typeof accessors.text(d) === 'number') {
        const value = accessors.y(d);
        // If it's a negative value, position the label below the point
        if (value < 0) {
            adjustment.y = Math.abs(adjustment.y) + 5;
        }
    }
    
    return adjustment;
}

/**
 * Special positioning for bar chart labels
 */
function positionLabelForBar(d, accessors, scalesAndTypes, attributes, instructions) {
    const barType = attributes.barType;
    
    // Default offsets
    const xOffset = attributes.xOffset || 0;
    const yOffset = attributes.yOffset || -5; // Default above the bar
    
    let x, y;
    
    if (barType === 'dodge') {
        // For grouped bars, need to account for the subgroup position
        const category = accessors.x(d);
        const colorValue = accessors.color ? accessors.color(d) : 'default';
        
        // If we have bar width information, we can calculate the center
        const colorValues = instructions.data
            .filter(item => accessors.x(item) === category)
            .map(item => accessors.color ? accessors.color(item) : 'default');
        
        const uniqueColors = [...new Set(colorValues)];
        
        // Calculate the position within the group
        const bandWidth = scalesAndTypes.x.scale.bandwidth();
        const subBandWidth = bandWidth / uniqueColors.length;
        const subgroupIndex = uniqueColors.indexOf(colorValue);
        
        x = scalesAndTypes.x.scale(category) + (subgroupIndex * subBandWidth) + (subBandWidth / 2);
    } else {
        // For regular or stacked bars, just use the center of the bar
        x = scalesAndTypes.x.scale(accessors.x(d)) + scalesAndTypes.x.scale.bandwidth() / 2;
    }
    
    // Y position depends on the bar value
    const value = accessors.y(d);
    y = scalesAndTypes.y.scale(value);
    
    // Return final position with offsets
    return {
        x: x + xOffset,
        y: y + yOffset
    };
}
