const svg = document.querySelector('#logo')

const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path')
const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path')
const path3 = document.createElementNS('http://www.w3.org/2000/svg', 'path')

const strokeWidth = 10
const amplitude = 30

let paths = [
    {
        points: [{x:0, y:160}, {x:0, y:0}, {x:250, y:0}],
        color: '#F8C535'
    },
    {
        points: [{x:265, y:0}, {x:330, y:0}, {x:330, y:190}],
        color: '#EA3B2B'
    },
    {
        points: [{x:0, y:175}, {x:0, y:290}, {x:330, y:290}, {x: 330, y:215}],
        color: '#5176B6'
    }
]

paths.forEach(path => {
    path.elem = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.elem.setAttribute('d', pathString(path.points, "rough"))
    path.elem.setAttribute('fill', 'none')
    path.elem.setAttribute('stroke', path.color)
    path.elem.setAttribute('stroke-width', strokeWidth)
    svg.appendChild(path.elem)
})

function interpolatePoints(startingPoints, endingPoints, t) {
    if (startingPoints.length !== endingPoints.length) throw Error('point number mismatch')

    return startingPoints.map((sp, i) => { const ep = endingPoints[i]; return {x:sp.x + t * (ep.x - sp.x), y:sp.y + t * (ep.y - sp.y)} })
}

function getPaths(anchorPoints, style) {
    let startingPoints = []
    let endingPoints = []

    for (let i = 1; i < anchorPoints.length; i++) {
        let apStart = anchorPoints[i-1]
        let apEnd = anchorPoints[i]

        let slopeX = apEnd.x - apStart.x
        let slopeY = apEnd.y - apStart.y
        let lineLength = Math.sqrt(slopeX**2 + slopeY**2)
        
        slopeX /= lineLength
        slopeY /= lineLength

        let normX = -slopeY 
        let normY = slopeX 

        if (style === "rough") {
            let nSplitPoints = Math.floor(Math.random() * 3 + 2)
            for (let n = 0; n < nSplitPoints; n++) {
                let startSplitPoint = interpolatePoints([apStart], [apEnd], n/nSplitPoints)[0]
                let length = 0
                if (n > 0) length = 2*amplitude * Math.random() - amplitude
                    
                let dx = length * normX
                let dy = length * normY
                startingPoints.push(startSplitPoint)
                endingPoints.push({x: startSplitPoint.x + dx, y: startSplitPoint.y + dy})
            }
        }

        if (style === "smooth") {
            startingPoints.push(apStart)
            endingPoints.push(apStart)

            startingPoints.push({x: apStart.x + slopeX * lineLength / 3, y: apStart.y + slopeY * lineLength / 3})
            endingPoints.push({x: apStart.x + lineLength / 3 * Math.random(), y: apStart.y + lineLength / 3 * Math.random()})

            startingPoints.push({x: apEnd.x - slopeX * lineLength / 3, y: apStart.y - slopeY * lineLength / 3})
            endingPoints.push({x: apEnd.x - lineLength / 3 * Math.random(), y: apEnd.y - lineLength / 3 * Math.random()})
        }
    }
    startingPoints.push(anchorPoints[anchorPoints.length-1])
    endingPoints.push(anchorPoints[anchorPoints.length-1])
    return {starting:startingPoints, ending:endingPoints}
}

function pathString(pts, style) {
    let outString = `M${pts[0].x} ${pts[0].y}`
    if (style === "rough") {
        for (let i = 1; i < pts.length; i++) {
            outString += `L${pts[i].x} ${pts[i].y}`
        }
    }
    if (style === "smooth") {
        for (let i = 1; i < pts.length - 1; i += 3) {
            outString += `C${pts[i].x} ${pts[i].y} ${pts[i+1].x} ${pts[i+1].y} ${pts[i+2].x} ${pts[i+2].y}`
        }
    }
    return outString
}

function easeInOutQuad(x) {
    return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

function animatePath(anchorPoints, style, elem) {
    let paths = getPaths(anchorPoints,style)
    
    let start, previousTimeStamp
    let done = false
    let durations = [500, 1000, 100]

    function step(timestamp) {
        if (start === undefined) {
            start = timestamp
        }
        const elapsed = timestamp - start

        if (previousTimeStamp !== timestamp) {
            if (elapsed < durations[0]) {
                const t = Math.min(elapsed/durations[0], 1)
                let path = pathString(interpolatePoints(paths.starting, paths.ending, easeInOutQuad(t)), style)
                elem.setAttribute('d', path)
            } else if (elapsed > durations[0] + durations[1]) {
                const t = Math.max(1 - (elapsed - durations[0] - durations[1])/durations[2], 0)
                let path = pathString(interpolatePoints(paths.starting, paths.ending, easeInOutQuad(t)), style)
                elem.setAttribute('d', path)
                if (t === 0) done = true
            }
        }

        if (elapsed < durations[0] + durations[1] + durations[2]) {
            previousTimeStamp = timestamp
            if (!done) {
                window.requestAnimationFrame(step);
            }
        }
    }
    window.requestAnimationFrame(step)
}

function animate() {

    paths.forEach(path => {
        let randomPicker = Math.random()
        if (randomPicker >= 1/3 && randomPicker < 2/3) {
            animatePath(path.points, "smooth", path.elem)
        } else if (randomPicker >= 2/3) {
            animatePath(path.points, "rough", path.elem)
        }
        
    })
}

animate()
setInterval(() => animate(), 3000)