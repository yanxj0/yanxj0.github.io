#include <emscripten.h>
#include <vector>
#include <cmath>
#include <cstring>

extern "C" {
static std::vector<float> lastInputData;

EMSCRIPTEN_KEEPALIVE
uint8_t* drawSpectrum(float* inputData, int inputSize, int numLines, int width, int height, int startIdx, int endIdx, uint8_t* colors) {
    static std::vector<uint8_t> pixelData(width * height * 4);
    std::fill(pixelData.begin(), pixelData.end(), 255); // 白色背景

    lastInputData.assign(inputData, inputData + inputSize * numLines);

    startIdx = std::max(0, startIdx);
    endIdx = std::min(inputSize - 1, endIdx);
    int rangeSize = endIdx - startIdx + 1;

    float xScale = static_cast<float>(width) / (rangeSize - 1);

    // 使用固定的 Y 轴范围，与 ECharts 一致
    const float yMin = -1.5;
    const float yMax = 1.5;
    float yScale = height / (yMax - yMin); // 无 0.8 缩放，确保全范围

    for (int line = 0; line < numLines; line++) {
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
float* getLastData() {
    return lastInputData.data();
}

EMSCRIPTEN_KEEPALIVE
int getInputSize() { return 10000; }

EMSCRIPTEN_KEEPALIVE
int getWidth() { return 1280; }

EMSCRIPTEN_KEEPALIVE
int getHeight() { return 720; }
}