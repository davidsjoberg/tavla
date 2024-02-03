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
      case "stroke":
        switch (dtype) {
          case "number":
            scaleObject.scale = d3.scaleLinear()
              .domain(d3.extent(data, d => d[value]))
              .range(['royalblue', 'pink']);
            scaleObject.type = "number";
            break;
          case "string":
            scaleObject.scale = d3.scaleOrdinal()
              .domain(data.map(d => d[value]).filter((v, i, arr) => arr.indexOf(v) === i).sort())
              .range(d3.schemeSet3);
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
              .range([10, 400]);
            scaleObject.type = "number";
            break;
          default:
            throw new Error(`Sorry, ${dtype} is not a supported data type for binding ${key}.`);
        }
        break;

      case "text":
        switch (dtype) {
          case "string":
            scaleObject.scale = d => d;
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



      // const shape = d3.scaleOrdinal(
    //     penguins.map(d => d.species),
    //     d3.symbolsType.map(s => d3.symbol().type(s)())
    //   )
    
    // const color = d3.scaleOrdinal(d3.schemeCategory10)


      // const colorScale = d3.scaleOrdinal()
  //   .domain(_instructions["data"].map(d => d.category).filter((value, index, array) => array.indexOf(value) === index).sort())
  //   .range(d3.schemeSet3);

  // const sizeScale = d3.scaleOrdinal()
  //   .domain(_instructions["data"].map(d => d.category).filter((value, index, array) => array.indexOf(value) === index).sort())
  //   .range(d3.schemeSet3);

  // const strokeScale = d3.scaleOrdinal()
  //   .domain(_instructions["data"].map(d => d.category).filter((value, index, array) => array.indexOf(value) === index).sort())
  //   .range(d3.schemeSet3);

  // const strokeSizeScale = d3.scaleOrdinal()
  //   .domain(_instructions["data"].map(d => d.category).filter((value, index, array) => array.indexOf(value) === index).sort())
  //   .range(d3.schemeSet3);