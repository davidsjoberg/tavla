export { 
  continuousData, 
  categoricalData, 
  multiCategoryData,
  twoGroupData
};

// Example dataset for continuous color scales
const continuousData = [
  { x: 10, y: 20, value: 0, size: 5 },
  { x: 15, y: 35, value: 10, size: 8 },
  { x: 20, y: 15, value: 20, size: 12 },
  { x: 25, y: 40, value: 30, size: 15 },
  { x: 30, y: 25, value: 40, size: 18 },
  { x: 35, y: 30, value: 50, size: 21 },
  { x: 40, y: 20, value: 60, size: 24 },
  { x: 45, y: 45, value: 70, size: 27 },
  { x: 50, y: 10, value: 80, size: 30 },
  { x: 55, y: 50, value: 90, size: 33 },
  { x: 60, y: 30, value: 100, size: 36 }
];

// Example dataset with exactly two categories (valid for two-color scales)
const twoGroupData = [
  { x: 10, y: 20, group: "A", size: 10 },
  { x: 15, y: 35, group: "B", size: 15 },
  { x: 20, y: 15, group: "A", size: 20 },
  { x: 25, y: 40, group: "B", size: 25 },
  { x: 30, y: 25, group: "A", size: 30 },
  { x: 35, y: 30, group: "B", size: 35 },
  { x: 40, y: 20, group: "A", size: 40 },
  { x: 45, y: 45, group: "B", size: 45 },
  { x: 50, y: 10, group: "A", size: 50 },
  { x: 55, y: 50, group: "B", size: 55 }
];

// Example dataset with multiple categories (for error demonstration)
const multiCategoryData = [
  { x: 10, y: 20, group: "A", size: 10 },
  { x: 15, y: 35, group: "B", size: 15 },
  { x: 20, y: 15, group: "C", size: 20 },  // Third category!
  { x: 25, y: 40, group: "A", size: 25 },
  { x: 30, y: 25, group: "B", size: 30 },
  { x: 35, y: 30, group: "C", size: 35 },  // Third category!
  { x: 40, y: 20, group: "A", size: 40 },
  { x: 45, y: 45, group: "B", size: 45 },
  { x: 50, y: 10, group: "C", size: 50 }   // Third category!
];

// Simple categorical dataset with color names as categories
const categoricalData = [
  { x: 10, y: 20, group: "red", size: 10 },
  { x: 15, y: 35, group: "blue", size: 15 },
  { x: 20, y: 15, group: "green", size: 20 },
  { x: 25, y: 40, group: "orange", size: 25 },
  { x: 30, y: 25, group: "purple", size: 30 },
  { x: 35, y: 30, group: "cyan", size: 35 },
  { x: 40, y: 20, group: "magenta", size: 40 }
];