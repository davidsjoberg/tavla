# Tavla Visualization Library

## Custom Scales

Tavla supports custom scale configurations for all aesthetic bindings with both continuous and discrete data. You can specify scale properties in your visualization configuration:

```javascript
const config = {
  // ...other configuration...
  scales: {
    color: {
      range: ["blue", "red"],  // Define a color range
      domain: [0, 100]         // Optional: specify the domain
    },
    size: {
      range: [5, 100]          // Define a size range
    },
    alpha: {
      range: [0.2, 1.0]        // Define an opacity range
    },
    strokeWidth: {
      range: [0.5, 4]          // Define a stroke width range
    }
  }
};
```

### Supported Scale Types

Tavla supports custom scales for any aesthetic binding:

- **color/fill**: Control the color of elements
- **size**: Control the size of points or line thickness
- **alpha**: Control the opacity/transparency 
- **stroke**: Control the outline color
- **strokeWidth**: Control the outline thickness
- **and more**: Any binding can have a custom scale

### Continuous Scales

For continuous (numeric) data, Tavla creates a smooth interpolation between values:

```javascript
// For continuous numeric data
scales: {
  color: {
    range: ["blue", "yellow", "red"],  // Multiple control points supported
    domain: [0, 50, 100]               // Corresponding domain values
  },
  size: {
    range: [10, 200]                   // Maps from smallest to largest values
  }
}
```

### Discrete Scales

For discrete (categorical) data, Tavla maps categories to values:

```javascript
// For categorical data
scales: {
  color: {
    range: ["#1b9e77", "#d95f02", "#7570b3"]  // One color per category
  },
  size: {
    range: [50, 100, 150]                     // One size per category
  }
}
```

For discrete data, you must provide either:
1. Exactly two values (min/max) to generate intermediate values
2. At least as many values as there are categories

### Custom Domains

You can specify custom domains to control the mapping:

```javascript
scales: {
  color: {
    range: ["blue", "white", "red"],
    domain: [-100, 0, 100]  // Center white color at zero
  }
}
```

### Default Scales

If no scale is specified, Tavla automatically selects appropriate defaults:
- **color**: A standard categorical color scheme or blue-to-red gradient
- **size**: Sensible min/max sizes based on the geometry type
- **alpha**: Values from semi-transparent to fully opaque
- **stroke**: Black outlines or a categorical color scheme
- **strokeWidth**: Thin to thick based on data values
