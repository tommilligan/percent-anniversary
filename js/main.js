var colorPrimary = "#FF0057";
var colorPrimary50 = "#FF80AB";
var colorPrimary20 = "#FFCCDD";
var colorPrimary10 = "#FFE6EE";
var colorPrimary5 = "#FFF2F7";

var formatDateString = "YYYY-MM-DD";

/**
 * Convert milliseconds to years
 * @param {number} ms
 */
function msToYears(ms) {
  return ms / 31536000000;
}

/**
 * Convert years to milliseconds
 * @param {number} years
 */
function yearsToMs(years) {
  return years * 31536000000;
}

/**
 * Check if initialising a new object was successful
 * @param {Moment | null} m
 */
function isValidMoment(m) {
  return !(m === null || !m.isValid());
}

/**
 * Remove all children from a DOM node, such as
 * given by document.getElementId
 * @param {DOMNode} el
 */
function removeElementChildren(el) {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

/**
 * Convert an array of string to a table row element
 * @param {string[]} rowData
 * @param {boolean} header
 */
function createTableRow(rowData, header) {
  var row = document.createElement("tr");
  rowData.forEach(function(cellData) {
    var cell = document.createElement(header ? "th" : "td");
    cell.appendChild(document.createTextNode(cellData));
    row.appendChild(cell);
  });
  return row;
}

/**
 * Convert a 2D array to a table element. Optionally
 * add a header row as well
 * @param {Array<Array<string>>} tableData
 * @param {Array<string>} tableHeaderData
 */
function createTable(tableData, tableHeaderData) {
  var table = document.createElement("table");
  table.className = "u-full-width";

  if (tableHeaderData) {
    var tableHeader = document.createElement("thead");
    var head = createTableRow(tableHeaderData, true);
    tableHeader.appendChild(head);
    table.appendChild(tableHeader);
  }

  var tableBody = document.createElement("tbody");
  tableData.forEach(function(rowData) {
    var row = createTableRow(rowData);
    tableBody.appendChild(row);
  });
  table.appendChild(tableBody);
  return table;
}

/**
 * Redraw data to page (mutative)
 * @param {Moment} birthdayDate
 * @param {Moment} relationshipDate
 * @param {boolean} useDates
 */
function redraw(birthdayDate, relationshipDate, useDates) {
  function ageToDate(years) {
    // Have to convert to ms first, as moment only adds integers
    var ms = yearsToMs(years);
    var date = moment(birthdayDate)
      .add(ms, "ms")
      .format(formatDateString);
    return date;
  }

  function agePass(d) {
    return d;
  }

  var timeFormatter = useDates ? ageToDate : agePass;
  var timeUnit = useDates ? "" : "yrs";

  // Time data values are in years
  var timeBirth = 0;
  var relationshipMs = relationshipDate.diff(birthdayDate);
  var timeRelationship = msToYears(relationshipMs);

  function percentFromTime(t) {
    return (t - timeRelationship) / (t - timeBirth) * 100;
  }
  function timeFromPercent(p) {
    var r = p / 100;
    return (r * timeBirth - timeRelationship) / (r - 1);
  }

  // Select and clean DOM mountpoints
  var mount = document.getElementById("mount");
  removeElementChildren(mount);
  var mountTable = document.getElementById("mountTable");
  removeElementChildren(mountTable);

  // SVG drawing
  var svg = d3.select(mount);
  var margin = { top: 15, right: 15, bottom: 30, left: 35 };
  var width = mount.clientWidth - (margin.left + margin.right);
  var height = mount.clientHeight - (margin.top + margin.bottom);
  g = svg
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Data to pixel scales
  var xScale = d3
    .scaleLinear()
    .domain([0, 100])
    .range([0, width]);
  var yScale = d3
    .scaleLinear()
    .domain([0, 100])
    .rangeRound([height, 0]);

  // Line data
  var line = d3
    .line()
    .curve(d3.curveBasis)
    .x(function(d) {
      return xScale(d.date);
    })
    .y(function(d) {
      return yScale(d.close);
    });

  var data = [];

  // Generate a set of points we can smooth to form a curve
  for (i = timeRelationship; i < 101; i = i + 0.1) {
    var p = percentFromTime(i);
    data.push({
      date: i,
      close: p > 0 ? p : 0
    });
  }

  var timeUnitAxis = timeUnit ? " (" + timeUnit + ")" : "";

  // x axis
  g
    .append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(xScale).tickFormat(timeFormatter))
    .append("text")
    .attr("fill", "#000")
    .attr("x", width)
    .attr("dy", "-0.71em")
    .attr("text-anchor", "end")
    .text("Time" + timeUnitAxis);

  // y axis
  g
    .append("g")
    .call(d3.axisLeft(yScale))
    .append("text")
    .attr("fill", "#000")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", "0.71em")
    .attr("text-anchor", "end")
    .text("Percent");

  // Graph line
  g
    .append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", colorPrimary)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("stroke-width", 1.5)
    .attr("d", line);

  // Annotations on the line
  var annotations = g.append("g").style("opacity", 0.4);

  /**
   * Focus element consits of a:
   * - pointer
   * - text description
   */
  var focus = g.append("g").style("display", "none");
  focus
    .append("circle")
    .attr("r", 4.5)
    .style("fill", "none")
    .style("stroke", colorPrimary);
  focus
    .append("text")
    .attr("x", 9)
    .attr("y", 14)
    .style("font-size", "10px");

  // Element to listen for mouse events
  g
    .append("rect")
    .style("fill", "none")
    .style("pointer-events", "all")
    .attr("width", width)
    .attr("height", height)
    .on("mouseover", function() {
      focus.style("display", null);
    })
    .on("mouseout", function() {
      focus.style("display", "none");
    })
    .on("mousemove", mousemove);

  /**
   * Generate text for the focus from coordinates
   * @param {number} x0
   * @param {number} y0
   */
  function focusText(x0, y0) {
    return (
      "(" +
      timeFormatter(x0.toFixed(1)) +
      timeUnit +
      ", " +
      y0.toFixed(1) +
      "%)"
    );
  }

  var keyPercents = [5, 10, 20, 32.5, 50, 75];
  keyPercents.forEach(function(percent) {
    var time = timeFromPercent(percent);
    var x0 = xScale(time);
    var y0 = yScale(percent);
    annotations
      .append("circle")
      .attr("fill", colorPrimary)
      .attr("cx", x0)
      .attr("cy", y0)
      .attr("r", 3);
    annotations
      .append("text")
      .attr("x", x0 + 9)
      .attr("y", y0 + 14)
      .style("font-size", "10px")
      .text(focusText(time, percent));
  });

  /**
   * On mouse, move focus element over the graph
   */
  function mousemove() {
    var mouse = d3.mouse(this);
    var x0 = xScale.invert(mouse[0]);
    x0 = x0 > timeRelationship ? x0 : timeRelationship;
    var y0 = percentFromTime(x0);
    focus.attr("transform", "translate(" + xScale(x0) + "," + yScale(y0) + ")");
    focus.select("text").text(focusText(x0, y0));
  }

  // Redraw table
  var tableData = [1, 2, 5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 99].map(
    function(percent) {
      var time = timeFromPercent(percent);
      return [percent, time.toFixed(1), ageToDate(time)];
    }
  );

  var table = createTable(tableData, ["%", "Age (years)", "Date"]);
  mountTable.appendChild(table);
}

/**
 * Load user inputs from the DOM, and decide whether to redraw
 */
function update() {
  var now = Date.now();
  var birthday = document.getElementById("birthday").value;
  var relationship = document.getElementById("relationship").value;
  var unitsFormat = document.getElementById("unitsFormat").value;
  var useDates = unitsFormat === "date";

  var birthdayDate = moment(birthday, formatDateString);
  var relationshipDate = moment(relationship, formatDateString);
  if (isValidMoment(birthdayDate) && isValidMoment(relationshipDate)) {
    redraw(birthdayDate, relationshipDate, useDates);
  }
}

// Load default values
update();

// Add listeners to respond to events
document.getElementById("birthday").addEventListener("change", update);
document.getElementById("relationship").addEventListener("change", update);
document.getElementById("unitsFormat").addEventListener("change", update);
window.addEventListener("resize", update);
