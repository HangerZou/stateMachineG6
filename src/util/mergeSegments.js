export function mergeHorizontalSegments(segments) {
    if (segments.length === 0) return [];

    // 将线段按 y 坐标起始点排序
    segments.sort((a, b) => a[1] - b[1]);

    const merged = [];
    let [currentStartX, currentStartY, currentEndX, currentEndY] = segments[0];

    for (let i = 1; i < segments.length; i++) {
        const [nextStartX, nextStartY, nextEndX, nextEndY] = segments[i];

        // 如果当前线段和下一个线段在 y 坐标上连续或有重叠，合并线段
        if (currentEndY >= nextStartY - Number.EPSILON) {
            currentEndY = Math.max(currentEndY, nextEndY);
        } else {
            // 否则，保存当前合并的线段，并更新当前线段为下一个线段
            merged.push([currentStartX, currentStartY, currentEndX, currentEndY]);
            [currentStartX, currentStartY, currentEndX, currentEndY] = [nextStartX, nextStartY, nextEndX, nextEndY];
        }
    }

    // 添加最后一个线段
    merged.push([currentStartX, currentStartY, currentEndX, currentEndY]);

    return merged;
}

// 示例使用
let horizontalSegments = [
    [-10, 37.5, -10, 107.5],
    [160, 37.5, 160, 107.5],
    [190, 37.5, 190, 107.5],
    [360, 37.5, 360, 107.5],
    [390, -6.25, 390, 63.75],
    [390, 81.25, 390, 151.25],
    [560, -6.25, 560, 63.75],
    [590, 37.5, 590, 107.5],
    [760, 37.5, 760, 107.5]
];

let mergedHorizontal = mergeHorizontalSegments(horizontalSegments);

console.log("水平线段并集: ", mergedHorizontal);

export function mergeVerticalSegments(segments) {
    if (segments.length === 0) return [];

    // 将线段按 x 坐标起始点排序
    segments.sort((a, b) => a[0] - b[0]);

    const merged = [];
    let [currentStartX, currentStartY, currentEndX, currentEndY] = segments[0];

    for (let i = 1; i < segments.length; i++) {
        const [nextStartX, nextStartY, nextEndX, nextEndY] = segments[i];

        // 如果当前线段和下一个线段在 x 坐标上连续或有重叠，合并线段
        if (currentEndX >= nextStartX - Number.EPSILON) {
            currentEndX = Math.max(currentEndX, nextEndX);
        } else {
            // 否则，保存当前合并的线段，并更新当前线段为下一个线段
            merged.push([currentStartX, currentStartY, currentEndX, currentEndY]);
            [currentStartX, currentStartY, currentEndX, currentEndY] = [nextStartX, nextStartY, nextEndX, nextEndY];
        }
    }

    // 添加最后一个线段
    merged.push([currentStartX, currentStartY, currentEndX, currentEndY]);

    return merged;
}

// 示例使用
let verticalSegments = [
    [37.5, -10, 107.5, -10],
    [37.5, 160, 107.5, 160],
    [37.5, 190, 107.5, 190],
    [37.5, 360, 107.5, 360],
    [-6.25, 390, 63.75, 390],
    [81.25, 390, 151.25, 390],
    [-6.25, 560, 63.75, 560],
    [37.5, 590, 107.5, 590],
    [37.5, 760, 107.5, 760]
];

let mergedVertical = mergeVerticalSegments(verticalSegments);

console.log("垂直线段并集: ", mergedVertical);
