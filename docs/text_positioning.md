# Text Positioning in Tavla

Tavla provides flexible options for positioning text labels relative to their data points.

## Offset Types

### Data Units
Use numeric values to offset based on the data scale:
```javascript
{
  layers: {
    labels: {
      geometry: "text",
      attributes: {
        xOffset: 50,     // Move 50 units along x-axis
        yOffset: -10     // Move -10 units along y-axis
      }
    }
  }
}
```

### Pixel Units
Use "px" suffix for pixel-based offsets:
```javascript
{
  layers: {
    labels: {
      geometry: "text",
      attributes: {
        xOffset: "20px",  // Move 20 pixels right
        yOffset: "-5px"   // Move 5 pixels up
      }
    }
  }
}
```

### Millimeter Units
Use "mm" suffix for physical measurements:
```javascript
{
  layers: {
    labels: {
      geometry: "text",
      attributes: {
        xOffset: "5mm",   // Move 5mm right
        yOffset: "2mm"    // Move 2mm down
      }
    }
  }
}
```

## Examples

### Offset in Data Units
```javascript
{
  layers: {
    points: {
      geometry: "point",
      bindings: { x: "year", y: "value" }
    },
    labels: {
      geometry: "text",
      bindings: { 
        x: "year", 
        y: "value", 
        text: "value" 
      },
      attributes: {
        xOffset: 1,    // Shift one year right
        yOffset: 0.5   // Shift up 0.5 units
      }
    }
  }
}
```

### Mixed Units
```javascript
{
  layers: {
    labels: {
      geometry: "text",
      bindings: { 
        x: "category", 
        y: "value", 
        text: "label" 
      },
      attributes: {
        xOffset: "2mm",   // Physical offset horizontally
        yOffset: 50       // Data units vertically
      }
    }
  }
}
```
