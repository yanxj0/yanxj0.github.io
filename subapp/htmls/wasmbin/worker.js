importScripts("parser.js"); // 导入 WASM 模块

let isRuntimeInitialized = false; // 标志 WASM 运行时是否初始化完成

// 当 WASM 运行时初始化完成时触发
Module.onRuntimeInitialized = () => {
  console.log("Runtime initialized successfully");
  isRuntimeInitialized = true; // 更新初始化状态
};

// 重定向 WASM 的输出到控制台
Module.print = (text) => console.log(text);
Module.printErr = (text) => console.error(text);

// 处理单个数据组的回调
Module.onGroup = (data, index) => {
  self.postMessage({
    type: "group", // 消息类型
    data: data, // JSON 格式的组数据
    total_groups: totalGroups + index + 1, // 更新全局组数
  });
};

// 处理进度更新的回调
Module.onProgress = (group_count, processed_bytes) => {
  totalOffset += processed_bytes; // 累加已处理字节数
  totalGroups += group_count; // 累加组数
  const progress = (totalOffset / currentFileSize) * 100; // 计算进度百分比
  self.postMessage({
    type: "progress",
    progress: progress,
  });
};

// 处理解析完成的回调
Module.onComplete = (total_groups, duration) => {
  self.postMessage({
    type: "complete",
    total_groups: total_groups, // 最终组数
    duration: duration, // 处理时长（当前未使用）
  });
};

let totalOffset = 0; // 全局已处理字节数
let totalGroups = 0; // 全局总组数
let currentOffset = 0; // 当前分片的起始偏移量
let currentFileSize = 0; // 文件总大小

// Worker 消息处理函数
self.onmessage = (e) => {
  console.log("Message received:", e.data);
  if (e.data.type === "parse") {
    // 处理解析请求
    console.log(
      "Received parse request, buffer size:",
      e.data.buffer.byteLength,
      "offset:",
      e.data.offset
    );
    currentOffset = e.data.offset; // 更新当前偏移量
    currentFileSize = e.data.fileSize; // 更新文件大小
    const waitForInitialization = () => {
      if (isRuntimeInitialized) {
        // 运行时已初始化，开始处理
        console.log("Starting buffer processing");
        const uint8Array = new Uint8Array(e.data.buffer); // 创建 Uint8Array 视图
        const dataLength = e.data.buffer.byteLength; // 分片长度
        const inputPtr = Module._malloc(dataLength); // 分配 WASM 内存
        Module.HEAPU8.set(uint8Array, inputPtr); // 复制数据到 WASM 堆

        Module._process_segment(inputPtr, dataLength, 0); // 调用 WASM 处理函数

        Module._free(inputPtr); // 释放 WASM 内存
      } else {
        // 等待初始化
        console.log("Waiting for runtime initialization...");
        setTimeout(waitForInitialization, 10); // 10ms 后重试
      }
    };
    waitForInitialization();
  } else if (e.data.type === "finish") {
    // 处理结束消息
    Module.onComplete(totalGroups, 0);
  }
};
