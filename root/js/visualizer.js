document.addEventListener("DOMContentLoaded", function () {
    // Speed slider being connected.
    let speed = 150; // Default speed
    const speedSlider = document.getElementById("speed-slider");

    speedSlider.addEventListener("input", function () {
        const level = parseInt(this.value);


        speed = 1000 / level;
    });
    
    const arrayDisplay = document.getElementById("array-values");
    const container = document.getElementById("visualizer-canvas");
    if (!container) return;

    const pseudocodeBox = document.getElementById("pseudocode-box");
    const startBtn = document.getElementById("start-btn");
    const pauseBtn = document.getElementById("pause-btn");
    const resetBtn = document.getElementById("reset-btn");
    const newDataBtn = document.getElementById("newdata-btn");

    const width = container.clientWidth;
    const height = container.clientHeight;

    const barCount = 20;
    

    let data;
    let i;
    let j;
    let originalData;
    let isPlaying = false;
    let timeoutId = null;
    let comparingIndex = null;
    let swappingIndex = null;
    
    
    const svg = d3.select("#visualizer-canvas")
        .append("svg")
        .attr("width", width)
        .attr("height", height);
    
    const y = d3.scaleLinear()
        .domain([0, 1])
        .range([0, height - 20]);
    // Generating data from the randomly generated array
    function generateData() {
        return Array.from({ length: barCount }, () => Math.random());
    }
    // Using generated array to draw bars for our animation.
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
                // Sorted already
                if (index >= barCount - i) {
                    return "#8e294f"; 
                }
                //  Swapping color 
                if (swappingIndex !== null &&
                    (index === swappingIndex || index === swappingIndex + 1)) {
                    return "#e74c3c";
                }
    
                //  Comparing color
                if (comparingIndex !== null &&
                    (index === comparingIndex || index === comparingIndex + 1)) {
                    return "#f39c12";
                }
    
                return "#d4b476"; // normal
            });
            // Array highlight at bottom.
            arrayDisplay.innerHTML = "";

            data.forEach((value, index) => {
            
                const span = document.createElement("span");
                span.textContent = value.toFixed(2);
            
                span.style.padding = "6px 10px";
                span.style.margin = "4px";
                span.style.borderRadius = "6px";
                span.style.display = "inline-block";
                span.style.backgroundColor = "#1c1f26";

                // Sorted highlight
                if (index >= barCount - i) {
                    span.style.backgroundColor = "#8e294f";
                    span.style.color = "white";
                }
                //  Swapping highlight
                if (swappingIndex !== null &&
                    (index === swappingIndex || index === swappingIndex + 1)) {
                    span.style.backgroundColor = "#e74c3c";
                    span.style.color = "white";
                }
            
                //  Comparing highlight
                else if (comparingIndex !== null &&
                    (index === comparingIndex || index === comparingIndex + 1)) {
                    span.style.backgroundColor = "#f39c12";
                    span.style.color = "black";
                }
            
                arrayDisplay.appendChild(span);
            });
    }
    // Bubble sort function.
    function bubbleStep() {

        if (!isPlaying) return;

        if (i < barCount) {

            if (j < barCount - i - 1) {
                if (data[j] > data[j + 1]) {

                    pseudocodeBox.textContent =
                        `Comparing ${data[j].toFixed(2)} and ${data[j + 1].toFixed(2)}. 
                         ${data[j].toFixed(2)} is larger, so we swap them.`;
    
                    [data[j], data[j + 1]] = [data[j + 1], data[j]];
    
                } else {
    
                    pseudocodeBox.textContent =
                        `Comparing ${data[j].toFixed(2)} and ${data[j + 1].toFixed(2)}. 
                         No swap needed.`;
                }

                comparingIndex = j;
                swappingIndex = null;

                if (data[j] > data[j + 1]) {

                    swappingIndex = j;

                    [data[j], data[j + 1]] = [data[j + 1], data[j]];
                }

                j++;
                drawBars();

            } else {
                j = 0;
                i++;
                comparingIndex = null;
                swappingIndex = null;
            }

        } else {
            comparingIndex = null;
            swappingIndex = null;
            isPlaying = false;
            pseudocodeBox.textContent = "All data sorted.";
            return; // stop scheduling more steps
        }

        timeoutId = setTimeout(bubbleStep, speed);
    }

    function reset() {
        clearTimeout(timeoutId);
        isPlaying = false;
    
        data = [...originalData];  // restore original dataset
        i = 0;
        j = 0;
    
        drawBars();
    }
    function generateNewData() {
        clearTimeout(timeoutId);
        isPlaying = false;
    
        originalData = generateData();
        data = [...originalData];
    
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
    newDataBtn.addEventListener("click", generateNewData);

    generateNewData();
});
