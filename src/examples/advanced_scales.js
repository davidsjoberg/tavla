import { dirigent } from '../dirigent.js';

/**
 * Renders examples showing the generalized scale system for all binding types
 */
export function renderAdvancedScalesExamples(containerId) {
  const container = document.getElementById(containerId);
  
  // Create example data with multiple attributes
  const data = generateAdvancedScaleData();
  
  // Example 1: Multiple custom scales in one visualization
  const multiScaleConfig = {
    data,
    bindings: {
      x: "x",
      y: "y",
      color: "value",
      size: "intensity",
      alpha: "density"
    },
    labels: {
      x: "X Axis",
      y: "Y Axis",
      title: "Multiple Custom Scales",
      subtitle: "Applying custom scales to color, size, and opacity"
    },
    layers: {
      points: {
        geometry: "point",
        attributes: {
          stroke: "black",
          strokeWidth: 0.5
        }
      }
    },
    scales: {
      color: {
        range: ["#2c7bb6", "#ffffbf", "#d7191c"], // Blue-Yellow-Red
        domain: [0, 50, 100]                      // Custom domain with midpoint
      },
      size: {
        range: [20, 300],
        domain: [0, 100]
      },
      alpha: {
        range: [0.3, 1.0],   // Low to high opacity
        domain: [0, 100]     // Density range
      }
    }
  };
  
  // Example 2: Custom stroke width scale
  const strokeWidthConfig = {
    data,
    bindings: {
      x: "x",
      y: "y",
      color: "category",
      strokeWidth: "importance"  // Custom stroke width binding
    },
    labels: {
      x: "X Axis",
      y: "Y Axis",
      title: "Custom Stroke Width Scale",
      subtitle: "Mapping data values to outline thickness"
    },
    layers: {
      points: {
        geometry: "point",
        attributes: {
          size: 150,
          alpha: 0.8
        }
      }
    },
    scales: {
      color: {
        range: ["#66c2a5", "#fc8d62", "#8da0cb"]  // Colorblind-friendly palette
      },
      strokeWidth: {
        range: [0.5, 5],                         // Thin to thick strokes
        domain: [0, 100]                         // Importance range
      }
    }
  };
  
  // Example 3: Categorical data with all custom scales
  const categoricalConfig = {
    data,
    bindings: {
      x: "x",
      y: "y",
      color: "category",
      size: "category",
      alpha: "category"
    },
    labels: {
      x: "X Axis",
      y: "Y Axis",
      title: "Categorical Custom Scales",
      subtitle: "Consistent mapping across all aesthetics"
    },
    layers: {
      points: {
        geometry: "point",
        attributes: {
          stroke: "black",
          strokeWidth: 1
        }
      }
    },
    scales: {
      color: {
        range: ["#1b9e77", "#d95f02", "#7570b3"]  // Custom categorical colors
      },
      size: {
        range: [80, 200, 350]  // Different size for each category
      },
      alpha: {
        range: [0.4, 0.7, 1.0]  // Different opacity for each category
      }
    }
  };
  
  // Create and render the examples
  const createExample = (config) => {
    const exampleDiv = document.createElement('div');
    exampleDiv.className = 'example-row';
    container.appendChild(exampleDiv);
    
    const vizContainer = document.createElement('div');
    vizContainer.className = 'viz-container';
    exampleDiv.appendChild(vizContainer);
    
    dirigent(vizContainer, config, 500);
    
    const codeContainer = document.createElement('pre');
    codeContainer.className = 'code-container';
    exampleDiv.appendChild(codeContainer);
    
    codeContainer.textContent = getScalesDescription(config.scales);
  };
  
  createExample(multiScaleConfig);
  createExample(strokeWidthConfig);
  createExample(categoricalConfig);
}

/**
 * Generate example data with multiple attributes for scale demos
 */
function generateAdvancedScaleData() {
  const categories = ['Group A', 'Group B', 'Group C'];
  return Array.from({ length: 30 }, (_, i) => ({
    id: i + 1,
    x: Math.random() * 100,
    y: Math.random() * 100,
    value: Math.random() * 100,                   // For continuous color scale
    intensity: Math.random() * 100,               // For size scale
    density: Math.random() * 100,                 // For alpha/opacity scale
    importance: Math.random() * 100,              // For stroke width scale
    category: categories[i % categories.length],  // For categorical scales
  }));
}

/**
 * Creates a readable description of the scales configuration
 */
function getScalesDescription(scales) {
  if (!scales) return "No custom scales defined";
  
  const description = ['Custom scales configuration:'];
  
  for (const [key, config] of Object.entries(scales)) {
    description.push(`\n${key}:`);
    
    if (config.range) {
      description.push(`  range: [${config.range.join(', ')}]`);
    }
    
    if (config.domain) {
      description.push(`  domain: [${config.domain.join(', ')}]`);
    }
  }
  
  return description.join('\n');
}
