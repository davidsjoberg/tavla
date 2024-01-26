export {dirigent};
import * as scales from './helpers/scales.js';
import * as axis from './helpers/axis.js';
import * as geoms from './helpers/geoms.js';
import * as panel from './helpers/panel.js';
import * as preps from './helpers/preps.js';



function dirigent(_div, _instructions, _plot_width, _plotId) {
  const dimensions = panel.panel_dimensions(_plot_width);

  // Make plot svg (including margins)
  let svg = d3.select(_div)
    .append("svg")
    .attr("id", _plotId) // Unique ID for each plot
    .attr("width", dimensions.width)
    .attr("height", dimensions.height);

  const scales_bindings = scales.make_scales_to_bindings(
    _instructions['bindings'],
    _instructions['data'],
    dimensions
  );
  let extended_instructions = preps.prepare_extended_instructions(
    _instructions,
    scales_bindings
  );
  console.log("extended_instructions:", extended_instructions);

  // Make plot panel (excl. margins)
  svg = panel.plot_panel(svg, scales_bindings['x'], scales_bindings['y'], dimensions);

  // Add axis
  svg = axis.plot_axis(
    svg,
    scales_bindings['x'],
    scales_bindings['y'],
    dimensions,
    extended_instructions["bindings"]["x"],
    extended_instructions["bindings"]["y"]
  );

  // Plot layers
  svg = geoms.loop_over_layers(svg, extended_instructions);

  return svg.node();
}
