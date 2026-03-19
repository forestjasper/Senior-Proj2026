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
    const algorithmSelect = document.getElementById("algorithm-select");

    const startBtn = document.getElementById("start-btn");
    const pauseBtn = document.getElementById("pause-btn");
    const resetBtn = document.getElementById("reset-btn");
    const newDataBtn = document.getElementById("newdata-btn");
    const stepBtn = document.getElementById("step-btn");
    const searchInput = document.getElementById("search-input");

    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const barCount = 20;
	

	// ===============================
	// Pseudocode templates
	// ===============================
	const bubblePseudo = [
	"Color Key: Yellow indicates comparing",
	"			Orange indicates swapping",
	"			Purple indicates data is sorted",
	"-------------------------------------------------",
	"procedure bubbleSort(A : list of sortable items)",
	"n = length(A)",
	"repeat",
	"    swapped = false",
	"    for i = 0 to n - 2 inclusive do",
	"        if A[i] > A[i + 1] then",
	"            swap(A[i], A[i + 1])",
	"            swapped = true",
	"        end if",
	"    end for",
	"    n = n - 1",
	"until not swapped",
	"end procedure"
	];

	const linearPseudo = [
	"Color Key: Yellow indicates checking value",
	"			Orange indicates value was checked, not target",
	"			Purple indicates value was checked, is target",
	"----------------------------------------------",
	"procedure linearSearch(A, target)",
	"for i = 0 to length(A)-1",
	"    if A[i] == target",
	"        return i",
	"    end if",
	"end for"
	];
	
	// ===============================
	// Render pseudocode in box
	// ===============================
	function renderPseudocode(lines) {

	    pseudocodeBox.innerHTML = "";

	    lines.forEach((line, index) => {

	        const div = document.createElement("div");
	        div.className = "pseudocode-line";
	        div.id = "pseudo-" + index;
	        div.textContent = line;

	        pseudocodeBox.appendChild(div);
	    });
	}
	
	// ===============================
	// Highlight line of pseudocode
	// ===============================
	function highlightPseudo(lineIndex, className) {

	    const lines = document.querySelectorAll(".pseudocode-line");

	    // Clear previous highlights
	    lines.forEach(line => {
	        line.classList.remove("pseudo-compare","pseudo-swap","pseudo-done");
	    });

	    const target = document.getElementById("pseudo-" + lineIndex);

	    if (target) {
	        target.classList.add(className);
	    }
	}

    // ===============================
    // State
    // ===============================
    let data = [];
    let originalData = [];

    // Bubble Sort
    let i = 0;
    let j = 0;
    let comparingIndex = null;
    let swappingIndex = null;

    // Linear Search
    let searchIndex = 0;
    let searchTarget = null;
    let foundIndex = null;
    let checkedIndices = [];

    let isPlaying = false;
    let timeoutId = null;

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
    // Generate Data
    // ===============================
    function generateData() {
        return Array.from({ length: barCount }, () =>
            Math.floor(Math.random() * 100) + 1
        );
    }

    // ===============================
    // MASTER DRAW FUNCTION
    // ===============================
    function drawVisualization() {
        svg.selectAll("*").remove();

        if (algorithmSelect.value === "bubble") {
            drawBars();
        } else {
            drawNodes();
        }
    }

    // ===============================
    // Draw Bars (Bubble Sort)
    // ===============================
    function drawBars() {

        svg.selectAll("rect")
            .data(data)
            .join("rect")
            .attr("x", (_, index) => index * (width / barCount))
            .attr("width", width / barCount - 2)
            .attr("y", d => height - y(d))
            .attr("height", d => y(d))
            .attr("fill", (_, index) => {

                if (i > 0 && index >= barCount - i) return "#8e294f";

                if (swappingIndex !== null &&
                    (index === swappingIndex || index === swappingIndex + 1))
                    return "#e74c3c";

                if (comparingIndex !== null &&
                    (index === comparingIndex || index === comparingIndex + 1))
                    return "#f39c12";

                return "#d4b476";
            });

        drawArrayDisplay();
    }

    // ===============================
    // Draw Nodes (Linear Search)
    // ===============================
    function drawNodes() {

        const spacing = width / data.length;

        svg.selectAll("circle")
            .data(data)
            .join("circle")
            .attr("cx", (_, i) => i * spacing + spacing / 2)
            .attr("cy", height / 2)
            .attr("r", 25)
            .attr("fill", (_, index) => {

                    // Correct (locked)
                    if (index === foundIndex) return "#8e294f";

                    // Currently checking
                    if (index === comparingIndex) return "#f39c12";

                    // Checked and wrong
                    if (checkedIndices.includes(index)) return "#e74c3c";

                    // Not checked yet
                    return "#d4b476"; // yellow
            });

        svg.selectAll("text")
            .data(data)
            .join("text")
            .attr("x", (_, i) => i * spacing + spacing / 2)
            .attr("y", height / 2 + 5)
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .text(d => d);

        drawArrayDisplay();
    }

    // ===============================
    // Array Display (shared)
    // ===============================
    function drawArrayDisplay() {

        arrayDisplay.innerHTML = "";
    
        data.forEach((value, index) => {
    
            const span = document.createElement("span");
            span.textContent = value;
    
            span.style.padding = "6px 10px";
            span.style.margin = "4px";
            span.style.borderRadius = "6px";
            span.style.display = "inline-block";
            span.style.backgroundColor = "#1c1f26";
            span.style.color = "white";
            span.style.cursor = "pointer";
    
            // ===============================
            // Bubble Sort Colors
            // ===============================
            if (algorithmSelect.value === "bubble") {
    
                if (i > 0 && index >= barCount - i) {
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
                }
            }
    
            // ===============================
            // Linear Search Colors
            // ===============================
            else {
    
                if (index === foundIndex) {
                    span.style.backgroundColor = "#8e294f";
                }
    
                else if (index === comparingIndex) {
                    span.style.backgroundColor = "#f39c12";
                }
    
                else if (checkedIndices.includes(index)) {
                    span.style.backgroundColor = "#e74c3c";
                }
            }
    
            // ===============================
            // Click to Edit
            // ===============================
            span.addEventListener("click", function () {
    
                const input = document.createElement("input");
    
                input.type = "number";
                input.min = 1;
                input.max = 100;
                input.value = data[index];
    
                input.style.width = "50px";
                input.style.textAlign = "center";
    
                span.replaceWith(input);
                input.focus();
    
                function saveValue() {
    
                    let newValue = parseInt(input.value);
    
                    if (isNaN(newValue)) newValue = data[index];
                    if (newValue < 1) newValue = 1;
                    if (newValue > 100) newValue = 100;
    
                    data[index] = newValue;
                    originalData[index] = newValue;
    
                    drawVisualization();
                }
    
                input.addEventListener("blur", saveValue);
                input.addEventListener("keydown", function (e) {
                    if (e.key === "Enter") {
                        saveValue();
                    }
                });
            });
    
            arrayDisplay.appendChild(span);
        });
    }

    // ===============================
    // Bubble Sort Step
    // ===============================
    function bubbleStep() {

        if (i < barCount - 1) {

            if (j < barCount - i - 1) {

                comparingIndex = j;
                swappingIndex = null;
				
				//Change pseudocode line color with compare
				highlightPseudo(9,"pseudo-compare");

                if (data[j] > data[j + 1]) {
					
                    swappingIndex = j;
					
					//Change pseudocode line color with swap
					highlightPseudo(10,"pseudo-swap");
					
                    [data[j], data[j + 1]] = [data[j + 1], data[j]];
                }

                j++;

            } else {
                j = 0;
                i++;
				
				//Change pseudocode line color when sorted
				highlightPseudo(14,"pseudo-done");
				
                comparingIndex = null;
                swappingIndex = null;
            }

        } else {
            isPlaying = false;
            drawVisualization();
            return;
        }

        drawVisualization();

        if (isPlaying) {
            timeoutId = setTimeout(bubbleStep, speed);
        }
    }

    // ===============================
    // Linear Search Step
    // ===============================
	function linearStep() {

	    if (searchIndex >= data.length) {
	        isPlaying = false;
	        comparingIndex = null;
	        drawVisualization();
	        return;
	    }

	    comparingIndex = searchIndex;

		//Change pseudocode line color with check
	    highlightPseudo(6,"pseudo-compare");

	    drawVisualization();

	    //Delay evaluation slightly so compare is visible
	    setTimeout(() => {

	        if (data[searchIndex] === searchTarget) {

	            foundIndex = searchIndex;

	            highlightPseudo(7,"pseudo-done");

	            isPlaying = false;

	        } else {

	            checkedIndices.push(searchIndex);

	            highlightPseudo(6,"pseudo-swap");

	            searchIndex++;
	        }

	        drawVisualization();

	        if (isPlaying) {
	            timeoutId = setTimeout(linearStep, speed);
	        }

	    }, speed/2);
	}

    function reset() {

        clearTimeout(timeoutId);
        isPlaying = false;
    
        data = [...originalData];
    
        i = 0;
        j = 0;
        searchIndex = 0;
        searchTarget = null;
        foundIndex = null;
        comparingIndex = null;
        swappingIndex = null;
        checkedIndices = [];   
        searchInput.value = "";
        drawVisualization();
    }

    function generateNewData() {

        clearTimeout(timeoutId);
        isPlaying = false;
    
        originalData = generateData();
        data = [...originalData];
    
        i = 0;
        j = 0;
        searchIndex = 0;
        searchTarget = null;
        foundIndex = null;
        comparingIndex = null;
        swappingIndex = null;
        checkedIndices = [];   
        searchInput.value = "";
        drawVisualization();
    }

    resetBtn.addEventListener("click", reset);
    newDataBtn.addEventListener("click", generateNewData);
    algorithmSelect.addEventListener("change", function () {
    
        clearTimeout(timeoutId);
        isPlaying = false;
    
        i = 0;
        j = 0;
    
        searchIndex = 0;
        searchTarget = null;
        foundIndex = null;
    
        comparingIndex = null;
        swappingIndex = null;
        checkedIndices = [];
    
        const searchContainer = document.querySelector(".search-input-container");
    
        if (algorithmSelect.value === "bubble") {
    
            renderPseudocode(bubblePseudo);
    
            // hide input
            searchContainer.style.display = "none";
            searchInput.value = "";
    
        } else {
    
            renderPseudocode(linearPseudo);
    
            // show input
            searchContainer.style.display = "flex";
        }
    
        drawVisualization();
    });
    // ===============================
    // Button Events
    // ===============================

    startBtn.addEventListener("click", function () {

        if (isPlaying) return;

        isPlaying = true;

        if (algorithmSelect.value === "bubble") {
            bubbleStep();
        } else {

            if (searchTarget === null) {

                let value = parseInt(searchInput.value);
            
                if (isNaN(value)) {
                    alert("Please enter a value between 1 and 100.");
                    return;
                }
            
                if (value < 1) value = 1;
                if (value > 100) value = 100;
            
                searchTarget = value;
            }

            searchIndex = 0;
            foundIndex = null;
            checkedIndices = [];

            linearStep();
        }
    });

    pauseBtn.addEventListener("click", function () {
        isPlaying = false;
        clearTimeout(timeoutId);
    });

    stepBtn.addEventListener("click", function () {

        clearTimeout(timeoutId);
        isPlaying = false;

        if (algorithmSelect.value === "bubble") {
            bubbleStep();
        } else {

            if (searchTarget === null) {

                let value = parseInt(searchInput.value);
            
                if (isNaN(value)) {
                    alert("Please enter a value between 1 and 100.");
                    return;
                }
            
                if (value < 1) value = 1;
                if (value > 100) value = 100;
            
                searchTarget = value;
            }

            linearStep();
        }
    });
	
	renderPseudocode(bubblePseudo);
    const searchContainer = document.querySelector(".search-input-container");
    searchContainer.style.display = "none"; // default = bubble
    generateNewData();
});