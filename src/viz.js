import { dirigent } from "./dirigent.js";

// Function to generate scatter plot data
function generateScatterData() {
  return Array.from({ length: 25 }, (_, i) => ({
    id: i + 1,
    year: 2000 + i,
    profit: Math.random() * 100000,
    expenses: Math.random() * 50000,
    region: `Region ${Math.ceil(Math.random() * 3)}`
  }));
}

// Function to generate line chart data
function generateLineData() {
  const lineData = [];
  const startYear = 2015;
  const endYear = 2020;
  const numYears = endYear - startYear + 1;
  const products = ['Product A', 'Product B', 'Product C'];

  products.forEach(product => {
    let sales = 100 + Math.random() * 10;
    for (let i = 0; i < numYears; i++) {
      const growthRate = 0.05;
      const seasonalEffect = Math.sin((i / 12) * 2 * Math.PI) * 10;
      const randomNoise = Math.random() * 20 - 10;

      sales = sales * (1 + growthRate) + seasonalEffect + randomNoise;

      lineData.push({
        year: startYear + i,
        sales: Math.round(sales),
        product: product
      });
    }
  });

  return lineData;
}

// Function to generate bar chart data
function generateBarData() {
  return [
    { category: 'A', subgroup: 'X', value: 30 },
    { category: 'A', subgroup: 'Y', value: 50 },
    { category: 'B', subgroup: 'X', value: 80 },
    { category: 'B', subgroup: 'Y', value: 20 },
    { category: 'C', subgroup: 'X', value: 45 },
    { category: 'C', subgroup: 'Y', value: 25 },
    { category: 'D', subgroup: 'X', value: 60 },
    { category: 'D', subgroup: 'Y', value: 40 },
    { category: 'E', subgroup: 'X', value: 20 },
    { category: 'E', subgroup: 'Y', value: 30 },
    { category: 'F', subgroup: 'X', value: 90 },
    { category: 'F', subgroup: 'Y', value: 10 },
    { category: 'G', subgroup: 'X', value: 55 },
    { category: 'G', subgroup: 'Y', value: 35 }
  ];
}

// Function to create scatter plot instructions
function createScatterInstructions(data) {
  return {
    data: data,
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
          stroke: "black",
          opacity: 0.7
        },
      },
      layer2: {
        geometry: "text",
        attributes: {
          color: "black",
          size: 18,
          opacity: 0.7
        },
      },
      layer3Test: {
        geometry: "text",
        attributes: {
          color: "black",
          size: 18,
          opacity: 0.7
        },
      }
    }
  };
}

// Function to create line chart instructions
function createLineInstructions(data) {
  return {
    data: data,
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
          stroke: "black",
          size: 10,
          opacity: 0.7
        }
      },
      layer2: {
        geometry: "text",
        attributes: {
          color: "black",
          size: 12,
          opacity: 0.7
        },
      }
    }
  };
}

// Function to create bar chart instructions
function createBarInstructions(data, type) {
  return {
    data: data,
    bindings: {
      x: "category",
      y: "value",
      color: "subgroup"
    },
    labels: {
      x: "Category",
      y: "Value"
    },
    layers: {
      layer1: {
        geometry: "bar",
        attributes: {
          stroke: "black",
          size: 2,
          type: type,
          opacity: 1
        }
      }
    }
  };
}

// Generate data
const scatterData = generateScatterData();
const lineData = generateLineData();
const barData = generateBarData();

// Create instructions
const instructionsScatter = createScatterInstructions(scatterData);
const instructionsLine = createLineInstructions(lineData);
const instructionsBarDodge = createBarInstructions(barData, "dodge");
const instructionsBarStack = createBarInstructions(barData, "stack");

// Create the plots using the updated instructions
const plot1 = dirigent("#viz1", instructionsScatter, 700, "plot1");
const plot2 = dirigent("#viz2", instructionsLine, 700, "plot2");
const plot3 = dirigent("#viz3", instructionsBarDodge, 700, "plot3");
const plot4 = dirigent("#viz4", instructionsBarStack, 700, "plot4");