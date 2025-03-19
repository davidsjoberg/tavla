# Example Gallery

## Line Chart with Custom Styles
```javascript
{
  data: [
    { year: 2020, value: 10, category: "A" },
    { year: 2021, value: 15, category: "A" },
    { year: 2022, value: 12, category: "A" },
    { year: 2020, value: 8,  category: "B" },
    { year: 2021, value: 11, category: "B" },
    { year: 2022, value: 14, category: "B" }
  ],
  bindings: {
    x: "year",
    y: "value",
    color: "category"
  },
  layers: {
    // First layer: Lines
    lines: {
      geometry: "line",
      attributes: {
        size: "2px",
        alpha: 0.8
      }
    },
    // Second layer: Points
    points: {
      geometry: "point",
      attributes: {
        size: 100,
        strokeWidth: "1px"
      }
    },
    // Third layer: Labels
    labels: {
      geometry: "text",
      bindings: {
        x: "year",
        y: "value",
        text: "value",
        color: "category"
      },
      attributes: {
        yOffset: "15px",    // Move labels 15 pixels above points
        size: "8pt"
      }
    }
  }
}
```

// ... rest of existing examples ...
