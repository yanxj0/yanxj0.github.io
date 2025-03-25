importScripts('spectrum.js') // 导入编译后的 Wasm 模块
importScripts('/statics/data/RollHeatmapData.js')

// Worker 全局变量
let startIdx = 0 // 当前显示范围的起始索引
let endIdx = 0 // 当前显示范围的结束索引
let inputSize = 0 // 输入数据长度
let gridWidth = 0 // 图表网格宽度
let gridHeight = 0 // 图表网格高度
let isDragging = false // 是否正在拖动
let dragStartX = 0 // 拖动起始 X 坐标
let selectionStartX = null // 选择框起始 X 坐标
let lastMouseXRel = -1 // 上次鼠标相对 X 坐标
let lastMouseYRel = -1 // 上次鼠标相对 Y 坐标
let lastMouseOffsetX = 0 // 上次鼠标绝对 X 坐标
let lastMouseOffsetY = 0 // 上次鼠标绝对 Y 坐标
const minRange = 10 // 最小显示范围
let maxRange = 0 // 最大显示范围
const numLines = 4 // 折线数量（固定为 4）
let colors = null // 线条颜色数组
let visibility = null // 线的显示状态数组
let bgColor = null // 背景色数组 (RGBA)
let yMin = -1.5 // Y 轴最小值
let yMax = 1.5 // Y 轴最大值
let updateCount = 0 // 数据更新次数
let maxData = null // 历史最大值数组
let minData = null // 历史最小值数组
let avgData = null // 历史平均值数组

// 生成实时数据并增量更新统计值
// 参数：
// - size: 数据长度
// 返回值：包含 4 条线的 Float32Array（实时、最大、最小、平均）
function generateExternalData(size) {
  if (updateCount === source.length) {
    updateCount = 0
  }

  const data = new Float32Array(size * numLines) // 分配数据缓冲区
  const realTimeData = new Float32Array(size) // 当前帧实时数据

  let currentSource = source[updateCount]

  // 初始化统计数组（第一帧）
  if (updateCount === 0) {
    maxData = new Float32Array(size)
    minData = new Float32Array(size)
    avgData = new Float32Array(size)
  }

  // 生成当前帧的实时数据
  for (let i = 0; i < size; i++) {
    /* realTimeData[i] =
      Math.sin(i * 0.01 + Date.now() * 0.001) + Math.random() * 0.2 - 0.1; */
    realTimeData[i] = currentSource[i] / 10
    data[i] = realTimeData[i] // 第一条线：实时数据
  }

  // 增量更新统计值
  for (let i = 0; i < size; i++) {
    if (updateCount === 0) {
      maxData[i] = realTimeData[i]
      minData[i] = realTimeData[i]
      avgData[i] = realTimeData[i]
    } else {
      maxData[i] = Math.max(maxData[i], realTimeData[i]) // 更新最大值
      minData[i] = Math.min(minData[i], realTimeData[i]) // 更新最小值
      avgData[i] = (avgData[i] * updateCount + realTimeData[i]) / (updateCount + 1) // 更新平均值
    }
    data[size + i] = maxData[i] // 第二条线：最大值
    data[2 * size + i] = minData[i] // 第三条线：最小值
    data[3 * size + i] = avgData[i] // 第四条线：平均值
  }
  updateCount++ // 增加更新计数
  return data
}

// 更新提示框内容
// 参数：
// - xRel: 鼠标相对 X 坐标（网格内）
// - yRel: 鼠标相对 Y 坐标（网格内）
// - offsetX: 鼠标绝对 X 坐标（屏幕上）
// - offsetY: 鼠标绝对 Y 坐标（屏幕上）
function updateTooltip(xRel, yRel, offsetX, offsetY) {
  if (xRel >= 0 && xRel < gridWidth && yRel >= 0 && yRel < gridHeight) {
    const dataPtr = Module._getLastData() // 获取最近一次绘制的数据
    const dataArray = new Float32Array(Module.HEAPF32.buffer, dataPtr, inputSize * numLines)
    const range = endIdx - startIdx + 1 // 当前显示范围大小
    const xScale = range / gridWidth // X 轴缩放比例
    const index = Math.floor(startIdx + xRel * xScale) // 计算鼠标对应的数据索引
    const yScale = gridHeight / (yMax - yMin) // Y 轴缩放比例
    const yValue = yMin + (gridHeight - yRel) / yScale // 计算鼠标对应的 Y 值

    let tooltipText = `X: ${index}<br>` // 提示框内容
    const lineNames = ['Real-time', 'Max', 'Min', 'Avg']
    for (let l = 0; l < numLines; l++) {
      if (visibility[l]) {
        // 只显示可见的线
        const value = dataArray[l * inputSize + index]
        tooltipText += `${lineNames[l]} (${colors[l * 3]},${
          colors[l * 3 + 1]
        },${colors[l * 3 + 2]}): ${value.toFixed(4)}<br>`
      }
    }
    tooltipText += `Y: ${yValue.toFixed(4)}`
    postMessage({
      type: 'tooltip',
      data: { x: offsetX, y: offsetY, text: tooltipText }
    })
  } else {
    postMessage({ type: 'tooltipHide' }) // 鼠标移出网格时隐藏提示框
  }
}

