document.addEventListener("DOMContentLoaded", function () {

    // ===============================
    // Speed Control
    // ===============================
    let speed = 150;
    const speedSlider = document.getElementById("speed-slider");

    speedSlider.addEventListener("input", function () {
        const level = parseInt(this.value);
        speed = 1000 / level;
    });

    // ===============================
    // DOM Elements
    // ===============================
    const arrayDisplay = document.getElementById("array-values");
    const container = document.getElementById("visualizer-canvas");
    const pseudocodeBox = document.getElementById("pseudocode-box");

    const startBtn = document.getElementById("start-btn");
    const pauseBtn = document.getElementById("pause-btn");
    const resetBtn = document.getElementById("reset-btn");
    const newDataBtn = document.getElementById("newdata-btn");
    const stepBtn = document.getElementById("step-btn");

    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const barCount = 20;

    // ===============================
    // State Variables
    // ===============================
    let data = [];
    let originalData = [];
    let i = 0;
    let j = 0;

    let isPlaying = false;
    let timeoutId = null;

    let comparingIndex = null;
    let swappingIndex = null;

    // ===============================
    // SVG Setup
    // ===============================
    const svg = d3.select("#visualizer-canvas")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const y = d3.scaleLinear()
        .domain([0, 100])
        .range([0, height - 20]);

    // ===============================
    // Generate Random Data
    // ===============================
    function generateData() {
        return Array.from({ length: barCount }, () =>
            Math.floor(Math.random() * 100) + 1
        );
    }

    // ===============================
    // Draw Bars + Array
    // ===============================
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
            .attr("fill", (_, index) => {

                // Sorted region
                if (i > 0 && index >= barCount - i) {
                    return "#8e294f"; // purple/red sorted
                }

                // Swapping
                if (
                    swappingIndex !== null &&
                    (index === swappingIndex || index === swappingIndex + 1)
                ) {
                    return "#e74c3c"; // red
                }

                // Comparing
                if (
                    comparingIndex !== null &&
                    (index === comparingIndex || index === comparingIndex + 1)
                ) {
                    return "#f39c12"; // orange
                }

                return "#d4b476"; // default
            });

        // ===== Update Array Display =====
        arrayDisplay.innerHTML = "";

        data.forEach((value, index) => {

            const span = document.createElement("span");
            span.textContent = value;

            span.style.padding = "6px 10px";
            span.style.margin = "4px";
            span.style.borderRadius = "6px";
            span.style.display = "inline-block";
            span.style.cursor = "pointer";
            span.style.backgroundColor = "#1c1f26";
            span.style.color = "white";

            // ===== HIGHLIGHT STATES =====
            if (i > 0 && index >= data.length - i) {
                span.style.backgroundColor = "#8e294f";
            }
            else if (
                swappingIndex !== null &&
                (index === swappingIndex || index === swappingIndex + 1)
            ) {
                span.style.backgroundColor = "#e74c3c";
            }
            else if (
                comparingIndex !== null &&
                (index === comparingIndex || index === comparingIndex + 1)
            ) {
                span.style.backgroundColor = "#f39c12";
                span.style.color = "black";
            }

            // ===== CLICK TO EDIT =====
            span.addEventListener("click", function () {

                clearTimeout(timeoutId);
                isPlaying = false;

                const input = document.createElement("input");
                input.type = "number";
                input.value = data[index];
                input.min = 1;
                input.max = 100;
                input.style.width = "60px";

                span.replaceWith(input);
                input.focus();

                input.addEventListener("keydown", function (e) {
                    if (e.key === "Enter") {

                        const newValue = parseFloat(input.value);

                        if (!isNaN(newValue)) {
                            // enforcing 1-100 range
                            if (newValue > 100) newValue = 100;
                            if (newValue < 1) newValue = 1;

                            data[index] = newValue;
                            originalData = [...data];

                            // Reset sorting state
                            i = 0;
                            j = 0;
                            comparingIndex = null;
                            swappingIndex = null;

                            drawBars();
                        }
                    }
                });

                input.addEventListener("blur", function () {
                    drawBars();
                });
                
                }); // CLOSE click handler
                
                arrayDisplay.appendChild(span);
                
                }); // CLOSE forEach
                
                } // CLOSE drawBars

    // ===============================
    // Bubble Sort Step
    // ===============================
    function bubbleStep() {

       // if (!isPlaying) return;

        if (i < barCount - 1) {

            if (j < barCount - i - 1) {

                comparingIndex = j;
                swappingIndex = null;

                if (data[j] > data[j + 1]) {

                    pseudocodeBox.textContent =
                        `Comparing ${data[j].toFixed(2)} and ${data[j + 1].toFixed(2)}.
                         ${data[j]} is larger, so we swap them.`;

                    swappingIndex = j;

                    // SINGLE correct swap
                    [data[j], data[j + 1]] = [data[j + 1], data[j]];

                } else {

                    pseudocodeBox.textContent =
                        `Comparing ${data[j].toFixed(2)} and ${data[j + 1].toFixed(2)}.
                         No swap needed.`;
                }

                j++;

            } else {

                j = 0;
                i++;
                comparingIndex = null;
                swappingIndex = null;
            }

        } else {

            // Sorting complete
            comparingIndex = null;
            swappingIndex = null;
            isPlaying = false;

            pseudocodeBox.textContent = "All data sorted.";
            drawBars();
            return;
        }

        drawBars();
        if (isPlaying) {
            timeoutId = setTimeout(bubbleStep, speed);
}
    }

    // ===============================
    // Reset Current Dataset
    // ===============================
    function reset() {

        clearTimeout(timeoutId);
        isPlaying = false;

        data = [...originalData];

        i = 0;
        j = 0;

        comparingIndex = null;
        swappingIndex = null;

        pseudocodeBox.textContent = "Dataset reset.";

        drawBars();
    }

    // ===============================
    // Generate New Dataset
    // ===============================
    function generateNewData() {

        clearTimeout(timeoutId);
        isPlaying = false;

        originalData = generateData();
        data = [...originalData];

        i = 0;
        j = 0;

        comparingIndex = null;
        swappingIndex = null;

        pseudocodeBox.textContent = "New dataset generated.";

        drawBars();
    }

    // ===============================
    // Button Events
    // ===============================
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
    stepBtn.addEventListener("click", function () {
        clearTimeout(timeoutId);
        isPlaying = false;
        bubbleStep();
    });

    resetBtn.addEventListener("click", reset);
    newDataBtn.addEventListener("click", generateNewData);

    // Initial Load
    generateNewData();
});