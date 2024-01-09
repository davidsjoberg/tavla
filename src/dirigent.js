export {dirigent};
import * as scales from './helpers/scales.js';
import * as axis from './helpers/axis.js';
import * as geoms from './helpers/geoms.js';
import * as panel from './helpers/panel.js';



function dirigent(_div, _instructions, _plot_width) {

  const dimensions = panel.panel_dimensions(_plot_width)

  // Make plot svg (including margins)
  let svg = d3.select(_div).append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height)
     
  let scales_bindings = scales.make_scales_to_bindings(_instructions["bindings"], _instructions["data"], dimensions);

  // Make plot panel (excl. margins)
  svg = panel.plot_panel(svg, scales_bindings['x'], scales_bindings['y'], dimensions);
  
  // add axis
  svg = axis.plot_axis(svg, scales_bindings['x'], scales_bindings['y'], dimensions,  _instructions["bindings"]["x"],  _instructions["bindings"]["y"]);
  
  // plot layers
  for (let layer in _instructions.layers) {
    let layertype = _instructions.layers[layer]["geom"]; 

    if (layertype == "point") {
      svg = geoms.add_points(svg, _instructions, scales_bindings['x'],  scales_bindings['y'], scales_bindings['color'], _instructions.layers[layer]["attributes"])
    }
    if (layertype == "text") {
      svg = geoms.add_text(svg, _instructions, scales_bindings['x'],  scales_bindings['y'], scales_bindings['color'], _instructions.layers[layer]['attributes'])
    }
  };

return(svg.node())

    }