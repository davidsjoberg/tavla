import { dirigent } from "./dirigent.js";

// ===== DATA GENERATORS =====

// Function to generate scatter plot data
function generateScatterData(pointCount = 25) {
  return Array.from({ length: pointCount }, (_, i) => ({
    id: i + 1,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 300 + 50,
    value: Math.random() * 100,
    group: `Group ${Math.ceil(Math.random() * 3)}`,
    label: `Point ${i+1}`
  }));
}

// Function to generate line chart data
function generateLineData() {
  const lineData = [];
  const products = ['Product A', 'Product B', 'Product C'];
  const styles = ['solid', 'dashed', 'dotted'];
  
  products.forEach((product, idx) => {
    let sales = 80 + Math.random() * 20;
    for (let year = 2010; year <= 2020; year++) {
      sales = sales * (1 + Math.random() * 0.1 + idx * 0.02) + (Math.random() * 15 - 5);
      lineData.push({
        year: year,
        sales: Math.max(10, Math.round(sales)),
        product: product,
        lineStyle: styles[idx],
      });
    }
  });
  
  return lineData;
}

// Function to generate bar chart data
function generateBarData() {
  const categories = ['A', 'B', 'C', 'D', 'E'];
  const subgroups = ['X', 'Y', 'Z'];
  const barData = [];
  
  categories.forEach(category => {
    subgroups.forEach(subgroup => {
      barData.push({
        category,
        subgroup,
        value: 10 + Math.floor(Math.random() * 90)
      });
    });
  });
  
  return barData;
}

// Function to display a human-readable description instead of JSON
function displayDescription(elementId, config) {
  let description = '';
  
  // Add chart type based on primary layer geometry
  const primaryGeometry = Object.values(config.layers)[0]?.geometry || 'unknown';
  let chartType = '';
  
  switch(primaryGeometry) {
    case 'point':
      chartType = 'Scatter Plot';
      break;
    case 'line':
      chartType = 'Line Chart';
      break;
    case 'bar':
      if (config.layers.bars?.attributes?.type === 'stack') {
        chartType = 'Stacked Bar Chart';
      } else {
        chartType = 'Grouped Bar Chart';
      }
      break;
    case 'text':
      chartType = 'Text Plot';
      break;
    default:
      chartType = 'Chart';
  }
  
  // Add chart title if available
  if (config.labels && config.labels.title) {
    chartType = `${config.labels.title}`;
  }
  
  description += `${chartType}\n\n`;
  
  // Add main bindings
  const bindings = config.bindings || {};
  const bindingsList = Object.entries(bindings)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');
  
  description += `Bindings: ${bindingsList}\n\n`;
  
  // Add description for each layer
  for (const [layerName, layer] of Object.entries(config.layers)) {
    description += `Layer "${layerName}" (${layer.geometry}):\n`;
    
    // Layer-specific bindings
    if (layer.bindings) {
      const layerBindings = Object.entries(layer.bindings)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      description += `  Bindings: ${layerBindings}\n`;
    }
    
    // Layer attributes
    if (layer.attributes) {
      const layerAttributes = Object.entries(layer.attributes)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      description += `  Attributes: ${layerAttributes}\n`;
    }
    
    description += '\n';
  }
  
  // Display scales info if present
  if (config.scales) {
    description += 'Custom scales applied';
  }
  
  document.getElementById(elementId).textContent = description;
}

// ===== SCATTER PLOT EXAMPLES =====

// Example 1: Basic Scatter Plot
const scatter1Data = generateScatterData();
const scatter1Config = {
  data: scatter1Data,
  bindings: {
    x: "x",
    y: "y",
    color: "group"
  },
  labels: {
    x: "X Value",
    y: "Y Value",
    title: "Basic Scatter Plot"
  },
  layers: {
    points: {
      geometry: "point",
      attributes: {
        size: 100,
        alpha: 0.7
      }
    }
  }
};
dirigent("#scatter1", scatter1Config, 700, "scatter1");
displayDescription("scatter1-code", scatter1Config);

