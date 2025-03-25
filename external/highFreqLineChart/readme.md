## 环境安装

1.  安装 Emscripten

    - 如果尚未安装，下载 Emscripten SDK（https://github.com/emscripten-core/emsdk）。
    - 解压后，进入目录运行

    ```cmd
    emsdk install latest
    emsdk activate latest
    ```

    - 配置环境变量：在每次使用前运行 **emsdk_env.bat**（位于 Emscripten 目录下），或永久添加到系统 PATH。

2.  验证安装
    - 运行 emcc --version，确保输出版本号（如 3.1.XX）。

## 完整操作流程

1. 编写 spectrum.cpp：

   - 使用之前提供的 C++ 代码（包含 updateSpectrum 和 getSize 函数）。
   - 编译：打开 CMD 或 PowerShell，导航到 spectrum.cpp 所在目录。
   - 执行调整后的命令：

    ```powershell
    # 这里使用的相对路径,根据环境调整
    emcc ../code/spectrum.cpp -o ../code/spectrum.js -s "EXPORTED_FUNCTIONS=[\"_malloc\",\"_free\",\"_drawSpectrum\",\"_getLastData\",\"_getInputSize\",\"_getWidth\",\"_getHeight\"]" -s "EXPORTED_RUNTIME_METHODS=[\"ccall\",\"cwrap\"]" -s "ALLOW_MEMORY_GROWTH=1" -O3
    ```
3. 检查输出：
   - 成功后会生成 spectrum.js 和 spectrum.wasm。
4. 运行：(可用其他服务器)
   - 将 spectrum.js、spectrum.wasm 和 index.html 放在同一目录。
   - 使用本地服务器（如 Python）运行：

    ```cmd
    python -m http.server 8000
    ```
    - 在浏览器访问 http://localhost:8000。
