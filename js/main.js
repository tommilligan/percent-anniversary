var now = Date.now();
var birthday = "1990-01-01";
var relationship = "2009-01-06";

var birthdayDate = new Date(birthday);
var relationshipDate = new Date(relationship);

function msToYear(ms) {
  return ms / 31536000000;
}

var timeBirth = 0;
var relationshipMs = relationshipDate.getTime() - birthdayDate.getTime();
var timeRelationship = msToYear(relationshipMs);

var mount = document.getElementById("mount");

var svg = d3.select("svg"),
    margin = {top: 20, right: 20, bottom: 30, left: 50},
    width = mount.clientWidth - margin.left - margin.right,
    height = mount.clientHeight - margin.top - margin.bottom,
    g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var x = d3.scaleLinear()
    .domain([0, 100])
    .range([0, width]);

var y = d3.scaleLinear()
    .domain([0, 100])
    .rangeRound([height, 0]);

var line = d3.line()
    .curve(d3.curveCardinal)
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.close); });


var data = [];

function percentFromTime(t) {
  return ((t - timeRelationship) / (t - timeBirth) * 100);
}
function timeFromPercent(p) {
  var r = p / 100
  return ((r * timeBirth) - timeRelationship) / (r - 1)
}

for (i = timeRelationship; i < 101; i++) {
    var p = percentFromTime(i)
    data.push({
      date: i,
      close: (p > 0) ? p : 0
    })
}

  g.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x))
    .append("text")
      .attr("fill", "#000")
      .attr("x", width)
      .attr("dy", "-0.71em")
      .attr("text-anchor", "end")
      .text("Time (years)")

  g.append("g")
      .call(d3.axisLeft(y))
    .append("text")
      .attr("fill", "#000")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", "0.71em")
      .attr("text-anchor", "end")
      .text("Percent");

  g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("stroke-width", 1.5)
      .attr("d", line);

  var focus = g.append("g")
      .style("display", "none");

  focus.append("circle")
      .attr("r", 4.5)
      .style("fill", "none")
      .style("stroke", "steelblue");

  focus.append("text")
      .attr("x", 9)
      .attr("y", 14)
      .style("font-size", "10px");

  g.append("rect")
      .style("fill", "none")
      .style("pointer-events", "all")
      .attr("width", width)
      .attr("height", height)
      .on("mouseover", function() { focus.style("display", null); })
      .on("mouseout", function() { focus.style("display", "none"); })
      .on("mousemove", mousemove);

  function focusText(x0, y0) {
    return '(' + x0.toFixed(1) + 'yrs, ' + y0.toFixed(1) + '%)';
  }

  var keyPercents = [5, 10, 20, 32.5, 50, 75];
  keyPercents.forEach(function(percent) {
    var time = timeFromPercent(percent);
    var x0 = x(time)
    var y0 = y(percent)
    var note = g.append("g")
      .style("opacity", 0.4);
    note.append("circle")
      .attr("cx", x0)
      .attr("cy", y0)
      .attr("r", 3);
    note.append("text")
      .attr("x", x0 + 9)
      .attr("y", y0 + 14)
      .style("font-size", "10px")
      .text(focusText(time, percent));
  })
  

  var bisectDate = d3.bisector(function(d) { return d.date; }).left;

  function mousemove() {
    var mouse = d3.mouse(this)
    var x0 = x.invert(mouse[0]);
    x0 = (x0 > timeRelationship) ? x0 : timeRelationship;
    var y0 = percentFromTime(x0);
    focus.attr("transform", "translate(" + x(x0) + "," + y(y0) + ")");
    focus.select("text").text(focusText(x0, y0));
  }