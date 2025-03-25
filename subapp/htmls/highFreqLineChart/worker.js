importScripts("spectrum.js");

let startIdx = 0;
let endIdx = 0;
let inputSize = 0;
let gridWidth = 0;
let gridHeight = 0;
let isDragging = false;
let dragStartX = 0;
let selectionStartX = null;
let lastMouseXRel = -1;
let lastMouseYRel = -1;
let lastMouseOffsetX = 0;
let lastMouseOffsetY = 0;
const minRange = 10;
let maxRange = 0;
const numLines = 4;
let colors = null;
let visibility = null;
let updateCount = 0;
let maxData = null;
let minData = null;
let avgData = null;

// 生成实时数据并增量更新统计值
function generateExternalData(size) {
  const data = new Float32Array(size * numLines);
  const realTimeData = new Float32Array(size);

  if (updateCount === 0) {
    maxData = new Float32Array(size);
    minData = new Float32Array(size);
    avgData = new Float32Array(size);
  }

  for (let i = 0; i < size; i++) {
    realTimeData[i] =
      Math.sin(i * 0.01 + Date.now() * 0.001) + Math.random() * 0.2 - 0.1;
    data[i] = realTimeData[i];
  }

  for (let i = 0; i < size; i++) {
    if (updateCount === 0) {
      maxData[i] = realTimeData[i];
      minData[i] = realTimeData[i];
      avgData[i] = realTimeData[i];
    } else {
      maxData[i] = Math.max(maxData[i], realTimeData[i]);
      minData[i] = Math.min(minData[i], realTimeData[i]);
      avgData[i] =
        (avgData[i] * updateCount + realTimeData[i]) / (updateCount + 1);
    }
    data[size + i] = maxData[i];
    data[2 * size + i] = minData[i];
    data[3 * size + i] = avgData[i];
  }
  updateCount++;
  return data;
}

// 更新提示框内容
function updateTooltip(xRel, yRel, offsetX, offsetY) {
  if (xRel >= 0 && xRel < gridWidth && yRel >= 0 && yRel < gridHeight) {
    const dataPtr = Module._getLastData();
    const dataArray = new Float32Array(
      Module.HEAPF32.buffer,
      dataPtr,
      inputSize * numLines
    );
    const range = endIdx - startIdx + 1;
    const xScale = range / gridWidth;
    const index = Math.floor(startIdx + xRel * xScale);
    const yMin = -1.5;
    const yMax = 1.5;
    const yScale = gridHeight / (yMax - yMin);
    const yValue = yMin + (gridHeight - yRel) / yScale;

    let tooltipText = `X: ${index}<br>`;
    const lineNames = ["Real-time", "Max", "Min", "Avg"];
    for (let l = 0; l < numLines; l++) {
      if (visibility[l]) {
        const value = dataArray[l * inputSize + index];
        tooltipText += `${lineNames[l]} (${colors[l * 3]},${
          colors[l * 3 + 1]
        },${colors[l * 3 + 2]}): ${value.toFixed(4)}<br>`;
      }
    }
    tooltipText += `Y: ${yValue.toFixed(4)}`;
    postMessage({
      type: "tooltip",
      data: { x: offsetX, y: offsetY, text: tooltipText },
    });
  } else {
    postMessage({ type: "tooltipHide" });
  }
}

// 更新图像并同步线的显示状态
function updateChart() {
  const externalData = generateExternalData(inputSize);
  const inputPtr = Module._malloc(inputSize * numLines * 4);
  Module.HEAPF32.set(externalData, inputPtr / 4);
  const colorsPtr = Module._malloc(colors.length);
  Module.HEAPU8.set(colors, colorsPtr);

  // 在绘制前更新线的显示状态
  const visibilityPtr = Module._malloc(numLines);
  Module.HEAPU8.set(
    new Uint8Array(visibility.map((v) => (v ? 1 : 0))),
    visibilityPtr
  );
  Module._setLineVisibility(visibilityPtr, numLines);

  const pixelPtr = Module._drawSpectrum(
    inputPtr,
    inputSize,
    numLines,
    gridWidth,
    gridHeight,
    startIdx,
    endIdx,
    colorsPtr
  );
  const byteLength = gridWidth * gridHeight * 4;
  const pixelData = new Uint8ClampedArray(
    Module.HEAPU8.buffer,
    pixelPtr,
    byteLength
  );

  const transferableBuffer = pixelData.buffer.slice(
    pixelPtr,
    pixelPtr + byteLength
  );
  const transferableData = new Uint8ClampedArray(transferableBuffer);

  postMessage(
    {
      type: "image",
      data: { pixels: transferableData, startIdx: startIdx, endIdx: endIdx },
    },
    [transferableBuffer]
  );

  if (
    lastMouseXRel >= 0 &&
    lastMouseXRel < gridWidth &&
    lastMouseYRel >= 0 &&
    lastMouseYRel < gridHeight
  ) {
    updateTooltip(
      lastMouseXRel,
      lastMouseYRel,
      lastMouseOffsetX,
      lastMouseOffsetY
    );
  }

  Module._free(inputPtr);
  Module._free(colorsPtr);
  Module._free(visibilityPtr);
}

