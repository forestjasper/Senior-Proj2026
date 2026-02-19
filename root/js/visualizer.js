document.addEventListener("DOMContentLoaded", function () {

    const container = document.getElementById("visualizer-canvas");
    if (!container) return;

    const startBtn = document.getElementById("start-btn");
    const pauseBtn = document.getElementById("pause-btn");
    const resetBtn = document.getElementById("reset-btn");

    const width = container.clientWidth;
    const height = container.clientHeight;

    const barCount = 20;
    const speed = 150;

    let data;
    let i;
    let j;
    let isPlaying = false;
    let timeoutId = null;

    const svg = d3.select("#visualizer-canvas")
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
            .attr("x", (_, index) => index * (width / barCount))
            .attr("width", width / barCount - 2)
            .transition()
            .duration(speed)
            .attr("y", d => height - y(d))
            .attr("height", d => y(d))
            .attr("fill", "#d4b476");
    }

    function bubbleStep() {

        if (!isPlaying) return;

        if (i < barCount) {

            if (j < barCount - i - 1) {

                if (data[j] > data[j + 1]) {
                    [data[j], data[j + 1]] = [data[j + 1], data[j]];
                }

                j++;
                drawBars();

            } else {
                j = 0;
                i++;
            }

        } else {
            data = generateData();
            i = 0;
            j = 0;
        }

        timeoutId = setTimeout(bubbleStep, speed);
    }

    function reset() {
        clearTimeout(timeoutId);
        isPlaying = false;
        data = generateData();
        i = 0;
        j = 0;
        drawBars();
    }

    startBtn.addEventListener("click", function () {
        if (!isPlaying) {
            isPlaying = true;
            bubbleStep();
        }
    });

    pauseBtn.addEventListener("click", function () {
        isPlaying = false;
        clearTimeout(timeoutId);
    });

    resetBtn.addEventListener("click", reset);

    reset();
});