// 更新图表并绘制
function updateChart() {
  const externalData = generateExternalData(inputSize) // 生成数据
  const inputPtr = Module._malloc(inputSize * numLines * 4) // 分配输入数据内存
  Module.HEAPF32.set(externalData, inputPtr / 4) // 将数据写入 Wasm 内存
  const colorsPtr = Module._malloc(colors.length) // 分配颜色数组内存
  Module.HEAPU8.set(colors, colorsPtr) // 将颜色写入 Wasm 内存

  // 更新线的显示状态
  const visibilityPtr = Module._malloc(numLines)
  Module.HEAPU8.set(new Uint8Array(visibility.map((v) => (v ? 1 : 0))), visibilityPtr)
  Module._setLineVisibility(visibilityPtr, numLines)

  // 更新背景色
  const bgColorPtr = Module._malloc(4)
  Module.HEAPU8.set(new Uint8Array(bgColor), bgColorPtr)
  Module._setBackgroundColor(bgColorPtr)

  // 更新 Y 轴范围
  Module._setYRange(yMin, yMax)

  // 调用 Wasm 函数绘制图像
  const pixelPtr = Module._drawSpectrum(
    inputPtr,
    inputSize,
    numLines,
    gridWidth,
    gridHeight,
    startIdx,
    endIdx,
    colorsPtr
  )
  const byteLength = gridWidth * gridHeight * 4 // 像素数据总字节数
  const pixelData = new Uint8ClampedArray(Module.HEAPU8.buffer, pixelPtr, byteLength)

  // 创建可转移缓冲区，避免拷贝开销
  const transferableBuffer = pixelData.buffer.slice(pixelPtr, pixelPtr + byteLength)
  const transferableData = new Uint8ClampedArray(transferableBuffer)

  // 发送图像数据到主线程
  postMessage(
    {
      type: 'image',
      data: { pixels: transferableData, startIdx: startIdx, endIdx: endIdx }
    },
    [transferableBuffer]
  )

  // 如果鼠标在网格内，更新提示框
  if (
    lastMouseXRel >= 0 &&
    lastMouseXRel < gridWidth &&
    lastMouseYRel >= 0 &&
    lastMouseYRel < gridHeight
  ) {
    updateTooltip(lastMouseXRel, lastMouseYRel, lastMouseOffsetX, lastMouseOffsetY)
  }

  // 释放分配的内存
  Module._free(inputPtr)
  Module._free(colorsPtr)
  Module._free(visibilityPtr)
  Module._free(bgColorPtr)
}

