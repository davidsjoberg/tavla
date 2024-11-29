export function extractBindingRules(_instructions) {
    const { geoms } = _instructions;

    if (!geoms) {
        throw new Error('filteredGeomDatabase not found in instructions');
    }

    const binding_rules = Object.fromEntries(
        Object.entries(geoms).map(([geometry, data]) => [
            geometry,
            data.binding_rules
        ])
    );

    return binding_rules;
}

export function extractRenderFunctions(_instructions) {
    const { geoms } = _instructions;

    if (!geoms) {
        throw new Error('geoms not found in instructions');
    }

    const render_functions = Object.fromEntries(
        Object.entries(geoms).map(([geometry, data]) => [
            geometry,
            data.render_function
        ])
    );

    return render_functions;
}

export function getPointsAlongPaths(_svg, layerId, numPoints = 10) {
    // Select all elements within the layer
    const elements = _svg.selectAll(`#${layerId} *`);

    // Initialize an array to store points
    const pointsAlongPaths = [];

    elements.each(function () {
        // Check if the element is a path
        if (this.tagName === 'path') {
            const path = this;

            // Extract stroke width
            const strokeWidth = parseFloat(path.getAttribute('stroke-width')) || 0;

            // Get the transformation from the 'transform' attribute, if present
            const transformAttr = path.getAttribute('transform');
            let offsetX = 0, offsetY = 0;

            if (transformAttr && transformAttr.startsWith('translate')) {
                // Parse the translate(x, y) values
                const match = /translate\(([^,]+),\s*([^)]+)\)/.exec(transformAttr);
                if (match) {
                    offsetX = parseFloat(match[1]);
                    offsetY = parseFloat(match[2]);
                }
            }

            // Get the total length of the path
            const pathLength = path.getTotalLength();

            // Calculate the interval for points
            const interval = pathLength / (numPoints - 1);

            // Get the parent group and its attributes
            const parentGroup = path.closest('g');
            const groupAttributes = {};
            if (parentGroup) {
                Array.from(parentGroup.attributes).forEach(attr => {
                    groupAttributes[attr.name] = attr.value;
                });
            }

            // Generate points along the "top and bottom boundaries" of the stroke width
            const points = [];
            for (let i = 0; i < numPoints; i++) {
                const point = path.getPointAtLength(i * interval);

                // Compute perpendicular offset for the stroke-width boundaries
                const tangentAngle = path.getTotalLength() === 0 ? 0 : Math.atan2(
                    path.getPointAtLength((i + 1) * interval % pathLength).y - point.y,
                    path.getPointAtLength((i + 1) * interval % pathLength).x - point.x
                );
                const dx = (strokeWidth / 2) * Math.cos(tangentAngle + Math.PI / 2); // Perpendicular X offset
                const dy = (strokeWidth / 2) * Math.sin(tangentAngle + Math.PI / 2); // Perpendicular Y offset

                points.push(
                    { x: point.x + dx + offsetX, y: point.y + dy + offsetY }, // Top boundary
                    { x: point.x - dx + offsetX, y: point.y - dy + offsetY }  // Bottom boundary
                );
            }

            // Add the points for this path to the result
            pointsAlongPaths.push({
                element: path,
                points,
                groupAttributes: groupAttributes, // Add group attributes to the path level
                layerId: layerId, // Add the layer ID to the path level
            });
        }
    });

    return pointsAlongPaths;
}

export function addTransformedPointsToSVG(_svg, layerId, numPoints = 10) {
    // Get the transformed points relative to the root SVG coordinate system
    const allPoints = getPointsAlongPaths(_svg, layerId, numPoints)
        .flatMap(d => d.points); // Flatten the array to get all points

    console.log('All Points for Voronoi:', allPoints); // Debug

    // Add red dots for each point
    _svg.append('g')
        .attr('class', 'transformed-points')
        .selectAll('circle')
        .data(allPoints)
        .join('circle')
        .attr('cx', d => d.x) // Transformed x coordinate
        .attr('cy', d => d.y) // Transformed y coordinate
        .attr('r', 3) // Radius of the red dots
        .attr('fill', 'red'); // Red color for the dots

    // Compute Voronoi diagram
    const svgWidth = +_svg.attr('width') || _svg.node().getBoundingClientRect().width;
    const svgHeight = +_svg.attr('height') || _svg.node().getBoundingClientRect().height;

    console.log('SVG Width and Height:', svgWidth, svgHeight); // Debug

    const delaunay = d3.Delaunay.from(allPoints, d => d.x, d => d.y); // Create Delaunay triangulation
    const voronoi = delaunay.voronoi([0, 0, svgWidth, svgHeight]); // Create Voronoi diagram

    // Extract Voronoi edges
    const voronoiEdges = [];
    for (let i = 0; i < allPoints.length; i++) {
        const cell = voronoi.cellPolygon(i); // Get the polygon for each cell
        if (cell) {
            for (let j = 0; j < cell.length - 1; j++) {
                voronoiEdges.push({
                    x1: cell[j][0],
                    y1: cell[j][1],
                    x2: cell[j + 1][0],
                    y2: cell[j + 1][1],
                });
            }
        }
    }

    console.log('Voronoi Edges:', voronoiEdges); // Debug

    // Add Voronoi edges as thin black lines
    _svg.append('g')
        .attr('class', 'voronoi-lines')
        .selectAll('line')
        .data(voronoiEdges)
        .join('line')
        .attr('x1', d => d.x1)
        .attr('y1', d => d.y1)
        .attr('x2', d => d.x2)
        .attr('y2', d => d.y2)
        .attr('stroke', 'black') // Thin black lines
        .attr('stroke-width', 0.5);
}