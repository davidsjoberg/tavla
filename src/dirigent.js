export {dirigent};
import * as scales from './helpers/scales.js';
import * as axis from './helpers/axis.js';
import * as geoms from './helpers/geoms.js';
import * as panel from './helpers/panel.js';
import * as preps from './helpers/preps.js';

function dirigent(_div, _instructions, _plot_width, _plotId) {
  _instructions.dimensions = panel.panel_dimensions(_plot_width);

  // Make plot svg (including margins)
  let svg = d3.select(_div)
    .append("svg")
    .attr("id", _plotId) // Unique ID for each plot
    .attr("width", _instructions.dimensions.width)
    .attr("height", _instructions.dimensions.height);

  // Prepare scales
  let extended_instructions = scales.make_scales_to_bindings(_instructions);

  // Prepare extended instruction for each layer
  extended_instructions = preps.prepare_extended_instructions(extended_instructions);
  console.log("extended_instructions:", extended_instructions);

  // Make plot panel (excl. margins)
  svg = panel.plot_panel(svg, extended_instructions);

  // Add axis
  svg = axis.plot_axis(svg,extended_instructions);

  // Plot layers
  svg = geoms.loop_over_layers(svg, extended_instructions);

  return svg.node();
}
