export { scale_expand, make_scales_to_bindings };

function make_scales_to_bindings(_bindings, _data, _dimensions) {
  const scales = {};

  for (const key in _bindings) {
    const value = _bindings[key];

    switch (key) {
      case "x":
      case "y":
        scales[key] = d3.scaleLinear()
          .domain(d3.extent(_data, d => d[value]))
          .range(key === "x" ? [0, _dimensions.ctrWidth] : [_dimensions.ctrHeight, 0])
          .nice();
        break;

      case "color":
      case "stroke":
        scales[key] = d3.scaleOrdinal()
          .domain(_data.map(d => d[value]).filter((v, i, arr) => arr.indexOf(v) === i).sort())
          .range(d3.schemeSet3);
        break;

      case "size":
        scales[key] = d3.scaleLinear()
          .domain(d3.extent(_data, d => d[value]))
          .range([10, 400]);
        break;

      case "text":
        scales[key] = d => d;
        break;
    }
  }

  return scales;
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