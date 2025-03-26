importScripts("parser.js");

let isRuntimeInitialized = false;

Module.onRuntimeInitialized = () => {
  console.log("Runtime initialized successfully");
  isRuntimeInitialized = true;
};

Module.print = (text) => console.log(text);
Module.printErr = (text) => console.error(text);

let result = "[";
let fileName;
let firstChunk = true;

Module.onChunk = (data, groups, offset, total_groups) => {
  if (!firstChunk) {
    result += ","; // 在非首段前添加逗号
  }
  result += data;
  firstChunk = false;
  console.log(
    "Chunk received, groups:",
    groups,
    "offset:",
    offset,
    "total_groups:",
    total_groups,
    "result length:",
    result.length
  );
  self.postMessage({
    type: "chunk",
    data: data,
    groups: groups,
    offset: offset,
    total_groups: total_groups,
  });
};

Module.onProgress = (total_groups, progress) => {
  console.log(
    "Progress received, total_groups:",
    total_groups,
    "progress:",
    progress
  );
  self.postMessage({
    type: "progress",
    progress: progress,
  });
};

Module.onComplete = (total_groups, duration) => {
  console.log(
    "Complete received, total_groups:",
    total_groups,
    "duration:",
    duration
  );
  result += "]";
  try {
    console.log("Final JSON length:", result.length);
    const groups = JSON.parse(result);
    console.log("Parse completed, posting result, total_groups:", total_groups);
    self.postMessage({
      type: "result",
      fileName: fileName,
      groups: groups,
    });
  } catch (error) {
    console.error(
      "JSON parse error:",
      error.message,
      "result length:",
      result.length
    );
    self.postMessage({
      type: "error",
      error: "Failed to parse JSON: " + error.message,
    });
  }
  result = "["; // 重置
  firstChunk = true;
};

self.onmessage = (e) => {
  console.log("Message received:", e.data);
  if (e.data.type === "parse") {
    console.log(
      "Received parse request, buffer size:",
      e.data.buffer.byteLength
    );
    fileName = e.data.fileName;
    const waitForInitialization = () => {
      if (isRuntimeInitialized) {
        console.log("Starting buffer processing");
        const uint8Array = new Uint8Array(e.data.buffer);
        const dataLength = e.data.buffer.byteLength;
        const inputPtr = Module._malloc(dataLength);
        Module.HEAPU8.set(uint8Array, inputPtr);
        Module._parse_groups(inputPtr, dataLength);
        Module._free(inputPtr);
      } else {
        console.log("Waiting for runtime initialization...");
        setTimeout(waitForInitialization, 10);
      }
    };
    waitForInitialization();
  }
};
