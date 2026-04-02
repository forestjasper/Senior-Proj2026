document.addEventListener("DOMContentLoaded", function () {
    let speed = 150;
    const speedSlider = document.getElementById("speed-slider");

    const arrayDisplay = document.getElementById("array-values");
    const container = document.getElementById("visualizer-canvas");
    const pseudocodeBox = document.getElementById("pseudocode-box");
    const algorithmSelect = document.getElementById("algorithm-select");
    const algorithmTitle = document.getElementById("algorithm-title");
    const algorithmDescription = document.getElementById("algorithm-description");

    const startBtn = document.getElementById("start-btn");
    const pauseBtn = document.getElementById("pause-btn");
    const resetBtn = document.getElementById("reset-btn");
    const newDataBtn = document.getElementById("newdata-btn");
    const stepBtn = document.getElementById("step-btn");

    const searchInput = document.getElementById("search-input");
    const searchContainer = document.querySelector(".search-input-container");
    const searchInputLabel = document.getElementById("search-input-label");
    const arrayDisplayTitle = document.getElementById("array-display-title");

    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const barCount = 20;
    const matrixSize = 6;
    const dfsNodeCount = 8;

    const bubblePseudo = [
        "Color Key: Yellow indicates comparing",
        "           Orange indicates swapping",
        "           Purple indicates data is sorted",
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
        "           Orange indicates value checked, not target",
        "           Purple indicates value checked, and found",
        "----------------------------------------------",
        "procedure linearSearch(A, target)",
        "for i = 0 to length(A)-1",
        "    if A[i] == target",
        "        return i",
        "    end if",
        "end for"
    ];

    const dijkstraPseudo = [
        "Color Key: Yellow indicates active node/edge checks",
        "           Orange indicates distance update",
        "           Purple indicates visited/finalized node",
        "---------------------------------------------------",
        "procedure dijkstra(M, source)",
        "dist[source] = 0, others = INF",
        "while unvisited nodes remain",
        "    u = unvisited node with smallest dist",
        "    for each vertex v",
        "        if edge(u, v) and not visited[v]",
        "            if dist[u] + w(u,v) < dist[v]",
        "                dist[v] = dist[u] + w(u,v)",
        "            end if",
        "    mark u as visited",
        "end procedure"
    ];
    const dfsPseudo = [
        "Color Key: Yellow = current node",
        "           Orange = active edge/neighbor",
        "           Purple = visited",
        "--------------------------------------",
        "procedure DFS(node)",
        "    mark node as visited",
        "    for each neighbor v of node",
        "        if v not visited",
        "            traverse edge(node, v)",
        "            DFS(v)",
        "        end if",
        "end procedure"
    ];

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

    function highlightPseudo(lineIndex, className) {
        const lines = document.querySelectorAll(".pseudocode-line");
        lines.forEach((line) => line.classList.remove("pseudo-compare", "pseudo-swap", "pseudo-done"));
        const target = document.getElementById("pseudo-" + lineIndex);
        if (target) target.classList.add(className);
    }
    function clearPseudoHighlight() {
        const lines = document.querySelectorAll(".pseudocode-line");
        lines.forEach((line) =>
            line.classList.remove("pseudo-compare", "pseudo-swap", "pseudo-done")
        );
    }

    let data = [];
    let originalData = [];

    let i = 0;
    let j = 0;
    let comparingIndex = null;
    let swappingIndex = null;

    let searchIndex = 0;
    let searchTarget = null;
    let foundIndex = null;
    let checkedIndices = [];

    let matrixData = [];
    let originalMatrix = [];
    let dist = [];
    let visited = [];
    let nodeLabels = [];
    let sourceIndex = null;
    let currentNode = null;
    let neighborIndex = 0;
    let activeNeighbor = null;
    let dijkstraFinished = false;

    let dfsTree = null;
    let dfsStartNode = null;
    let dfsStack = [];
    let dfsVisited = [];
    let dfsTraversalOrder = [];
    let dfsCurrent = null;
    let dfsCurrentNeighbor = null;
    let dfsActiveEdge = null;
    let dfsTraversedEdges = [];
    let dfsFinished = false;

    let isPlaying = false;
    let timeoutId = null;

    speedSlider.addEventListener("input", function () {
        const level = parseInt(this.value, 10);
        speed = 1000 / level;
    });

    const svg = d3.select("#visualizer-canvas")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const y = d3.scaleLinear()
        .domain([0, 100])
        .range([0, height - 20]);

    function generateData() {
        return Array.from({ length: barCount }, () => Math.floor(Math.random() * 100) + 1);
    }

    function generateMatrixData(size) {
        const matrix = Array.from({ length: size }, () => Array(size).fill(0));

        for (let idx = 0; idx < size - 1; idx++) {
            const weight = Math.floor(Math.random() * 8) + 2;
            matrix[idx][idx + 1] = weight;
            matrix[idx + 1][idx] = weight;
        }

        for (let row = 0; row < size; row++) {
            for (let col = row + 2; col < size; col++) {
                if (Math.random() < 0.4) {
                    const weight = Math.floor(Math.random() * 9) + 1;
                    matrix[row][col] = weight;
                    matrix[col][row] = weight;
                }
            }
        }

        return matrix;
    }

    function deepCopyMatrix(matrix) {
        return matrix.map((row) => [...row]);
    }

    function getNodeLabel(index) {
        return String.fromCharCode(65 + index);
    }

    function parseSourceNodeLabel(value) {
        if (!value) return -1;
        const trimmed = String(value).trim().toUpperCase();
        if (trimmed.length !== 1) return -1;

        const idx = trimmed.charCodeAt(0) - 65;
        return idx >= 0 && idx < matrixSize ? idx : -1;
    }

    function resetDijkstraState() {
        dist = Array(matrixData.length).fill(Infinity);
        visited = Array(matrixData.length).fill(false);
        nodeLabels = Array.from({ length: matrixData.length }, (_, idx) => getNodeLabel(idx));
        sourceIndex = null;
        currentNode = null;
        neighborIndex = 0;
        activeNeighbor = null;
        dijkstraFinished = false;
        comparingIndex = null;
        swappingIndex = null;
    }

    function editDijkstraEdge(row, col) {
        if (row === col) return;
    
        // Pause automatically
        if (isPlaying) {
            isPlaying = false;
            clearTimeout(timeoutId);
        }
    
        const from = getNodeLabel(row);
        const to = getNodeLabel(col);
    
        const editor = document.getElementById("edge-editor");
        const fromInput = document.getElementById("edge-from");
        const toInput = document.getElementById("edge-to");
        const weightInput = document.getElementById("edge-weight");
    
        editor.style.display = "flex";
    
        fromInput.value = from;
        toInput.value = to;
        weightInput.value = matrixData[row][col];
    
        editor.dataset.row = row;
        editor.dataset.col = col;
    }

    function getMinUnvisitedNode() {
        let minDistance = Infinity;
        let minNode = -1;

        for (let idx = 0; idx < dist.length; idx++) {
            if (!visited[idx] && dist[idx] < minDistance) {
                minDistance = dist[idx];
                minNode = idx;
            }
        }

        return minNode;
    }
    function getDFSEdgeKey(source, target) {
        return source < target ? `${source}-${target}` : `${target}-${source}`;
    }

    function generateDFSTree(size) {
        const children = Array.from({ length: size }, () => []);
        const adjacency = Array.from({ length: size }, () => []);
        const edges = [];

        for (let node = 1; node < size; node++) {
            const parent = Math.floor(Math.random() * node);
            children[parent].push(node);
            adjacency[parent].push(node);
            adjacency[node].push(parent);
            edges.push({ source: parent, target: node });
        }

        adjacency.forEach((neighbors) => neighbors.sort((a, b) => a - b));

        const positions = Array(size).fill(null);
        let leafCount = 0;
        let maxDepth = 0;

        function assignPosition(node, depth) {
            maxDepth = Math.max(maxDepth, depth);

            if (children[node].length === 0) {
                positions[node] = { leafX: leafCount, depth };
                leafCount += 1;
                return positions[node].leafX;
            }

            const childCenters = children[node].map((child) => assignPosition(child, depth + 1));
            const center = (childCenters[0] + childCenters[childCenters.length - 1]) / 2;
            positions[node] = { leafX: center, depth };
            return center;
        }

        assignPosition(0, 0);

        return {
            nodeCount: size,
            root: 0,
            children,
            adjacency,
            edges,
            positions,
            leafCount: Math.max(leafCount, 1),
            maxDepth
        };
    }

    function resetDFSState() {
        const nodeCount = dfsTree ? dfsTree.nodeCount : dfsNodeCount;
        dfsStartNode = null;
        dfsStack = [];
        dfsVisited = Array(nodeCount).fill(false);
        dfsTraversalOrder = [];
        dfsCurrent = null;
        dfsCurrentNeighbor = null;
        dfsActiveEdge = null;
        dfsTraversedEdges = [];
        dfsFinished = false;
    }

    function initializeDFS() {
        if (dfsStartNode !== null || dfsStack.length > 0) return true;

        const start = parseSourceNodeLabel(searchInput.value);
        if (start === -1 || start >= dfsNodeCount) {
            alert(`Enter node A-${getNodeLabel(dfsNodeCount - 1)}`);
            return false;
        }

        dfsStartNode = start;
        dfsStack = [{ node: start, parent: null, nextNeighborIndex: 0 }];
        searchInput.value = getNodeLabel(start);
        drawVisualization();
        return true;
    }

    function setAlgorithmHeader() {
        if (!algorithmTitle || !algorithmDescription || !arrayDisplayTitle) return;

        if (algorithmSelect.value === "bubble") {
            algorithmTitle.textContent = "Bubble Sort";
            algorithmDescription.textContent = "Watch the algorithm step through comparisons and swaps.";
            arrayDisplayTitle.textContent = "Current Array";
        } else if (algorithmSelect.value === "linear") {
            algorithmTitle.textContent = "Linear Search";
            algorithmDescription.textContent = "Check each value one-by-one until the target is found.";
            arrayDisplayTitle.textContent = "Current Array";
        } else if (algorithmSelect.value === "dfs") {
            algorithmTitle.textContent = "Depth First Search";
            algorithmDescription.textContent = "Traverse a tree of nodes depth-first and highlight the active edges as the search moves.";
            arrayDisplayTitle.textContent = "Traversal Order";
        } else {
            algorithmTitle.textContent = "Dijkstra (Shortest Path)";
            algorithmDescription.textContent = "Traverse an adjacency matrix and graph view together to build shortest distances from a source node.";
            arrayDisplayTitle.textContent = "Distance Table";
        }
    }

    function drawVisualization() {
        svg.selectAll("*").remove();

        if (algorithmSelect.value === "bubble") {
            drawBars();
        } else if (algorithmSelect.value === "linear") {
            drawNodes();
        }else if (algorithmSelect.value === "dfs") {
            drawDFSGraph();
        } else {
            drawDijkstraViews();
        }
    }

    function drawBars() {
        svg.selectAll("rect")
            .data(data)
            .join("rect")
            .attr("x", (_, index) => index * (width / barCount))
            .attr("width", width / barCount - 2)
            .attr("y", (d) => height - y(d))
            .attr("height", (d) => y(d))
            .attr("fill", (_, index) => {
                if (i > 0 && index >= barCount - i) return "#8e294f";
                if (swappingIndex !== null && (index === swappingIndex || index === swappingIndex + 1)) return "#e74c3c";
                if (comparingIndex !== null && (index === comparingIndex || index === comparingIndex + 1)) return "#f39c12";
                return "#d4b476";
            });

        drawArrayDisplay();
    }

    function drawNodes() {
        const spacing = width / data.length;

        svg.selectAll("circle")
            .data(data)
            .join("circle")
            .attr("cx", (_, idx) => idx * spacing + spacing / 2)
            .attr("cy", height / 2)
            .attr("r", 25)
            .attr("fill", (_, index) => {
                if (index === foundIndex) return "#8e294f";
                if (index === comparingIndex) return "#f39c12";
                if (checkedIndices.includes(index)) return "#e74c3c";
                return "#d4b476";
            });

        svg.selectAll("text")
            .data(data)
            .join("text")
            .attr("x", (_, idx) => idx * spacing + spacing / 2)
            .attr("y", height / 2 + 5)
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .text((d) => d);

        drawArrayDisplay();
    }

    function drawDijkstraViews() {
        const n = matrixData.length;
        if (!n) {
            drawArrayDisplay();
            return;
        }

        const panelPadding = 14;
        const panelGap = 18;
        const panelWidth = (width - panelPadding * 2 - panelGap) / 2;
        const panelHeight = height - 20;

        const leftPanelX = panelPadding;
        const rightPanelX = panelPadding + panelWidth + panelGap;
        const panelY = 10;

        svg.append("rect")
            .attr("x", leftPanelX)
            .attr("y", panelY)
            .attr("width", panelWidth)
            .attr("height", panelHeight)
            .attr("rx", 10)
            .attr("fill", "#10131a")
            .attr("stroke", "#2b303c");

        svg.append("rect")
            .attr("x", rightPanelX)
            .attr("y", panelY)
            .attr("width", panelWidth)
            .attr("height", panelHeight)
            .attr("rx", 10)
            .attr("fill", "#10131a")
            .attr("stroke", "#2b303c");

        svg.append("text")
            .attr("x", leftPanelX + 12)
            .attr("y", panelY + 18)
            .attr("fill", "#d4b476")
            .style("font-family", "monospace")
            .style("font-size", "12px")
            .text("Adjacency Matrix");

        svg.append("text")
            .attr("x", rightPanelX + 12)
            .attr("y", panelY + 18)
            .attr("fill", "#d4b476")
            .style("font-family", "monospace")
            .style("font-size", "12px")
            .text("Graph View");

        const cellSize = Math.floor(Math.min((panelWidth - 60) / n, (height - 90) / n));
        const startX = leftPanelX + 26 + Math.floor((panelWidth - 26 - n * cellSize) / 2);
        const startY = 44;

        const flatCells = [];
        for (let row = 0; row < n; row++) {
            for (let col = 0; col < n; col++) {
                flatCells.push({ row, col, weight: matrixData[row][col] });
            }
        }

        svg.selectAll(".matrix-cell")
            .data(flatCells)
            .join("rect")
            .attr("class", "matrix-cell")
            .attr("x", (d) => startX + d.col * cellSize)
            .attr("y", (d) => startY + d.row * cellSize)
            .attr("width", cellSize - 2)
            .attr("height", cellSize - 2)
            .attr("rx", 4)
            .attr("fill", (d) => {
                if (visited[d.row]) return "#8e294f";
                if (currentNode === d.row && d.col === swappingIndex) return "#e74c3c";
                if (currentNode === d.row && d.col === activeNeighbor) return "#f39c12";
                if (currentNode === d.row) return "#e0b04f";
                return d.weight > 0 || d.row === d.col ? "#1c1f26" : "#0f1117";
            })
            .attr("stroke", "#3a3a40")
            .attr("stroke-width", 1)
            .style("cursor", (d) => (d.row === d.col ? "default" : "pointer"))
            .on("click", (_, d) => editDijkstraEdge(d.row, d.col));

        svg.selectAll(".matrix-text")
            .data(flatCells)
            .join("text")
            .attr("class", "matrix-text")
            .attr("x", (d) => startX + d.col * cellSize + (cellSize - 2) / 2)
            .attr("y", (d) => startY + d.row * cellSize + (cellSize - 2) / 2 + 5)
            .attr("text-anchor", "middle")
            .attr("fill", "#f5f5f5")
            .style("font-size", "12px")
            .style("font-family", "monospace")
            .text((d) => {
                if (d.row === d.col) return "0";
                return d.weight > 0 ? d.weight : "INF";
            })
            .style("cursor", (d) => (d.row === d.col ? "default" : "pointer"))
            .on("click", (_, d) => editDijkstraEdge(d.row, d.col));
        svg.selectAll(".matrix-col-header")
            .data(nodeLabels)
            .join("text")
            .attr("class", "matrix-col-header")
            .attr("x", (_, idx) => startX + idx * cellSize + (cellSize - 2) / 2)
            .attr("y", startY - 8)
            .attr("text-anchor", "middle")
            .attr("fill", "#d4b476")
            .style("font-family", "monospace")
            .style("font-weight", "600")
            .style("font-size", "12px")
            .text((label) => label);

        svg.selectAll(".matrix-row-header")
            .data(nodeLabels)
            .join("text")
            .attr("class", "matrix-row-header")
            .attr("x", startX - 12)
            .attr("y", (_, idx) => startY + idx * cellSize + (cellSize - 2) / 2 + 5)
            .attr("text-anchor", "middle")
            .attr("fill", "#d4b476")
            .style("font-family", "monospace")
            .style("font-weight", "600")
            .style("font-size", "12px")
            .text((label) => label);

        drawDijkstraGraph(rightPanelX, panelY, panelWidth, panelHeight, n);
        drawArrayDisplay();
    }

    function drawDijkstraGraph(panelX, panelY, panelWidth, panelHeight, n) {
        const graphTop = panelY + 34;
        const graphHeight = panelHeight - 44;

        const centerX = panelX + panelWidth / 2;
        const centerY = graphTop + graphHeight / 2;
        const radius = Math.max(45, Math.min(panelWidth, graphHeight) / 2 - 34);

        const graphNodes = nodeLabels.map((label, idx) => {
            const angle = -Math.PI / 2 + (2 * Math.PI * idx) / n;
            return {
                idx,
                label,
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            };
        });

        const graphEdges = [];
        for (let row = 0; row < n; row++) {
            for (let col = row + 1; col < n; col++) {
                const weight = matrixData[row][col];
                if (weight > 0) {
                    graphEdges.push({ source: graphNodes[row], target: graphNodes[col], weight, row, col });
                }
            }
        }
        svg.selectAll(".graph-edge-hitbox")
            .data(graphEdges)
            .join("line")
            .attr("class", "graph-edge-hitbox")
            .attr("x1", (d) => d.source.x)
            .attr("y1", (d) => d.source.y)
            .attr("x2", (d) => d.target.x)
            .attr("y2", (d) => d.target.y)
            .attr("stroke", "transparent")
            .attr("stroke-width", 25) // big click area
            .style("cursor", "pointer")
            .on("click", (_, d) => editDijkstraEdge(d.row, d.col));
        svg.selectAll(".graph-edge")
            .data(graphEdges)
            .join("line")
            .attr("class", "graph-edge")
            .attr("x1", (d) => d.source.x)
            .attr("y1", (d) => d.source.y)
            .attr("x2", (d) => d.target.x)
            .attr("y2", (d) => d.target.y)
            .attr("stroke", (d) => {
                const isActive = currentNode !== null && activeNeighbor !== null &&
                    ((d.row === currentNode && d.col === activeNeighbor) || (d.col === currentNode && d.row === activeNeighbor));

                const isUpdated = currentNode !== null && swappingIndex !== null &&
                    ((d.row === currentNode && d.col === swappingIndex) || (d.col === currentNode && d.row === swappingIndex));

                if (isUpdated) return "#e74c3c";
                if (isActive) return "#f39c12";
                if (visited[d.row] && visited[d.col]) return "#8e294f";
                return "#6f7689";
            })
            .attr("stroke-width", (d) => {
                const isHighlighted = currentNode !== null &&
                    ((d.row === currentNode && (d.col === activeNeighbor || d.col === swappingIndex)) ||
                        (d.col === currentNode && (d.row === activeNeighbor || d.row === swappingIndex)));
                return isHighlighted ? 3 : 2;
            })
            .style("cursor", "pointer")
            .on("click", (_, d) => editDijkstraEdge(d.row, d.col));

        svg.selectAll(".graph-edge-weight")
            .data(graphEdges)
            .join("text")
            .attr("class", "graph-edge-weight")
            .attr("x", (d) => (d.source.x + d.target.x) / 2)
            .attr("y", (d) => (d.source.y + d.target.y) / 2 - 4)
            .attr("text-anchor", "middle")
            .attr("fill", "#d5d9e2")
            .style("font-family", "monospace")
            .style("font-size", "11px")
            .style("pointer-events", "none") 
            .text((d) => d.weight);

        svg.selectAll(".graph-node")
            .data(graphNodes)
            .join("circle")
            .attr("class", "graph-node")
            .attr("cx", (d) => d.x)
            .attr("cy", (d) => d.y)
            .attr("r", 16)
            .attr("fill", (d) => {
                if (visited[d.idx]) return "#8e294f";
                if (d.idx === swappingIndex && currentNode !== null) return "#e74c3c";
                if (d.idx === activeNeighbor && currentNode !== null) return "#e67e22";
                if (d.idx === currentNode) return "#f39c12";
                return "#d4b476";
            })
            .attr("stroke", (d) => (d.idx === sourceIndex ? "#ffffff" : "#2e3442"))
            .attr("stroke-width", (d) => (d.idx === sourceIndex ? 2 : 1))
            .style("pointer-events", "none"); 

        svg.selectAll(".graph-node-label")
            .data(graphNodes)
            .join("text")
            .attr("class", "graph-node-label")
            .attr("x", (d) => d.x)
            .attr("y", (d) => d.y + 4)
            .attr("text-anchor", "middle")
            .attr("fill", "#111")
            .style("font-family", "monospace")
            .style("font-size", "12px")
            .style("font-weight", "700")
            .style("pointer-events", "none") 
            .text((d) => d.label);
    }
    function drawDFSGraph() {
        if (!dfsTree) {
            drawArrayDisplay();
            return;
        }

        const paddingX = 50;
        const paddingTop = 36;
        const paddingBottom = 30;
        const usableWidth = width - paddingX * 2;
        const usableHeight = height - paddingTop - paddingBottom;
        const leafDenominator = Math.max(dfsTree.leafCount - 1, 1);
        const depthDenominator = Math.max(dfsTree.maxDepth, 1);

        const positionedNodes = dfsTree.positions.map((position, index) => {
            const x = dfsTree.leafCount === 1
                ? width / 2
                : paddingX + (position.leafX / leafDenominator) * usableWidth;
            const y = dfsTree.maxDepth === 0
                ? height / 2
                : paddingTop + (position.depth / depthDenominator) * usableHeight;

            return { idx: index, label: getNodeLabel(index), x, y };
        });

        const nodeMap = Object.fromEntries(positionedNodes.map((node) => [node.idx, node]));

        svg.selectAll(".dfs-edge")
            .data(dfsTree.edges)
            .join("line")
            .attr("class", "dfs-edge")
            .attr("x1", (d) => nodeMap[d.source].x)
            .attr("y1", (d) => nodeMap[d.source].y)
            .attr("x2", (d) => nodeMap[d.target].x)
            .attr("y2", (d) => nodeMap[d.target].y)
            .attr("stroke", (d) => {
                const edgeKey = getDFSEdgeKey(d.source, d.target);
                const activeKey = dfsActiveEdge ? getDFSEdgeKey(dfsActiveEdge.source, dfsActiveEdge.target) : null;
                if (activeKey === edgeKey) return "#e67e22";
                if (dfsTraversedEdges.includes(edgeKey)) return "#8e294f";
                return "#6f7689";
            })
            .attr("stroke-width", (d) => {
                const edgeKey = getDFSEdgeKey(d.source, d.target);
                const activeKey = dfsActiveEdge ? getDFSEdgeKey(dfsActiveEdge.source, dfsActiveEdge.target) : null;
                return activeKey === edgeKey ? 4 : 2.5;
            });

        svg.selectAll(".dfs-node")
            .data(positionedNodes)
            .join("circle")
            .attr("class", "dfs-node")
            .attr("cx", (d) => d.x)
            .attr("cy", (d) => d.y)
            .attr("r", 20)
            .attr("fill", (d) => {
                if (d.idx === dfsCurrent) return "#f39c12";
                if (d.idx === dfsCurrentNeighbor) return "#e67e22";
                if (dfsVisited[d.idx]) return "#8e294f";
                return "#d4b476";
            })
            .attr("stroke", "#2e3442")
            .attr("stroke-width", 1.5);

        svg.selectAll(".dfs-label")
            .data(positionedNodes)
            .join("text")
            .attr("class", "dfs-label")
            .attr("x", (d) => d.x)
            .attr("y", (d) => d.y + 5)
            .attr("text-anchor", "middle")
            .attr("fill", "#111")
            .style("font-family", "monospace")
            .style("font-size", "12px")
            .style("font-weight", "700")
            .text((d) => d.label);

        drawArrayDisplay();
    }
    function drawArrayDisplay() {
        arrayDisplay.innerHTML = "";

        if (algorithmSelect.value === "dijkstra") {
            nodeLabels.forEach((label, index) => {
                const span = document.createElement("span");
                const value = dist[index] === Infinity ? "INF" : dist[index];
                span.textContent = `${label}:${value}`;

                span.style.padding = "6px 10px";
                span.style.margin = "4px";
                span.style.borderRadius = "6px";
                span.style.display = "inline-block";
                span.style.backgroundColor = "#1c1f26";
                span.style.color = "white";
                span.style.fontFamily = "monospace";

                if (index === sourceIndex) span.style.border = "1px solid #d4b476";
                if (index === currentNode) {
                    span.style.backgroundColor = "#f39c12";
                    span.style.color = "black";
                }
                if (swappingIndex === index && currentNode !== null) span.style.backgroundColor = "#e74c3c";
                if (visited[index]) span.style.backgroundColor = "#8e294f";

                arrayDisplay.appendChild(span);
            });
            return;
        }

        if (algorithmSelect.value === "dfs") {
            if (dfsTraversalOrder.length === 0) {
                const span = document.createElement("span");
                span.textContent = "Traversal will appear here.";
                span.style.color = "#aaa";
                span.style.fontFamily = "monospace";
                arrayDisplay.appendChild(span);
                return;
            }

            dfsTraversalOrder.forEach((nodeIndex) => {
                const span = document.createElement("span");
                span.textContent = getNodeLabel(nodeIndex);
                span.style.padding = "6px 10px";
                span.style.margin = "4px";
                span.style.borderRadius = "6px";
                span.style.display = "inline-block";
                span.style.backgroundColor = "#8e294f";
                span.style.color = "white";
                span.style.fontFamily = "monospace";

                if (nodeIndex === dfsCurrent) {
                    span.style.backgroundColor = "#f39c12";
                    span.style.color = "black";
                } else if (nodeIndex === dfsCurrentNeighbor) {
                    span.style.backgroundColor = "#e67e22";
                }

                arrayDisplay.appendChild(span);
            });
            return;
        }

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

            if (algorithmSelect.value === "bubble") {
                if (i > 0 && index >= barCount - i) span.style.backgroundColor = "#8e294f";
                else if (swappingIndex !== null && (index === swappingIndex || index === swappingIndex + 1)) span.style.backgroundColor = "#e74c3c";
                else if (comparingIndex !== null && (index === comparingIndex || index === comparingIndex + 1)) span.style.backgroundColor = "#f39c12";
            } else {
                if (index === foundIndex) span.style.backgroundColor = "#8e294f";
                else if (index === comparingIndex) span.style.backgroundColor = "#f39c12";
                else if (checkedIndices.includes(index)) span.style.backgroundColor = "#e74c3c";
            }

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
                    let newValue = parseInt(input.value, 10);
                    if (Number.isNaN(newValue)) newValue = data[index];
                    if (newValue < 1) newValue = 1;
                    if (newValue > 100) newValue = 100;

                    data[index] = newValue;
                    originalData[index] = newValue;
                    drawVisualization();
                }

                input.addEventListener("blur", saveValue);
                input.addEventListener("keydown", function (event) {
                    if (event.key === "Enter") saveValue();
                });
            });

            arrayDisplay.appendChild(span);
        });
    }

    function bubbleStep() {
        if (i < barCount - 1) {
            if (j < barCount - i - 1) {
                comparingIndex = j;
                swappingIndex = null;
                highlightPseudo(9, "pseudo-compare");

                if (data[j] > data[j + 1]) {
                    swappingIndex = j;
                    highlightPseudo(10, "pseudo-swap");
                    [data[j], data[j + 1]] = [data[j + 1], data[j]];
                }
                j++;
            } else {
                j = 0;
                i++;
                highlightPseudo(14, "pseudo-done");
                comparingIndex = null;
                swappingIndex = null;
            }
        } else {
            isPlaying = false;
            drawVisualization();
            return;
        }

        drawVisualization();
        if (isPlaying) timeoutId = setTimeout(bubbleStep, speed);
    }

    function linearStep() {
        if (searchIndex >= data.length) {
            isPlaying = false;
            comparingIndex = null;
            drawVisualization();
            return;
        }

        comparingIndex = searchIndex;
        highlightPseudo(6, "pseudo-compare");
        drawVisualization();

        setTimeout(() => {
            if (data[searchIndex] === searchTarget) {
                foundIndex = searchIndex;
                highlightPseudo(7, "pseudo-done");
                isPlaying = false;
            } else {
                checkedIndices.push(searchIndex);
                highlightPseudo(6, "pseudo-swap");
                searchIndex++;
            }

            drawVisualization();
            if (isPlaying) timeoutId = setTimeout(linearStep, speed);
        }, speed / 2);
    }

    function dijkstraStep() {
        if (dijkstraFinished) {
            isPlaying = false;
            drawVisualization();
            return;
        }

        const n = matrixData.length;

        if (currentNode === null) {
            const nextNode = getMinUnvisitedNode();

            if (nextNode === -1 || dist[nextNode] === Infinity) {
                highlightPseudo(13, "pseudo-done");
                dijkstraFinished = true;
                isPlaying = false;
                comparingIndex = null;
                swappingIndex = null;
                activeNeighbor = null;
                drawVisualization();
                return;
            }

            currentNode = nextNode;
            neighborIndex = 0;
            activeNeighbor = null;
            swappingIndex = null;
            comparingIndex = currentNode;
            highlightPseudo(7, "pseudo-compare");

            drawVisualization();
            if (isPlaying) timeoutId = setTimeout(dijkstraStep, speed);
            return;
        }

        if (neighborIndex < n) {
            const v = neighborIndex;
            const edgeWeight = matrixData[currentNode][v];
            activeNeighbor = v;
            swappingIndex = null;
            highlightPseudo(9, "pseudo-compare");

            if (!visited[v] && edgeWeight > 0) {
                const candidateDistance = dist[currentNode] + edgeWeight;
                if (candidateDistance < dist[v]) {
                    dist[v] = candidateDistance;
                    swappingIndex = v;
                    highlightPseudo(10, "pseudo-swap");
                }
            }

            neighborIndex++;
            drawVisualization();
            if (isPlaying) timeoutId = setTimeout(dijkstraStep, speed);
            return;
        }

        visited[currentNode] = true;
        highlightPseudo(13, "pseudo-done");

        currentNode = null;
        neighborIndex = 0;
        comparingIndex = null;
        activeNeighbor = null;
        swappingIndex = null;

        if (visited.every((nodeVisited) => nodeVisited)) {
            dijkstraFinished = true;
            isPlaying = false;
        }

        drawVisualization();
        if (isPlaying) timeoutId = setTimeout(dijkstraStep, speed);
    }
    function dfsStep() {
        if (dfsFinished) {
            isPlaying = false;
            drawVisualization();
            return;
        }

        if (dfsStack.length === 0) {
            dfsFinished = true;
            dfsCurrent = null;
            dfsCurrentNeighbor = null;
            dfsActiveEdge = null;
            highlightPseudo(11, "pseudo-done");
            isPlaying = false;
            drawVisualization();
            return;
        }

        const frame = dfsStack[dfsStack.length - 1];
        dfsCurrent = frame.node;

        if (!dfsVisited[frame.node]) {
            dfsVisited[frame.node] = true;
            dfsTraversalOrder.push(frame.node);
            highlightPseudo(5, "pseudo-done");
            drawVisualization();
            if (isPlaying) timeoutId = setTimeout(dfsStep, speed);
            return;
        }

        const neighbors = dfsTree.adjacency[frame.node];
        if (frame.nextNeighborIndex < neighbors.length) {
            const neighbor = neighbors[frame.nextNeighborIndex];
            frame.nextNeighborIndex += 1;
            dfsCurrentNeighbor = neighbor;
            dfsActiveEdge = { source: frame.node, target: neighbor };
            highlightPseudo(6, "pseudo-compare");

            if (!dfsVisited[neighbor]) {
                dfsTraversedEdges.push(getDFSEdgeKey(frame.node, neighbor));
                highlightPseudo(8, "pseudo-swap");
                dfsStack.push({ node: neighbor, parent: frame.node, nextNeighborIndex: 0 });
            }

            drawVisualization();
            if (isPlaying) timeoutId = setTimeout(dfsStep, speed);
            return;
        }

        dfsStack.pop();
        dfsCurrentNeighbor = frame.parent;
        dfsActiveEdge = frame.parent !== null ? { source: frame.parent, target: frame.node } : null;

        if (dfsStack.length === 0) {
            dfsFinished = true;
            dfsCurrent = null;
            dfsCurrentNeighbor = null;
            dfsActiveEdge = null;
            highlightPseudo(11, "pseudo-done");
            isPlaying = false;
        } else {
            dfsCurrent = dfsStack[dfsStack.length - 1].node;
            highlightPseudo(10, "pseudo-done");
        }

        drawVisualization();
        if (isPlaying) timeoutId = setTimeout(dfsStep, speed);
    }

    function initializeLinearTarget() {
        if (searchTarget !== null) return true;

        let value = parseInt(searchInput.value, 10);
        if (Number.isNaN(value)) {
            alert("Please enter a value between 1 and 100.");
            return false;
        }

        if (value < 1) value = 1;
        if (value > 100) value = 100;

        searchTarget = value;
        return true;
    }

    function initializeDijkstraSource() {
        if (sourceIndex !== null) return true;

        const parsedIndex = parseSourceNodeLabel(searchInput.value);
        if (parsedIndex === -1) {
            alert(`Please enter a source node letter from A to ${getNodeLabel(matrixSize - 1)}.`);
            return false;
        }

        sourceIndex = parsedIndex;
        dist[sourceIndex] = 0;
        searchInput.value = getNodeLabel(sourceIndex);
        highlightPseudo(5, "pseudo-compare");
        drawVisualization();
        return true;
    }

    function resetSharedState() {
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
        clearPseudoHighlight();
    }

    function reset() {
        resetSharedState();
        clearPseudoHighlight();

        if (algorithmSelect.value === "dijkstra") {
            matrixData = deepCopyMatrix(originalMatrix);
            resetDijkstraState();
        } else if (algorithmSelect.value === "dfs") {
            resetDFSState();
        } else {
            data = [...originalData];
        }

        searchInput.value = "";
        drawVisualization();
    }

    function generateNewData() {
        resetSharedState();
        clearPseudoHighlight();

        if (algorithmSelect.value === "dijkstra") {
            matrixData = generateMatrixData(matrixSize);
            originalMatrix = deepCopyMatrix(matrixData);
            resetDijkstraState();
        } else if (algorithmSelect.value === "dfs") {
            dfsTree = generateDFSTree(dfsNodeCount);
            resetDFSState();
        } else {
            originalData = generateData();
            data = [...originalData];
        }

        searchInput.value = "";
        drawVisualization();
    }

    function applyAlgorithmMode() {
        document.getElementById("edge-editor").style.display = "none";
        clearPseudoHighlight();
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

        setAlgorithmHeader();

        if (algorithmSelect.value === "bubble") {
            renderPseudocode(bubblePseudo);
            searchContainer.style.display = "none";
            searchInput.value = "";
            drawVisualization();
            return;
        }

        if (algorithmSelect.value === "linear") {
            renderPseudocode(linearPseudo);
            searchContainer.style.display = "flex";
            searchInputLabel.textContent = "Search Value:";
            searchInput.type = "number";
            searchInput.min = "1";
            searchInput.max = "100";
            searchInput.placeholder = "1 - 100";
            drawVisualization();
            return;
        }

        if (algorithmSelect.value === "dfs") {
            renderPseudocode(dfsPseudo);
            searchContainer.style.display = "flex";
            searchInputLabel.textContent = `Start Node (A-${getNodeLabel(dfsNodeCount - 1)}):`;
            searchInput.type = "text";
            searchInput.removeAttribute("min");
            searchInput.removeAttribute("max");
            searchInput.placeholder = `A - ${getNodeLabel(dfsNodeCount - 1)}`;

            if (!dfsTree) {
                dfsTree = generateDFSTree(dfsNodeCount);
            }

            resetDFSState();
            drawVisualization();
            return;
        }

        renderPseudocode(dijkstraPseudo);
        searchContainer.style.display = "flex";
        searchInputLabel.textContent = `Source Node (A-${getNodeLabel(matrixSize - 1)}):`;
        searchInput.type = "text";
        searchInput.removeAttribute("min");
        searchInput.removeAttribute("max");
        searchInput.placeholder = `A - ${getNodeLabel(matrixSize - 1)}`;

        if (!matrixData.length) {
            matrixData = generateMatrixData(matrixSize);
            originalMatrix = deepCopyMatrix(matrixData);
        }

        resetDijkstraState();
        drawVisualization();
    }

    resetBtn.addEventListener("click", reset);
    newDataBtn.addEventListener("click", generateNewData);
    algorithmSelect.addEventListener("change", applyAlgorithmMode);

    document.getElementById("apply-edge-btn").addEventListener("click", function () {
        const editor = document.getElementById("edge-editor");
    
        const row = parseInt(editor.dataset.row, 10);
        const col = parseInt(editor.dataset.col, 10);
    
        let value = parseInt(document.getElementById("edge-weight").value, 10);
    
        if (Number.isNaN(value) || value < 0 || value > 99) {
            alert("Enter weight 0–99");
            return;
        }
    
        matrixData[row][col] = value;
        matrixData[col][row] = value;
    
        originalMatrix[row][col] = value;
        originalMatrix[col][row] = value;
    
        resetDijkstraState();
        drawVisualization();
    
        editor.style.display = "none";
    });

    startBtn.addEventListener("click", function () {
        if (isPlaying) return;

        if (algorithmSelect.value === "dfs") {
            if (!initializeDFS()) return;
            isPlaying = true;
            dfsStep();
            return;
        }
        if (algorithmSelect.value === "bubble") {
            isPlaying = true;
            bubbleStep();
            return;
        }

        if (algorithmSelect.value === "linear") {
            if (!initializeLinearTarget()) return;

            isPlaying = true;
            if (foundIndex === null && searchIndex >= data.length) {
                searchIndex = 0;
                checkedIndices = [];
                comparingIndex = null;
            }
            linearStep();
            return;
        }

        if (!initializeDijkstraSource()) return;
        isPlaying = true;
        dijkstraStep();
    });

    pauseBtn.addEventListener("click", function () {
        isPlaying = false;
        clearTimeout(timeoutId);
    });

    stepBtn.addEventListener("click", function () {
        clearTimeout(timeoutId);
        isPlaying = false;

        if (algorithmSelect.value === "dfs") {
            if (!initializeDFS()) return;
            dfsStep();
            return;
        }
        if (algorithmSelect.value === "bubble") {
            bubbleStep();
            return;
        }

        if (algorithmSelect.value === "linear") {
            if (!initializeLinearTarget()) return;
            linearStep();
            return;
        }

        if (!initializeDijkstraSource()) return;
        dijkstraStep();
    });

    renderPseudocode(bubblePseudo);
    setAlgorithmHeader();
    searchContainer.style.display = "none";

    originalData = generateData();
    data = [...originalData];

    matrixData = generateMatrixData(matrixSize);
    originalMatrix = deepCopyMatrix(matrixData);
    dfsTree = generateDFSTree(dfsNodeCount);
    resetDijkstraState();
    resetDFSState();

    drawVisualization();
});