// Example 2: Scatter Plot with Size Aesthetic
const scatter2Data = generateScatterData(20);
const scatter2Config = {
  data: scatter2Data,
  bindings: {
    x: "x",
    y: "y",
    color: "group",
    size: "size"
  },
  labels: {
    x: "X Value",
    y: "Y Value",
    title: "Scatter with Size Aesthetic"
  },
  layers: {
    points: {
      geometry: "point",
      attributes: {
        stroke: "black",
        alpha: 0.8
      }
    }
  }
};
dirigent("#scatter2", scatter2Config, 700, "scatter2");
displayDescription("scatter2-code", scatter2Config);

// Example 3: Scatter with Text Labels
const scatter3Data = generateScatterData(15);
const scatter3Config = {
  data: scatter3Data,
  bindings: {
    x: "x",
    y: "y",
    color: "group",
    text: "label"
  },
  labels: {
    x: "X Value",
    y: "Y Value",
    title: "Scatter with Text Labels"
  },
  layers: {
    points: {
      geometry: "point",
      attributes: {
        size: 120,
        alpha: 0.6
      }
    },
    labels: {
      geometry: "text",
      attributes: {
        color: "black",
        size: 12,
        alpha: 1
      }
    }
  }
};
dirigent("#scatter3", scatter3Config, 700, "scatter3");
displayDescription("scatter3-code", scatter3Config);

// Example 4: Multi-layer Scatter with Custom Colors
const scatter4Data = generateScatterData(18);
const scatter4Config = {
  data: scatter4Data,
  bindings: {
    x: "x",
    y: "y",
    size: "value"
  },
  labels: {
    x: "X Value",
    y: "Y Value",
    title: "Custom Colors and Styles"
  },
  layers: {
    circles: {
      geometry: "point",
      attributes: {
        color: "#1f77b4",
        stroke: "#333",
        strokeWidth: 1.5,
        alpha: 0.7
      }
    },
    highlights: {
      geometry: "point",
      bindings: {
        x: "x",
        y: "y"
      },
      attributes: {
        size: 20,
        color: "red",
        stroke: "none",
        alpha: 1
      }
    }
  }
};
dirigent("#scatter4", scatter4Config, 700, "scatter4");
displayDescription("scatter4-code", scatter4Config);

// ===== LINE CHART EXAMPLES =====

// Example 1: Basic Line Chart
const line1Data = generateLineData();
const line1Config = {
  data: line1Data,
  bindings: {
    x: "year",
    y: "sales",
    color: "product"
  },
  labels: {
    x: "Year",
    y: "Sales",
    title: "Basic Line Chart"
  },
  layers: {
    lines: {
      geometry: "line",
      attributes: {
        size: 3
      }
    }
  }
};
dirigent("#line1", line1Config, 700, "line1");
displayDescription("line1-code", line1Config);

// Example 2: Line Chart with Points
const line2Data = generateLineData();
const line2Config = {
  data: line2Data,
  bindings: {
    x: "year",
    y: "sales",
    color: "product"
  },
  labels: {
    x: "Year",
    y: "Sales",
    title: "Line Chart with Points"
  },
  layers: {
    lines: {
      geometry: "line",
      attributes: {
        size: 2.5
      }
    },
    points: {
      geometry: "point",
      attributes: {
        size: 4,
        stroke: "black",
        strokeWidth: 1
      }
    }
  }
};
dirigent("#line2", line2Config, 700, "line2");
displayDescription("line2-code", line2Config);

// Example 3: Line Chart with Custom Line Styles
const line3Data = generateLineData();
const line3Config = {
  data: line3Data,
  bindings: {
    x: "year",
    y: "sales",
    color: "product"
  },
  labels: {
    x: "Year",
    y: "Sales",
    title: "Line Chart with Custom Styles"
  },
  layers: {
    product1: {
      geometry: "line",
      bindings: {
        x: "year",
        y: "sales",
        color: "product"
      },
      attributes: {
        size: 4,
        lineType: "dashed"
      }
    },
    labels: {
      geometry: "text",
      bindings: {
        x: "year",
        y: "sales",
        text: "sales",
        color: "product"
      },
      attributes: {
        size: 10,
        alpha: 0.8
      }
    }
  }
};
dirigent("#line3", line3Config, 700, "line3");
displayDescription("line3-code", line3Config);

