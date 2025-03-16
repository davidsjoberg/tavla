export { scale_expand, make_scales_to_bindings };

function make_scales_to_bindings(_instructions) {
  const { bindings, data, dimensions } = _instructions;
  const scalesAndTypes = {}; // Object to store scales and scale types for each binding

  // Get data type for each column and create scales
  for (const key in bindings) {
    const value = bindings[key];
    const dtype = typeof data[0][value];
    const scaleObject = {};

    // Assign scale type and create scales based on data type and binding
    switch (key) {
      case "x":
      case "y":
        switch (dtype) {
          case "number":
            scaleObject.scale = d3.scaleLinear()
              .domain(d3.extent(data, d => d[value]))
              .range(key === "x" ? [0, dimensions.ctrWidth] : [dimensions.ctrHeight, 0])
              .nice();
            scaleObject.type = "number";
            break;
          case "string":
            scaleObject.scale = d3.scaleBand()
              .domain(data.map(d => d[value]))
              .range(key === "x" ? [0, dimensions.ctrWidth] : [dimensions.ctrHeight, 0])
              .padding(0.1);
            scaleObject.type = "discrete";
            break;
          default:
            throw new Error(`Sorry, ${dtype} is not a supported data type for binding ${key}`);
        }
        break;

      case "color":
      case "fill":
        switch (dtype) {
          case "number":
            scaleObject.scale = d3.scaleSequential()
              .domain(d3.extent(data, d => d[value]))
              .interpolator(d3.interpolateViridis);
            scaleObject.type = "number";
            break;
          case "string":
            scaleObject.scale = d3.scaleOrdinal()
              .domain(data.map(d => d[value]).filter((v, i, arr) => arr.indexOf(v) === i).sort())
              .range(key === "fill" ? d3.schemeTableau10 : d3.schemeSet2);
            scaleObject.type = "discrete";
            break;
          default:
            throw new Error(`Sorry, ${dtype} is not a supported data type for binding ${key}`);
        }
        break;

      case "stroke":
        switch (dtype) {
          case "number":
            scaleObject.scale = d3.scaleLinear()
              .domain(d3.extent(data, d => d[value]))
              .range(['#444444', '#000000']);
            scaleObject.type = "number";
            break;
          case "string":
            scaleObject.scale = d3.scaleOrdinal()
              .domain(data.map(d => d[value]).filter((v, i, arr) => arr.indexOf(v) === i).sort())
              .range(['#444444', '#666666', '#888888', '#aaaaaa', '#cccccc', '#eeeeee']);
            scaleObject.type = "discrete";
            break;
          default:
            throw new Error(`Sorry, ${dtype} is not a supported data type for binding ${key}`);
        }
        break;

      case "size":
        switch (dtype) {
          case "number":
            scaleObject.scale = d3.scaleLinear()
              .domain(d3.extent(data, d => d[value]))
              .range([5, 400]);
            scaleObject.type = "number";
            break;
          case "string":
            scaleObject.scale = d3.scaleOrdinal()
              .domain(data.map(d => d[value]).filter((v, i, arr) => arr.indexOf(v) === i).sort())
              .range([50, 100, 200, 300, 400]);
            scaleObject.type = "discrete";
            break;
          default:
            throw new Error(`Sorry, ${dtype} is not a supported data type for binding ${key}.`);
        }
        break;
        
      case "alpha":
        switch (dtype) {
          case "number":
            scaleObject.scale = d3.scaleLinear()
              .domain(d3.extent(data, d => d[value]))
              .range([0.2, 0.9]);
            scaleObject.type = "number";
            break;
          case "string":
            scaleObject.scale = d3.scaleOrdinal()
              .domain(data.map(d => d[value]).filter((v, i, arr) => arr.indexOf(v) === i).sort())
              .range([0.3, 0.5, 0.7, 0.9]);
            scaleObject.type = "discrete";
            break;
          default:
            throw new Error(`Sorry, ${dtype} is not a supported data type for binding ${key}.`);
        }
        break;

      case "text":
        switch (dtype) {
          case "string":
          case "number":
            scaleObject.scale = d => d[value].toString();
            scaleObject.type = "discrete";
            break;
          default:
            throw new Error(`Sorry, ${dtype} is not a supported data type for binding ${key}.`);
        }
        break;
    }

    scalesAndTypes[key] = scaleObject;
  }

  // Add scales and scaleTypes to _instructions
  _instructions.scalesAndTypes = scalesAndTypes;

  return _instructions;
}

function scale_expand(range_array, mult) {
  const domain = range_array[1] - range_array[0];
  return [range_array[0] - domain * mult, range_array[1] + domain * mult];
}