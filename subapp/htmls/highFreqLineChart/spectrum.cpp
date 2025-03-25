#include <emscripten.h>
#include <vector>
#include <cmath>
#include <cstring>

extern "C" {
// 全局变量：存储图像数据和参数
static std::vector<float> lastInputData;  // 保存最近一次 drawSpectrum 的输入数据
static int currentWidth = 1280;           // 当前图像宽度，默认 1280 像素
static int currentHeight = 720;           // 当前图像高度，默认 720 像素
static int currentInputSize = 10000;      // 当前输入数据长度，默认 10000 个点
static std::vector<uint8_t> pixelData;    // 动态像素数据缓冲区，存储 RGBA 数据
static std::vector<bool> lineVisibility;  // 每条线的显示状态（true 为显示，false 为隐藏）
static uint8_t bgColor[4] = {255, 255, 255, 255}; // 默认背景色：白色 (RGBA)
static float yMin = -1.5;                 // 默认 Y 轴最小值
static float yMax = 1.5;                  // 默认 Y 轴最大值

// 设置图像参数
// 参数：
// - width: 图像宽度（像素）
// - height: 图像高度（像素）
// - inputSize: 输入数据的长度（每个折线的数据点数）
EMSCRIPTEN_KEEPALIVE
void setParameters(int width, int height, int inputSize) {
    currentWidth = width;
    currentHeight = height;
    currentInputSize = inputSize;
    pixelData.resize(width * height * 4);  // 调整像素缓冲区大小为 width * height * 4（RGBA）
}

// 设置背景颜色
// 参数：
// - color: RGBA 颜色数组（4 个 uint8_t 值，范围 0-255）
EMSCRIPTEN_KEEPALIVE
void setBackgroundColor(uint8_t* color) {
    bgColor[0] = color[0]; // 红色分量
    bgColor[1] = color[1]; // 绿色分量
    bgColor[2] = color[2]; // 蓝色分量
    bgColor[3] = color[3]; // 透明度分量
}

// 设置线的显示状态
// 参数：
// - visibility: 布尔数组（以 uint8_t 表示，0 为隐藏，1 为显示）
// - numLines: 线的数量
EMSCRIPTEN_KEEPALIVE
void setLineVisibility(uint8_t* visibility, int numLines) {
    lineVisibility.resize(numLines);  // 调整显示状态数组大小
    for (int i = 0; i < numLines; i++) {
        lineVisibility[i] = (visibility[i] != 0);  // 将 uint8_t (0/1) 转换为 bool
    }
}

// 设置 Y 轴范围
// 参数：
// - min: Y 轴最小值
// - max: Y 轴最大值
EMSCRIPTEN_KEEPALIVE
void setYRange(float min, float max) {
    yMin = min;  // 更新全局 Y 轴最小值
    yMax = max;  // 更新全局 Y 轴最大值
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
    // 输入参数验证
    if (inputData == nullptr || colors == nullptr || inputSize <= 0 || numLines <= 0 || width <= 0 || height <= 0 || startIdx < 0 || endIdx >= inputSize || startIdx > endIdx) {
        return nullptr;  // 返回空指针表示错误
    }

    // 如果图像尺寸或输入大小变化，更新参数
    if (width != currentWidth || height != currentHeight || inputSize != currentInputSize) {
        setParameters(width, height, inputSize);
    }

    // 确保 lineVisibility 数组与 numLines 匹配
    if (lineVisibility.size() != numLines) {
        lineVisibility.resize(numLines, true);  // 默认显示所有线
    }

    // 填充背景色
    for (int i = 0; i < width * height * 4; i += 4) {
        pixelData[i] = bgColor[0];     // R
        pixelData[i + 1] = bgColor[1]; // G
        pixelData[i + 2] = bgColor[2]; // B
        pixelData[i + 3] = bgColor[3]; // A
    }

    // 保存输入数据到全局变量
    lastInputData.assign(inputData, inputData + inputSize * numLines);

    // 调整显示范围边界
    startIdx = std::max(0, startIdx);
    endIdx = std::min(inputSize - 1, endIdx);
    int rangeSize = endIdx - startIdx + 1;

    // 计算 X 轴和 Y 轴缩放比例
    float xScale = static_cast<float>(width) / (rangeSize - 1);
    float yScale = height / (yMax - yMin);

    // 遍历每条折线
    for (int line = 0; line < numLines; line++) {
        if (!lineVisibility[line]) continue;  // 跳过不可见的线

        // 获取当前线的颜色
        uint8_t r = colors[line * 3];
        uint8_t g = colors[line * 3 + 1];
        uint8_t b = colors[line * 3 + 2];

        // 绘制折线段
        for (int i = startIdx; i < endIdx; i++) {
            float x1 = (i - startIdx) * xScale;
            float x2 = (i + 1 - startIdx) * xScale;
            int dataIdx = line * inputSize + i;
            int y1 = height - static_cast<int>((inputData[dataIdx] - yMin) * yScale);
            int y2 = height - static_cast<int>((inputData[dataIdx + 1] - yMin) * yScale);

            // 限制 Y 坐标在图像范围内
            y1 = std::max(0, std::min(height - 1, y1));
            y2 = std::max(0, std::min(height - 1, y2));

            // 使用 Bresenham 算法绘制线段
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
                    pixelData[index + 3] = 255;  // 线的 Alpha 固定为不透明
                }
                x += xInc;
                y += yInc;
            }
        }
    }
    return pixelData.data();  // 返回像素数据指针
}

// 获取最近一次绘制的输入数据
EMSCRIPTEN_KEEPALIVE
float* getLastData() { return lastInputData.data(); }

// 获取当前输入数据长度
EMSCRIPTEN_KEEPALIVE
int getInputSize() { return currentInputSize; }

// 获取当前图像宽度
EMSCRIPTEN_KEEPALIVE
int getWidth() { return currentWidth; }

// 获取当前图像高度
EMSCRIPTEN_KEEPALIVE
int getHeight() { return currentHeight; }
}