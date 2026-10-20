(function () {
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');


    const CIRCLE_RADIUS = 38;
    const INNER_OFFSET = 6;
    const LINE_WIDTH = 1.5;
    const CIRCLE_COLOR = 'rgba(121, 157, 171, 0.4)';

    const CONNECT_COLOR = 'rgba(121, 157, 171, 0.4)';
    const CONNECT_LINE_WIDTH = 1.5;
    const CONNECT_GAP = 8;   

    const MIN_NEIGHBORS = 2;
    const MAX_NEIGHBORS = 5;

    const MIN_DISTANCE = 300;
    const MAX_CONNECT_DIST = 450;
    const DENSITY_DIVISOR = 9000;
    const MAX_PLACEMENT_ATTEMPTS = 30;

    let dpr = window.devicePixelRatio || 1;

    function resizeCanvas() {
        dpr = window.devicePixelRatio || 1;
        const w = window.innerWidth;
        const h = document.documentElement.scrollHeight;
    
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
    
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
    
        drawPattern(w, h);
    }

    function generatePoints(w, h) {
        const points = [];
        const targetCount = Math.floor((w * h) / DENSITY_DIVISOR);

        const cellSize = MIN_DISTANCE;
        const gridCols = Math.ceil(w / cellSize);
        const gridRows = Math.ceil(h / cellSize);
        const grid = new Array(gridCols * gridRows);

        function gridIndex(x, y) {
            const gx = Math.floor(x / cellSize);
            const gy = Math.floor(y / cellSize);
            return { gx, gy };
        }

        function isFarEnough(x, y) {
            const { gx, gy } = gridIndex(x, y);
            for (let ny = gy - 2; ny <= gy + 2; ny++) {
                for (let nx = gx - 2; nx <= gx + 2; nx++) {
                    if (nx < 0 || ny < 0 || nx >= gridCols || ny >= gridRows) continue;
                    const cell = grid[ny * gridCols + nx];
                    if (!cell) continue;
                    for (const p of cell) {
                        const dx = p.x - x;
                        const dy = p.y - y;
                        if (Math.sqrt(dx * dx + dy * dy) < MIN_DISTANCE) {
                            return false;
                        }
                    }
                }
            }
            return true;
        }

        function addPoint(x, y) {
            points.push({ x, y });
            const { gx, gy } = gridIndex(x, y);
            const key = gy * gridCols + gx;
            if (!grid[key]) grid[key] = [];
            grid[key].push({ x, y });
        }

        let attempts = 0;
        const maxTotalAttempts = targetCount * MAX_PLACEMENT_ATTEMPTS;

        while (points.length < targetCount && attempts < maxTotalAttempts) {
            const x = Math.random() * w;
            const y = Math.random() * h;

            if (isFarEnough(x, y)) {
                addPoint(x, y);
            }
            attempts++;
        }

        return points;
    }


    function findNearestNeighbors(points, index, count) {
        const p = points[index];
        const distances = [];

        for (let i = 0; i < points.length; i++) {
            if (i === index) continue;
            const other = points[i];
            const dx = other.x - p.x;
            const dy = other.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= MAX_CONNECT_DIST) {
                distances.push({ index: i, dist });
            }
        }

        distances.sort((a, b) => a.dist - b.dist);
        return distances.slice(0, count).map(d => d.index);
    }


    function buildConnections(points) {
        const connections = new Set();

        for (let i = 0; i < points.length; i++) {
            const neighborCount = MIN_NEIGHBORS +
                Math.floor(Math.random() * (MAX_NEIGHBORS - MIN_NEIGHBORS + 1));

            const neighbors = findNearestNeighbors(points, i, neighborCount);

            neighbors.forEach(j => {
                const key = i < j ? `${i}-${j}` : `${j}-${i}`;
                connections.add(key);
            });
        }

        return Array.from(connections).map(key => {
            const [a, b] = key.split('-').map(Number);
            return { a, b };
        });
    }

    function drawCircle(cx, cy) {
        ctx.beginPath();
        ctx.arc(cx, cy, CIRCLE_RADIUS, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, CIRCLE_RADIUS - INNER_OFFSET, 0, Math.PI * 2);
        ctx.stroke();
    }


    function drawHollowConnection(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

  
        if (dist <= CIRCLE_RADIUS * 2) return;

        const ux = dx / dist; 
        const uy = dy / dist;

    
        const startX = p1.x + ux * CIRCLE_RADIUS;
        const startY = p1.y + uy * CIRCLE_RADIUS;
        const endX = p2.x - ux * CIRCLE_RADIUS;
        const endY = p2.y - uy * CIRCLE_RADIUS;


        const px = -uy;
        const py = ux;
        const offset = CONNECT_GAP / 2;

        ctx.beginPath();
        ctx.moveTo(startX + px * offset, startY + py * offset);
        ctx.lineTo(endX + px * offset, endY + py * offset);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(startX - px * offset, startY - py * offset);
        ctx.lineTo(endX - px * offset, endY - py * offset);
        ctx.stroke();
    }

    function drawPattern(w, h) {
        ctx.clearRect(0, 0, w, h);

        const points = generatePoints(w, h);
        const connections = buildConnections(points);

        ctx.strokeStyle = CONNECT_COLOR;
        ctx.lineWidth = CONNECT_LINE_WIDTH;
        connections.forEach(({ a, b }) => {
            drawHollowConnection(points[a], points[b]);
        });

        ctx.strokeStyle = CIRCLE_COLOR;
        ctx.lineWidth = LINE_WIDTH;
        points.forEach(p => drawCircle(p.x, p.y));
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
})();