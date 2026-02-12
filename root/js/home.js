document.addEventListener("DOMContentLoaded", function () {

  const width = 560;
  const height = 200;
  const barCount = 20;
  const speed = 150; // lower = faster

  let data = generateData();

  const svg = d3.select("#sort-preview")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

  const y = d3.scaleLinear()
      .domain([0, 1])
      .range([0, height - 20]);

  function generateData() {
      return Array.from({ length: barCount }, () => Math.random());
  }

  function drawBars() {
      svg.selectAll("rect")
          .data(data)
          .join("rect")
          .attr("x", (_, i) => i * (width / barCount))
          .attr("width", width / barCount - 2)
          .transition()
          .duration(speed)
          .attr("y", d => height - y(d))
          .attr("height", d => y(d))
          .attr("fill", "#d4b476");
  }

  let i = 0;
  let j = 0;

  function bubbleStep() {

      if (i < barCount) {

          if (j < barCount - i - 1) {

              if (data[j] > data[j + 1]) {
                  // swap
                  [data[j], data[j + 1]] = [data[j + 1], data[j]];
              }

              j++;
              drawBars();

          } else {
              j = 0;
              i++;
          }

      } else {
          // SORT COMPLETE
          // Reset and loop forever
          data = generateData();
          i = 0;
          j = 0;
      }

      setTimeout(bubbleStep, speed);
  }

  drawBars();
  bubbleStep();

});
