var colorPrimary = "#FF0057";
var colorPrimary50 = "#FF80AB";
var colorPrimary10 = "#FFE6EE";

function msToYears(ms) {
  return ms / 31536000000;
}

function isValidMoment(m) {
  return !(m === null || !m.isValid());
}

function removeElementChildren(el) {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

function createTableRow(rowData) {
  var row = document.createElement("tr");
  rowData.forEach(function(cellData) {
    var cell = document.createElement("td");
    cell.appendChild(document.createTextNode(cellData));
    row.appendChild(cell);
  });
  return row;
}

function createTable(tableData, tableHeaderData) {
  var table = document.createElement("table");
  table.className = "u-full-width";

  if (tableHeaderData) {
    var tableHeader = document.createElement("thead");
    var head = createTableRow(tableHeaderData);
    table.appendChild(head);
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
 * Redraw data to page
 * @param {Moment} birthdayDate
 * @param {Moment} relationshipDate
 * @param {boolean} useDates
 */
function redraw(birthdayDate, relationshipDate, useDates) {
  function ageToDate(d) {
    var date = moment(birthdayDate)
      .add(d, "years")
      .format("YYYY-MM-DD");
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

  var x = d3
    .scaleLinear()
    .domain([0, 100])
    .range([0, width]);

  var y = d3
    .scaleLinear()
    .domain([0, 100])
    .rangeRound([height, 0]);

  var line = d3
    .line()
    .curve(d3.curveBasis)
    .x(function(d) {
      return x(d.date);
    })
    .y(function(d) {
      return y(d.close);
    });

  var data = [];

  for (i = timeRelationship; i < 101; i++) {
    var p = percentFromTime(i);
    data.push({
      date: i,
      close: p > 0 ? p : 0
    });
  }

  console.log(data);

  var timeUnitAxis = timeUnit ? " (" + timeUnit + ")" : "";
  g
    .append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).tickFormat(timeFormatter))
    .append("text")
    .attr("fill", "#000")
    .attr("x", width)
    .attr("dy", "-0.71em")
    .attr("text-anchor", "end")
    .text("Time" + timeUnitAxis);

  g
    .append("g")
    .call(d3.axisLeft(y))
    .append("text")
    .attr("fill", "#000")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", "0.71em")
    .attr("text-anchor", "end")
    .text("Percent");

  g
    .append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", colorPrimary)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("stroke-width", 1.5)
    .attr("d", line);

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
    var x0 = x(time);
    var y0 = y(percent);
    var note = g.append("g").style("opacity", 0.4);
    note
      .append("circle")
      .attr("fill", colorPrimary)
      .attr("cx", x0)
      .attr("cy", y0)
      .attr("r", 3);
    note
      .append("text")
      .attr("x", x0 + 9)
      .attr("y", y0 + 14)
      .style("font-size", "10px")
      .text(focusText(time, percent));
  });

  var bisectDate = d3.bisector(function(d) {
    return d.date;
  }).left;

  function mousemove() {
    var mouse = d3.mouse(this);
    var x0 = x.invert(mouse[0]);
    x0 = x0 > timeRelationship ? x0 : timeRelationship;
    var y0 = percentFromTime(x0);
    focus.attr("transform", "translate(" + x(x0) + "," + y(y0) + ")");
    focus.select("text").text(focusText(x0, y0));
  }

  // Redraw table
  var tableData = [1, 2, 5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 99].map(
    function(percent) {
      var time = timeFromPercent(percent);
      return [percent, time.toFixed(1), ageToDate(time)];
    }
  );

  var table = createTable(tableData, ["Percent", "Age", "Date"]);
  mountTable.appendChild(table);
}

function update() {
  var now = Date.now();
  var birthday = document.getElementById("birthday").value;
  var relationship = document.getElementById("relationship").value;
  var unitsFormat = document.getElementById("unitsFormat").value;
  var useDates = unitsFormat === "date";

  var birthdayDate = moment(birthday, "YYYY-MM-DD");
  var relationshipDate = moment(relationship, "YYYY-MM-DD");
  if (isValidMoment(birthdayDate) && isValidMoment(relationshipDate)) {
    redraw(birthdayDate, relationshipDate, useDates);
  }
}

update();
document.getElementById("birthday").addEventListener("change", update);
document.getElementById("relationship").addEventListener("change", update);
document.getElementById("unitsFormat").addEventListener("change", update);
window.addEventListener("resize", update);
