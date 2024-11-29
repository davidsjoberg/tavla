export {dirigent};
import * as scales from './helpers/scales.js';
import * as axis from './helpers/axis.js';
import * as geoms from './helpers/geoms.js';
import * as render from './helpers/render.js';
import * as panel from './helpers/panel.js';
import * as preps from './helpers/preps.js';

function dirigent(_div, _instructions, _plot_width, _plotId) {
  _instructions.dimensions = panel.panel_dimensions(_plot_width);

   //////// CANVAS /////////////
  let svg = d3.select(_div)
    .append("svg")
    .attr("id", _plotId) // Unique ID for each plot
    .attr("width", _instructions.dimensions.width)
    .attr("height", _instructions.dimensions.height);

  //////// EXTENDED INSTRUCTIONS /////////////
  let extended_instructions = _instructions;

  // Add geoms needed
  extended_instructions= preps.get_geometries(extended_instructions, geoms.geomDatabase); 

  // Prepare data transformation
  extended_instructions = preps.transform_data(extended_instructions);

  // Prepare scales
  extended_instructions = scales.make_scales_to_bindings(extended_instructions);

  // Prepare extended instruction for each layer
  extended_instructions = preps.prepare_extended_instructions(extended_instructions);

  // Make plot panel (excl. margins)
  svg = panel.plot_panel(svg, extended_instructions);

  // Add axis
  svg = axis.plot_axis(svg,extended_instructions);

  // Plot layers
  svg = render.render_layer(svg, extended_instructions);
  console.log('Extended instructions', extended_instructions)
  

  return svg.node();
}
