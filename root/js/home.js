/***********************
    ALGORITHM VISUALIZER
    SENIOR PROJECT 2026
    HOME PAGE DEMO SCRIPT
************************/

document.addEventListener("DOMContentLoaded", function () {

  // PREVIEW SVG SIZE / LOOP SETTINGS
  const width = 760;
  const height = 260;
  const barCount = 20;
  const speed = 180;

  // PREVIEW DATA + BUBBLE SORT STATE
  let data = generateData();
  let i = 0;
  let j = 0;
  let comparingIndex = null;
  let swappingIndex = null;

  // CREATE THE SVG INSIDE THE HOME PAGE PREVIEW CARD
  const svg = d3.select("#sort-preview")
      .append("svg")
      .attr("width", "100%")
      .style("max-width", "600px")
      .style("display", "block")
      .style("margin", "0 auto")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

  const y = d3.scaleLinear()
      .domain([0, 1])
      .range([0, height - 28]);

  // MAKE A NEW RANDOM LIST FOR THE HOME PAGE DEMO
  function generateData() {
      return Array.from({ length: barCount }, () => Math.random() * 0.9 + 0.1);
  }

  // DRAW / REDRAW THE PREVIEW BARS
  function drawBars() {
      svg.selectAll("rect")
          .data(data)
          .join("rect")
          .attr("x", (_, index) => index * (width / barCount))
          .attr("width", width / barCount - 4)
          .attr("rx", 4)
          .attr("y", d => height - y(d))
          .attr("height", d => y(d))
          .attr("fill", (_, index) => {
              if (swappingIndex !== null && (index === swappingIndex || index === swappingIndex + 1)) {
                  return "#e67e22";
              }
              if (comparingIndex !== null && (index === comparingIndex || index === comparingIndex + 1)) {
                  return "#f4d35e";
              }
              if (i > 0 && index >= barCount - i) {
                  return "#8e294f";
              }
              return "#d4b476";
          });
  }

  // RUN ONE BUBBLE SORT STEP, THEN LOOP AGAIN
  function bubbleStep() {
      if (i < barCount - 1) {
          if (j < barCount - i - 1) {
              comparingIndex = j;
              swappingIndex = null;

              if (data[j] > data[j + 1]) {
                  swappingIndex = j;
                  [data[j], data[j + 1]] = [data[j + 1], data[j]];
              }

              j++;
          } else {
              j = 0;
              i++;
              comparingIndex = null;
              swappingIndex = null;
          }
      } else {
          comparingIndex = null;
          swappingIndex = null;
          drawBars();

          setTimeout(() => {
              data = generateData();
              i = 0;
              j = 0;
              drawBars();
              setTimeout(bubbleStep, speed);
          }, 700);
          return;
      }

      drawBars();
      setTimeout(bubbleStep, speed);
  }

  // START THE HOME PAGE PREVIEW
  drawBars();
  bubbleStep();

});
