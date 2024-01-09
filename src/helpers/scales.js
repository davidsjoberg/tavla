export {scale_expand};
export {make_scales_to_bindings};

function make_scales_to_bindings(_bindings, _data, _dimensions) {
  let scales = {};

  for (let key in _bindings) {
    let value = _bindings[key];

    if (key === "x" || key === "y") {
      scales[key] = d3.scaleLinear()
        .domain(d3.extent(_data.map(d => d[value])))
        .range(key === "x" ? [0, _dimensions.ctrWidth] : [_dimensions.ctrHeight, 0])
        .nice();
    }

    if (key === "color") {
      scales[key] = d3.scaleOrdinal()
        .domain(_data.map(d => d[value]).filter((value, index, array) => array.indexOf(value) === index).sort())
        .range(d3.schemeSet3);
    }

    if (key === "text") {
      scales[key] = d => d;
    }
  }

  return scales;
}

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


function scale_expand(range_array, mult) {
    let domain = (range_array[1] - range_array[0])
    return [range_array[0]-domain*mult, range_array[1]+domain*mult]
  }


      // const shape = d3.scaleOrdinal(
    //     penguins.map(d => d.species),
    //     d3.symbolsType.map(s => d3.symbol().type(s)())
    //   )
    
    // const color = d3.scaleOrdinal(d3.schemeCategory10)