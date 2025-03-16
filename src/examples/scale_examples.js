import { dirigent } from '../dirigent.js';
import { 
  continuousData, 
  categoricalData, 
  multiCategoryData,
  twoGroupData 
} from './scale_examples_data.js';

export function renderScaleExamples(containerId) {
  const container = document.getElementById(containerId);
  
  // Example 1: Continuous color scale with custom range
  const continuousColorConfig = {
    data: continuousData,
    bindings: {
      x: "x",
      y: "y",
      color: "value",
      size: "size"
    },
    labels: {
      x: "X Value",
      y: "Y Value",
      title: "Continuous Color Scale",
      subtitle: "Mapping numeric values to a blue-red gradient"
    },
    layers: {
      points: {
        geometry: "point",
        attributes: {
          stroke: "black",
          strokeWidth: 0.5,
          alpha: 0.8
        }
      }
    },
    scales: {
      color: {
        range: ["blue", "red"]
      },
      size: {
        range: [20, 200]
      }
    }
  };

  // Example 2: Two-group categorical color scale
  const discreteTwoGroupsConfig = {
    data: twoGroupData,
    bindings: {
      x: "x",
      y: "y",
      color: "group",
      size: "size"
    },
    labels: {
      x: "X Value",
      y: "Y Value",
      title: "Two-Group Color Scale",
      subtitle: "Valid case: Two categories with two colors"
    },
    layers: {
      points: {
        geometry: "point",
        attributes: {
          stroke: "black",
          strokeWidth: 0.5,
          alpha: 0.8
        }
      }
    },
    scales: {
      color: {
        range: ["purple", "orange"]
      },
      size: {
        range: [20, 150]
      }
    }
  };

  // Example 3: Error case - more than two categories with only two colors
  try {
    const errorCaseConfig = {
      data: multiCategoryData,
      bindings: {
        x: "x",
        y: "y",
        color: "group",
        size: "size"
      },
      labels: {
        x: "X Value",
        y: "Y Value",
        title: "Error Case",
        subtitle: "Should show error: 3 categories but only 2 colors"
      },
      layers: {
        points: {
          geometry: "point",
          attributes: {
            stroke: "black",
            strokeWidth: 0.5,
            alpha: 0.8
          }
        }
      },
      scales: {
        color: {
          range: ["green", "yellow"]  // Only two colors for three categories!
        },
        size: {
          range: [30, 150]
        }
      }
    };

    // This should throw an error due to insufficient colors
    const errorExample = document.createElement('div');
    container.appendChild(errorExample);
    dirigent(errorExample, errorCaseConfig, 500, "error-example");
  } catch (error) {
    // Create error message display
    const errorDiv = document.createElement('div');
    errorDiv.className = "error-example";
    errorDiv.style.backgroundColor = "rgba(255,0,0,0.1)";
    errorDiv.style.border = "1px solid red";
    errorDiv.style.padding = "20px";
    errorDiv.style.borderRadius = "8px";
    errorDiv.style.marginBottom = "20px";
    
    errorDiv.innerHTML = `
      <h3 style="color: red; margin-top: 0;">Error Case: Insufficient Colors</h3>
      <p>Tried to use only 2 colors for 3 categories.</p>
      <p><strong>Error message:</strong> ${error.message}</p>
    `;
    
    container.appendChild(errorDiv);
  }

  // Example 4: Continuous size scale
  const continuousSizeConfig = {
    data: continuousData,
    bindings: {
      x: "x",
      y: "y",
      size: "value"
    },
    labels: {
      x: "X Value",
      y: "Y Value",
      title: "Continuous Size Scale",
      subtitle: "Mapping numeric values to point sizes"
    },
    layers: {
      points: {
        geometry: "point",
        attributes: {
          fill: "steelblue",
          stroke: "black",
          strokeWidth: 0.5,
          alpha: 0.8
        }
      }
    },
    scales: {
      size: {
        range: [10, 300]  // Min to max size
      }
    }
  };

  // Render all valid examples
  const ex1 = document.createElement('div');
  container.appendChild(ex1);
  dirigent(ex1, continuousColorConfig, 500, "continuous-color-example");
  
  const ex2 = document.createElement('div');
  container.appendChild(ex2);
  dirigent(ex2, discreteTwoGroupsConfig, 500, "discrete-color-example");
  
  const ex4 = document.createElement('div');
  container.appendChild(ex4);
  dirigent(ex4, continuousSizeConfig, 500, "continuous-size-example");
}
