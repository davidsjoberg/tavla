/**
 * Position text labels according to their context
 * @param {Object} d - Data point
 * @param {Object} accessors - Data accessors
 * @param {Object} scalesAndTypes - Scales for rendering
 * @param {Object} _instructions - Full instructions object
 * @param {Object} attributes - Layer attributes
 * @returns {Object} Position with x and y coordinates
 */
export function calculateTextPosition(d, accessors, scalesAndTypes, _instructions, attributes) {
    let x, y;
    
    // Get the category and color values
    const category = accessors.x(d);
    const colorValue = accessors.color ? accessors.color(d) : null;
    const yValue = accessors.y(d);
    
    // Basic y-position
    y = scalesAndTypes.y.scale(yValue);
    
    // Adjust for text height offset if specified
    if (attributes.yOffset) {
        y += attributes.yOffset;
    }
    
    // If this is a categorical x scale with bandwidth
    if (scalesAndTypes.x.scale.bandwidth) {
        // Calculate x position based on barType if specified
        if (attributes.barType === 'dodge' && colorValue !== null) {
            // For dodge bar type, reproduce the subgroup scale from the parameters
            // instead of relying on another layer's calculation
            
            // Create a new subgroup scale using the same parameters
            const groupPadding = attributes.groupPadding !== undefined ? attributes.groupPadding : 0.1;
            const barPadding = attributes.barPadding !== undefined ? attributes.barPadding : 0.05;
            
            // Get all possible color values from the dataset
            let allColorValues = [];
            try {
                // Find the color column using bindings
                const bindings = _instructions.bindings || {};
                const colorBinding = Object.entries(bindings).find(([key]) => key === 'color');
                
                if (colorBinding && colorBinding[1]) {
                    const colorColumn = colorBinding[1];
                    // Extract all unique values
                    allColorValues = [...new Set(_instructions.data.map(item => item[colorColumn]))];
                }
            } catch (err) {
                console.warn("Error getting color values", err);
                // Proceed with empty array - will use default positioning
            }
            
            if (allColorValues.length > 0) {
                // Create a scale for bar positioning within group - same as the bar layer would
                const subgroupScale = d3.scaleBand()
                    .domain(allColorValues)
                    .range([0, scalesAndTypes.x.scale.bandwidth()])
                    .padding(barPadding);
                
                // Try to find the color value in the data to match against color values
                const dataColorValue = allColorValues.find(val => val === colorValue);
                
                if (dataColorValue) {
                    // Position text in the middle of each bar
                    x = scalesAndTypes.x.scale(category) + 
                        subgroupScale(dataColorValue) + 
                        (subgroupScale.bandwidth() / 2);
                } else {
                    // Fallback to center of category if color value isn't found
                    x = scalesAndTypes.x.scale(category) + (scalesAndTypes.x.scale.bandwidth() / 2);
                }
            } else {
                // Fallback to center of category
                x = scalesAndTypes.x.scale(category) + (scalesAndTypes.x.scale.bandwidth() / 2);
            }
        } 
        else if (attributes.barType === 'stack') {
            // For stacked bars, center within the category
            x = scalesAndTypes.x.scale(category) + 
                (scalesAndTypes.x.scale.bandwidth() / 2);
        }
        else {
            // Default to middle of band
            x = scalesAndTypes.x.scale(category) + 
                (scalesAndTypes.x.scale.bandwidth() / 2);
        }
    }
    else {
        // For non-categorical scales, use the scale directly
        x = scalesAndTypes.x.scale(accessors.x(d));
    }
    
    return { x, y };
}
