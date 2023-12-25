export {dirigent};
import * as scales from './helpers/scales.js';
import * as axis from './helpers/axis.js';
import * as geoms from './helpers/geoms.js';
import * as panel from './helpers/panel.js';



function dirigent(_div, _instructions, _plot_width) {

  // Bindings
  const xAccessor = d => d[_instructions["bindings"]["x"]];
  const yAccessor = d => d[_instructions["bindings"]["y"]];
  const textAccessor = d => d[_instructions["bindings"]["text"]];

  // Dimensions
  let dimensions = {
    width: _plot_width,
    height: _plot_width / 1.4,
    marginTop: _plot_width / 60,
    marginRight: _plot_width / 10,
    marginBottom: _plot_width / 10,
    marginLeft: _plot_width / 12
};
dimensions.ctrWidth = dimensions.width - dimensions.marginLeft - dimensions.marginRight
dimensions.ctrHeight = dimensions.height - dimensions.marginTop - dimensions.marginBottom

  // Make plot svg (including margins)
  let svg = d3.select(_div).append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height)

// x and y scale
  const xScale = d3.scaleLinear()
    .domain(scales.scale_expand(d3.extent(_instructions["data"], xAccessor), 0.05))
    .range([0, dimensions.ctrWidth])
    .nice()

  const yScale = d3.scaleLinear()
    .domain(scales.scale_expand(d3.extent(_instructions["data"], yAccessor), 0.05))
    .range([dimensions.ctrHeight, 0])
    .nice()
     
    // console.log(_instructions["data"].map(d => d.category).filter((value, index, array) => array.indexOf(value) === index).sort());
  
  const colorScale = d3.scaleOrdinal()
  .domain(_instructions["data"].map(d => d.category).filter((value, index, array) => array.indexOf(value) === index).sort())
  .range(d3.schemeSet3);

  // Make plot panel (excl. margins)
  svg = panel.plot_panel(svg, xScale, yScale, dimensions);

  
  // add axis
  svg = axis.plot_axis(svg, xScale, yScale, dimensions,  _instructions["bindings"]["x"],  _instructions["bindings"]["y"]);
  
  // plot layers
  for (let layer in _instructions.layers) {
    let layertype = _instructions.layers[layer]["geom"]; 

    if (layertype == "point") {
      svg = geoms.add_points(svg, _instructions["data"], xScale,  yScale, colorScale, xAccessor, yAccessor, textAccessor, _instructions.layers[layer]["attributes"])
    }
    if (layertype == "text") {
      svg = geoms.add_text(svg, _instructions["data"], xScale,  yScale, colorScale, xAccessor, yAccessor, textAccessor, _instructions.layers[layer]["attributes"])
    }
  };

return(svg.node())

    }