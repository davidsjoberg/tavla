// Simple test file to directly observe the error behavior

import { dirigent } from '../dirigent.js';
import { multiCategoryData } from './scale_examples_data.js';

// This configuration will throw an error because we're trying to use
// only 2 colors (blue,red) for 3 categories (A,B,C)
const errorConfig = {
  data: multiCategoryData,
  bindings: {
    x: "x",
    y: "y",
    color: "group"
  },
  labels: {
    title: "Error Test",
    subtitle: "This should show an error in the console"
  },
  layers: {
    points: {
      geometry: "point"
    }
  },
  scales: {
    color: {
      range: ["blue", "red"]  // Only 2 colors for 3 categories!
    }
  }
};

export function runErrorTest() {
  try {
    const container = document.createElement('div');
    document.body.appendChild(container);
    dirigent(container, errorConfig, 400, "error-test");
  } catch (error) {
    console.error("Expected Error:", error.message);
    alert("Error test ran as expected: " + error.message);
  }
}