// 当 Wasm 模块加载完成时执行
Module.onRuntimeInitialized = () => {
  postMessage({ type: 'ready' }) // 通知主线程 Worker 已就绪

  inputSize = source[0].length

  // 处理主线程消息
  self.onmessage = (e) => {
    if (!e.data || !e.data.type) {
      console.error('Invalid message received:', e.data)
      return
    }

    const type = e.data.type
    const data = e.data

    if (type === 'init') {
      // 初始化 Worker 参数
      gridWidth = data.width
      gridHeight = data.height
      // inputSize = data.inputSize
      endIdx = inputSize - 1
      maxRange = inputSize
      colors = new Uint8Array(data.colors)
      visibility = data.visibility.slice()
      bgColor = data.bgColor.slice()
      yMin = data.yMin
      yMax = data.yMax
      setInterval(updateChart, 200) // 每 50ms 更新一次图表
    } else if (type === 'updateVisibility') {
      visibility = data.visibility.slice() // 更新线的显示状态
    } else if (type === 'updateBackgroundColor') {
      bgColor = data.bgColor.slice() // 更新背景色
    } else if (type === 'updateYRange') {
      yMin = data.yMin // 更新 Y 轴最小值
      yMax = data.yMax // 更新 Y 轴最大值
    } else if (type === 'mousewheel') {
      // 处理鼠标滚轮缩放
      const delta = data.wheelDelta > 0 ? -1 : 1 // 向上滚动缩小，向下滚动放大
      const range = endIdx - startIdx + 1
      const zoomStep = Math.floor(range * 0.1 * delta)
      const center = Math.floor((startIdx + endIdx) / 2)
      let newRange = range + zoomStep
      let newStart = center - Math.floor(newRange / 2)
      let newEnd = center + Math.floor(newRange / 2)

      if (delta > 0 && newRange < minRange) {
        newRange = minRange
        newStart = center - Math.floor(minRange / 2)
        newEnd = center + Math.floor(minRange / 2)
      }
      if (delta < 0 && newRange > maxRange) {
        newRange = maxRange
        newStart = 0
        newEnd = maxRange - 1
      }
      newStart = Math.max(0, newStart)
      newEnd = Math.min(inputSize - 1, newEnd)
      if (newEnd - newStart + 1 < minRange) {
        newStart = center - Math.floor(minRange / 2)
        newEnd = center + Math.floor(minRange / 2)
        newStart = Math.max(0, newStart)
        newEnd = Math.min(inputSize - 1, newEnd)
      }
      startIdx = newStart
      endIdx = newEnd
    } else if (type === 'mousedown') {
      // 处理鼠标按下事件
      if (data.button === 0 && selectionStartX === null) {
        isDragging = true
        dragStartX = data.offsetX - 60
      } else if (data.button === 0 || data.button === 2) {
        selectionStartX = data.offsetX
      }
    } else if (type === 'mousemove') {
      // 处理鼠标移动事件
      if (!data || typeof data.xRel === 'undefined' || typeof data.yRel === 'undefined') {
        console.error('Invalid mousemove data:', data)
        return
      }
      const xRel = data.xRel
      const yRel = data.yRel
      lastMouseXRel = xRel
      lastMouseYRel = yRel
      lastMouseOffsetX = data.offsetX
      lastMouseOffsetY = data.offsetY

      if (isDragging && xRel >= 0 && xRel < data.gridWidth) {
        const range = endIdx - startIdx + 1
        const xScale = range / data.gridWidth
        const deltaX = Math.floor((dragStartX - xRel) * xScale)
        startIdx = Math.max(0, Math.min(inputSize - range, startIdx + deltaX))
        endIdx = startIdx + range - 1
        dragStartX = xRel
      }
      updateTooltip(xRel, yRel, data.offsetX, data.offsetY)
    } else if (type === 'mouseup') {
      // 处理鼠标松开事件
      if (isDragging) {
        isDragging = false
      } else if (selectionStartX !== null) {
        const xStart = Math.min(selectionStartX, data.offsetX) - 60
        const xEnd = Math.max(selectionStartX, data.offsetX) - 60
        const range = endIdx - startIdx + 1
        const xScale = range / gridWidth
        if (xEnd > xStart) {
          const newStart = Math.floor(startIdx + xStart * xScale)
          const newEnd = Math.floor(startIdx + xEnd * xScale)
          if (data.button === 0) {
            if (newEnd - newStart + 1 >= minRange) {
              startIdx = Math.max(0, newStart)
              endIdx = Math.min(inputSize - 1, newEnd)
            }
          } else if (data.button === 2) {
            const zoomFactor = range / (newEnd - newStart)
            const center = (startIdx + endIdx) / 2
            const newRange = Math.floor(range * zoomFactor)
            if (newRange <= maxRange) {
              startIdx = Math.max(0, Math.floor(center - newRange / 2))
              endIdx = Math.min(inputSize - 1, Math.floor(center + newRange / 2))
            }
          }
          if (endIdx - startIdx + 1 < minRange) {
            const center = (startIdx + endIdx) / 2
            startIdx = Math.max(0, Math.floor(center - minRange / 2))
            endIdx = Math.min(inputSize - 1, Math.floor(center + minRange / 2))
          }
          if (endIdx - startIdx + 1 > maxRange) {
            startIdx = 0
            endIdx = maxRange - 1
          }
        }
        selectionStartX = null
      }
    } else if (type === 'mouseout') {
      // 处理鼠标移出事件
      isDragging = false
      selectionStartX = null
      lastMouseXRel = -1
      lastMouseYRel = -1
      postMessage({ type: 'tooltipHide' })
    }
  }
}
