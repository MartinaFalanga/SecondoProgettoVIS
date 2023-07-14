export function d3Button() {

  var padding = 10,
      radius = 3,
      stdDeviation = 5,
      offsetX = 2,
      offsetY = 4;

  function my(selection) {

      selection.each(function(d, i) {
      var g = d3.select(this)
          .attr("id", "d3-button" + i)
          .attr("transform", "translate(" + d.x + "," + d.y + ")");

      var text = g.append("text").text(d.label);
      var bbox = text.node().getBBox();
      var rect = g.insert("rect", "text")
          .attr("x", bbox.x - padding)
          .attr("y", bbox.y - padding)
          .attr("width", bbox.width + 2 * padding)
          .attr("height", bbox.height + 2 * padding)
          .attr("rx", radius)
          .attr("ry", radius)
          .on("mouseover", mouseover)
          .on("mouseout", mouseout)
          .on("click", click)

    });

  }

  function mouseover() { d3.select(this.parentNode).select("rect").classed("active", true) }
  function mouseout() { d3.select(this.parentNode).select("rect").classed("active", false) }
  function click(d, i) { d.function(); }

  return my;

}
