# Size Handling in Tavla

Tavla implements an intelligent size handling system that adjusts element sizes based on the plot dimensions, similar to how physical plotting systems work. This ensures visualizations look balanced regardless of the overall chart size.

## Size Units

Tavla supports several ways to specify sizes:

1. **Relative sizes** (default): Simple numbers like `size: 2` are interpreted as multipliers of the base size.
   
2. **Absolute units**: 
   - Pixels: `size: "15px"`
   - Millimeters: `size: "3mm"`
   - Points: `size: "12pt"` (typography points)

## Default Sizes

Default sizes are calculated based on the plot panel dimensions:

- **Points (scatter)**: Symbol size and stroke width scale with plot area
- **Lines**: Line thickness scales with plot area
- **Text**: Font size scales with plot area
- **Bars**: Stroke width scales with plot area

## Examples

### Relative Sizing (Adjusts with Plot Dimensions)

```javascript
// Point size 2x the default for the current plot size
{
  layers: {
    points: {
      geometry: "point",
      attributes: {
        size: 2
      }
    }
  }
}
```

### Absolute Sizing (Fixed Regardless of Plot Dimensions)

```javascript
// Fixed 5mm points
{
  layers: {
    points: {
      geometry: "point",
      attributes: {
        size: "5mm"
      }
    }
  }
}

// Fixed 15px stroke width
{
  layers: {
    lines: {
      geometry: "line",
      attributes: {
        size: "15px" 
      }
    }
  }
}

// Fixed 12pt text
{
  layers: {
    labels: {
      geometry: "text",
      attributes: {
        size: "12pt"
      }
    }
  }
}
```

### Data-Bound Sizes

When binding sizes to data, the size range automatically adjusts based on plot dimensions:

```javascript
{
  bindings: {
    size: "population"
  },
  layers: {
    points: {
      geometry: "point"
    }
  }
}
```

In this case, the smallest value maps to approximately 0.5x the default size, and the largest value maps to 3x the default size, with the actual default calculated from the plot dimensions.

## Technical Details

The size handling system works by:

1. Calculating a base scale factor from the square