// Example 4: Line Chart with Custom Colors
const line4Data = generateLineData();
const uniqueProducts = [...new Set(line4Data.map(d => d.product))];
const customColors = ["#ff7f0e", "#2ca02c", "#d62728"];
const line4Config = {
  data: line4Data,
  bindings: {
    x: "year",
    y: "sales",
    color: "product"
  },
  labels: {
    x: "Year",
    y: "Sales",
    title: "Line Chart with Custom Colors"
  },
  scales: {
    color: {
      domain: uniqueProducts,
      range: customColors
    }
  },
  layers: {
    lines: {
      geometry: "line",
      attributes: {
        size: 3.5,
        alpha: 0.9
      }
    },
    endPoints: {
      geometry: "point",
      bindings: {
        x: "year",
        y: "sales",
        color: "product"
      },
      filter: d => d.year === 2020, // Only show end points
      attributes: {
        size: 10,
        stroke: "white",
        strokeWidth: 2,
        alpha: 1
      }
    }
  }
};
dirigent("#line4", line4Config, 700, "line4");
displayDescription("line4-code", line4Config);

// ===== BAR CHART EXAMPLES =====

// Example 1: Grouped Bar Chart
const bar1Data = generateBarData();
const bar1Config = {
  data: bar1Data,
  bindings: {
    x: "category",
    y: "value",
    color: "subgroup"
  },
  labels: {
    x: "Category",
    y: "Value",
    title: "Grouped Bar Chart"
  },
  layers: {
    bars: {
      geometry: "bar",
      attributes: {
        type: "dodge",
        alpha: 0.8,
        stroke: "white",
        strokeWidth: 1
      }
    }
  }
};
dirigent("#bar1", bar1Config, 700, "bar1");
displayDescription("bar1-code", bar1Config);

// Example 2: Stacked Bar Chart
const bar2Data = generateBarData();
const bar2Config = {
  data: bar2Data,
  bindings: {
    x: "category",
    y: "value",
    color: "subgroup"
  },
  labels: {
    x: "Category",
    y: "Value",
    title: "Stacked Bar Chart"
  },
  layers: {
    bars: {
      geometry: "bar",
      attributes: {
        type: "stack",
        alpha: 0.9
      }
    }
  }
};
dirigent("#bar2", bar2Config, 700, "bar2");
displayDescription("bar2-code", bar2Config);

// Example 3: Bar Chart with Custom Spacing
const bar3Data = generateBarData();
const bar3Config = {
  data: bar3Data,
  bindings: {
    x: "category",
    y: "value",
    color: "subgroup"
  },
  labels: {
    x: "Category",
    y: "Value",
    title: "Bar Chart with Custom Spacing"
  },
  layers: {
    bars: {
      geometry: "bar",
      attributes: {
        type: "dodge",
        groupPadding: 0.3,    // More space between category groups
        barPadding: 0.2,      // More space between bars within a group
        stroke: "black",
        strokeWidth: 1
      }
    }
  }
};
dirigent("#bar3", bar3Config, 700, "bar3");
displayDescription("bar3-code", bar3Config);

// Example 4: Bar Chart with Labels - now with explicit parameters instead of inference
const bar4Data = generateBarData();
const bar4Config = {
  data: bar4Data,
  bindings: {
    x: "category",
    y: "value",
    color: "subgroup",
    text: "value"
  },
  labels: {
    x: "Category",
    y: "Value",
    title: "Bar Chart with Value Labels"
  },
  layers: {
    bars: {
      geometry: "bar",
      attributes: {
        type: "dodge",
        alpha: 0.9,
        stroke: "white",
        groupPadding: 0.1,
        barPadding: 0.05
      }
    },
    labels: {
      geometry: "text",
      bindings: {
        x: "category",
        y: "value",
        text: "value",
        color: "subgroup"
      },
      attributes: {
        color: "black",
        size: 10,
        barType: "dodge",
        groupPadding: 0.1,
        barPadding: 0.05,
        yOffset: -5
      }
    }
  }
};
dirigent("#bar4", bar4Config, 700, "bar4");
displayDescription("bar4-code", bar4Config);