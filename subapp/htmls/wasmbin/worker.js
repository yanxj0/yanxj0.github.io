// 加载 WASM 模块
importScripts("parser.js");

// 全局状态
let isRuntimeInitialized = false; // WASM 初始化标志
let totalOffset = 0; // 已处理字节数
let totalGroups = 0; // 已处理组数
let currentFileSize = 0; // 当前文件大小
let minValue = 32767; // 最小值
let maxValue = -32768; // 最大值

// WASM 初始化完成
Module.onRuntimeInitialized = () => {
  isRuntimeInitialized = true;
};

// 处理每组数据
Module.onGroup = (data, index) => {
  const values = JSON.parse(data); // 解析 JSON 数组
  // 更新最小/最大值
  for (let value of values) {
    if (value < minValue) minValue = value;
    if (value > maxValue) maxValue = value;
  }
  // 发送组数据和总组数
  self.postMessage({
    type: "group",
    data,
    total_groups: totalGroups + index + 1,
  });
  totalGroups += 1;
};

// 报告处理进度
Module.onProgress = (group_count, processed_bytes) => {
  totalOffset += processed_bytes;
  totalGroups += group_count;
  const progress = (totalOffset / currentFileSize) * 100;
  self.postMessage({ type: "progress", progress });
};

// 完成处理
Module.onComplete = (total_groups) => {
  self.postMessage({
    type: "complete",
    total_groups,
    min_value: minValue,
    max_value: maxValue,
  });
  // 重置状态
  totalOffset = 0;
  totalGroups = 0;
  minValue = 32767;
  maxValue = -32768;
};

// 处理主线程消息
self.onmessage = (e) => {
  if (e.data.type === "parse") {
    currentFileSize = e.data.fileSize;
    // 等待 WASM 初始化
    const waitForInitialization = () => {
      if (isRuntimeInitialized) {
        const uint8Array = new Uint8Array(e.data.buffer);
        const dataLength = e.data.buffer.byteLength;
        // 分配 WASM 内存
        const inputPtr = Module._malloc(dataLength);
        Module.HEAPU8.set(uint8Array, inputPtr);
        // 调用解析函数
        Module._process_segment(inputPtr, dataLength, 0);
        Module._free(inputPtr);
      } else {
        setTimeout(waitForInitialization, 10);
      }
    };
    waitForInitialization();
  } else if (e.data.type === "finish") {
    Module.onComplete(totalGroups);
  }
};
