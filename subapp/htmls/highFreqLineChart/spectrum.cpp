#include <emscripten.h>
#include <vector>
#include <cmath>
#include <cstring>

extern "C" {
// 全局变量
static std::vector<float> lastInputData;  // 保存最近一次 drawSpectrum 的输入数据
static int currentWidth = 1280;           // 当前图像宽度，默认 1280
static int currentHeight = 720;           // 当前图像高度，默认 720
static int currentInputSize = 10000;      // 当前输入数据长度，默认 10000
static std::vector<uint8_t> pixelData;    // 动态像素数据缓冲区
static std::vector<bool> lineVisibility;  // 每条线的显示状态

// 设置图像参数
// 参数：
// - width: 新的图像宽度
// - height: 新的图像高度
// - inputSize: 新的输入数据长度
EMSCRIPTEN_KEEPALIVE
void setParameters(int width, int height, int inputSize) {
    currentWidth = width;
    currentHeight = height;
    currentInputSize = inputSize;
    pixelData.resize(width * height * 4);
}

// 设置线的显示状态
// 参数：
// - visibility: 布尔数组（以 uint8_t 表示，0 为隐藏，1 为显示）
// - numLines: 线的数量
EMSCRIPTEN_KEEPALIVE
void setLineVisibility(uint8_t* visibility, int numLines) {
    lineVisibility.resize(numLines);
    for (int i = 0; i < numLines; i++) {
        lineVisibility[i] = (visibility[i] != 0);  // 将 uint8_t (0/1) 转换为 bool
    }
}

// 绘制频谱图像
// 参数：
// - inputData: 输入数据数组，包含 numLines 条折线的数据，每条长度为 inputSize
// - inputSize: 每条折线的数据点数
// - numLines: 折线数量
// - width: 输出图像的宽度（像素）
// - height: 输出图像的高度（像素）
// - startIdx: 显示范围的起始索引
// - endIdx: 显示范围的结束索引
// - colors: 颜色数组，每条线 3 个字节 (RGB)
// 返回值：指向像素数据的指针（RGBA 格式）
EMSCRIPTEN_KEEPALIVE
uint8_t* drawSpectrum(float* inputData, int inputSize, int numLines, int width, int height, int startIdx, int endIdx, uint8_t* colors) {
    if (inputData == nullptr || colors == nullptr || inputSize <= 0 || numLines <= 0 || width <= 0 || height <= 0 || startIdx < 0 || endIdx >= inputSize || startIdx > endIdx) {
        return nullptr;
    }
    if (width != currentWidth || height != currentHeight || inputSize != currentInputSize) {
        setParameters(width, height, inputSize);
    }
    if (lineVisibility.size() != numLines) {
        lineVisibility.resize(numLines, true);  // 默认显示所有线
    }
    std::fill(pixelData.begin(), pixelData.end(), 255);  // 填充白色背景
    lastInputData.assign(inputData, inputData + inputSize * numLines);
    startIdx = std::max(0, startIdx);
    endIdx = std::min(inputSize - 1, endIdx);
    int rangeSize = endIdx - startIdx + 1;
    float xScale = static_cast<float>(width) / (rangeSize - 1);
    const float yMin = -1.5;
    const float yMax = 1.5;
    float yScale = height / (yMax - yMin);

    for (int line = 0; line < numLines; line++) {
        if (!lineVisibility[line]) continue;  // 跳过不可见线

        uint8_t r = colors[line * 3];
        uint8_t g = colors[line * 3 + 1];
        uint8_t b = colors[line * 3 + 2];
        for (int i = startIdx; i < endIdx; i++) {
            float x1 = (i - startIdx) * xScale;
            float x2 = (i + 1 - startIdx) * xScale;
            int dataIdx = line * inputSize + i;
            int y1 = height - static_cast<int>((inputData[dataIdx] - yMin) * yScale);
            int y2 = height - static_cast<int>((inputData[dataIdx + 1] - yMin) * yScale);
            y1 = std::max(0, std::min(height - 1, y1));
            y2 = std::max(0, std::min(height - 1, y2));
            int dx = x2 - x1;
            int dy = y2 - y1;
            int steps = std::max(std::abs(dx), std::abs(dy));
            float xInc = static_cast<float>(dx) / steps;
            float yInc = static_cast<float>(dy) / steps;
            float x = x1;
            float y = y1;
            for (int j = 0; j <= steps; j++) {
                int px = static_cast<int>(x);
                int py = static_cast<int>(y);
                if (px >= 0 && px < width && py >= 0 && py < height) {
                    int index = (py * width + px) * 4;
                    pixelData[index] = r;
                    pixelData[index + 1] = g;
                    pixelData[index + 2] = b;
                    pixelData[index + 3] = 255;
                }
                x += xInc;
                y += yInc;
            }
        }
    }
    return pixelData.data();
}

EMSCRIPTEN_KEEPALIVE
float* getLastData() { return lastInputData.data(); }

EMSCRIPTEN_KEEPALIVE
int getInputSize() { return currentInputSize; }

EMSCRIPTEN_KEEPALIVE
int getWidth() { return currentWidth; }

EMSCRIPTEN_KEEPALIVE
int getHeight() { return currentHeight; }
}