Module.onRuntimeInitialized = () => {
  postMessage({ type: "ready" });

  self.onmessage = (e) => {
    if (!e.data || !e.data.type) {
      console.error("Invalid message received:", e.data);
      return;
    }

    const type = e.data.type;
    const data = e.data;

    if (type === "init") {
      gridWidth = data.width;
      gridHeight = data.height;
      inputSize = data.inputSize;
      endIdx = inputSize - 1;
      maxRange = inputSize;
      colors = new Uint8Array(data.colors);
      visibility = data.visibility.slice();
      setInterval(updateChart, 50);
    } else if (type === "updateVisibility") {
      visibility = data.visibility.slice(); // 更新本地 visibility，等待 updateChart 同步
    } else if (type === "mousewheel") {
      const delta = data.wheelDelta > 0 ? -1 : 1;
      const range = endIdx - startIdx + 1;
      const zoomStep = Math.floor(range * 0.1 * delta);
      const center = Math.floor((startIdx + endIdx) / 2);
      let newRange = range + zoomStep;
      let newStart = center - Math.floor(newRange / 2);
      let newEnd = center + Math.floor(newRange / 2);

      if (delta > 0 && newRange < minRange) {
        newRange = minRange;
        newStart = center - Math.floor(minRange / 2);
        newEnd = center + Math.floor(minRange / 2);
      }
      if (delta < 0 && newRange > maxRange) {
        newRange = maxRange;
        newStart = 0;
        newEnd = maxRange - 1;
      }
      newStart = Math.max(0, newStart);
      newEnd = Math.min(inputSize - 1, newEnd);
      if (newEnd - newStart + 1 < minRange) {
        newStart = center - Math.floor(minRange / 2);
        newEnd = center + Math.floor(minRange / 2);
        newStart = Math.max(0, newStart);
        newEnd = Math.min(inputSize - 1, newEnd);
      }
      startIdx = newStart;
      endIdx = newEnd;
    } else if (type === "mousedown") {
      if (data.button === 0 && selectionStartX === null) {
        isDragging = true;
        dragStartX = data.offsetX - 60;
      } else if (data.button === 0 || data.button === 2) {
        selectionStartX = data.offsetX;
      }
    } else if (type === "mousemove") {
      if (
        !data ||
        typeof data.xRel === "undefined" ||
        typeof data.yRel === "undefined"
      ) {
        console.error("Invalid mousemove data:", data);
        return;
      }
      const xRel = data.xRel;
      const yRel = data.yRel;
      lastMouseXRel = xRel;
      lastMouseYRel = yRel;
      lastMouseOffsetX = data.offsetX;
      lastMouseOffsetY = data.offsetY;

      if (isDragging && xRel >= 0 && xRel < data.gridWidth) {
        const range = endIdx - startIdx + 1;
        const xScale = range / data.gridWidth;
        const deltaX = Math.floor((dragStartX - xRel) * xScale);
        startIdx = Math.max(0, Math.min(inputSize - range, startIdx + deltaX));
        endIdx = startIdx + range - 1;
        dragStartX = xRel;
      }
      updateTooltip(xRel, yRel, data.offsetX, data.offsetY);
    } else if (type === "mouseup") {
      if (isDragging) {
        isDragging = false;
      } else if (selectionStartX !== null) {
        const xStart = Math.min(selectionStartX, data.offsetX) - 60;
        const xEnd = Math.max(selectionStartX, data.offsetX) - 60;
        const range = endIdx - startIdx + 1;
        const xScale = range / gridWidth;
        if (xEnd > xStart) {
          const newStart = Math.floor(startIdx + xStart * xScale);
          const newEnd = Math.floor(startIdx + xEnd * xScale);
          if (data.button === 0) {
            if (newEnd - newStart + 1 >= minRange) {
              startIdx = Math.max(0, newStart);
              endIdx = Math.min(inputSize - 1, newEnd);
            }
          } else if (data.button === 2) {
            const zoomFactor = range / (newEnd - newStart);
            const center = (startIdx + endIdx) / 2;
            const newRange = Math.floor(range * zoomFactor);
            if (newRange <= maxRange) {
              startIdx = Math.max(0, Math.floor(center - newRange / 2));
              endIdx = Math.min(
                inputSize - 1,
                Math.floor(center + newRange / 2)
              );
            }
          }
          if (endIdx - startIdx + 1 < minRange) {
            const center = (startIdx + endIdx) / 2;
            startIdx = Math.max(0, Math.floor(center - minRange / 2));
            endIdx = Math.min(inputSize - 1, Math.floor(center + minRange / 2));
          }
          if (endIdx - startIdx + 1 > maxRange) {
            startIdx = 0;
            endIdx = maxRange - 1;
          }
        }
        selectionStartX = null;
      }
    } else if (type === "mouseout") {
      isDragging = false;
      selectionStartX = null;
      lastMouseXRel = -1;
      lastMouseYRel = -1;
      postMessage({ type: "tooltipHide" });
    }
  };
};
