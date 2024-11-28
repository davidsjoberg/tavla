import { dirigent } from "./dirigent.js";

// Updated scatter plot data
const scatterData = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  year: 2000 + i,
  profit: Math.random() * 100000, // Profit between 0 and 100,000
  expenses: Math.random() * 50000, // Expenses between 0 and 50,000
  region: `Region ${Math.ceil(Math.random() * 3)}` // Regions 1 to 3
}));

// Updated line chart data with groups
const lineData = [];
const startYear = 2000;
const endYear = 2020;
const numYears = endYear - startYear + 1;
const products = ['Product A', 'Product B', 'Product C']; // Three products

products.forEach(product => {
  let sales = 100 + Math.random() * 20; // Starting sales value with slight variation
  for (let i = 0; i < numYears; i++) {
    // Simulate a yearly growth rate and add random noise
    const growthRate = 0.05; // 5% annual growth
    const seasonalEffect = Math.sin((i / 12) * 2 * Math.PI) * 10; // Seasonal variation
    const randomNoise = Math.random() * 20 - 10; // Random fluctuation between -10 and +10

    sales = sales * (1 + growthRate) + seasonalEffect + randomNoise;

    lineData.push({
      year: startYear + i,
      sales: Math.round(sales),
      product: product
    });
  }
});

// Instructions for the scatter plot
const instructionsScatter = {
  data: scatterData,
  bindings: {
    x: "expenses",
    y: "profit",
    color: "region",
    size: "expenses",
    text: "region"
  },
  labels: {
    x: "Year",
    y: "Profit"
  },
  layers: {
    layer1: {
      geometry: "point",
      attributes: {
        stroke: "black"
      },
    },
    layer12: {
      geometry: "text",
      attributes: {
        color: "black",
        size: 18
      },
    }
  }
};

// Instructions for the line chart with groups
const instructionsLine = {
  data: lineData,
  bindings: {
    x: "year",
    y: "sales",
    color: "product",
    text: "sales"
  },
  labels: {
    x: "Year",
    y: "Sales"
  },
  layers: {
    layer1: {
      geometry: "line",
      attributes: {
        stroke: "black"
      }
    },
    layer12: {
      geometry: "text",
      attributes: {
        color: "black",
        size: 12
      },
    }
  }
};

// Create the plots using the updated instructions
const plot1 = dirigent("#viz1", instructionsScatter, 700, "plot1");
const plot2 = dirigent("#viz2", instructionsLine, 700, "plot2");