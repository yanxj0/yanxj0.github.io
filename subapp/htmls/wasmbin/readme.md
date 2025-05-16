## 从bin文件提取出平铺播放的数据

每帧数据头描述有52个字节，后的最后4个字节为后续数据的个数，后续每个数据为2字节INT16   
一个bin文件有n帧，帧之间直接是二进制字节拼接的

```cmd
emsdk_env.bat

emcc parser.cpp -s "EXPORTED_FUNCTIONS=[\"_process_segment\", \"_parse_groups\", \"_malloc\", \"_free\"]" -s "EXPORTED_RUNTIME_METHODS=[\"UTF8ToString\"]" -s ALLOW_MEMORY_GROWTH=1 -s ALLOW_TABLE_GROWTH=1 -s ENVIRONMENT=web -s NO_FILESYSTEM=1 -s EXPORT_ALL=0 -s USE_PTHREADS=0 -o parser.js
```
### wsl里面安装emsdk
```bash 
# wsl里面安装emsdk

cd ~
rm -rf emsdk
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh

```
### 安装 libtiff
```bash
cd /tmp
curl -O http://download.osgeo.org/libtiff/tiff-4.6.0.tar.gz
tar -xzf tiff-4.6.0.tar.gz
mv tiff-4.6.0 ~/tiff-4.6.0

cd ~/tiff-4.6.0
CC=~/emsdk/upstream/emscripten/emcc \
CXX=~/emsdk/upstream/emscripten/em++ \
emconfigure ./configure --disable-shared --enable-static --disable-jpeg --disable-zlib


```cmd
# 完成前面两个步骤后
# 使用wsl进行编译
wsl 

# 将源码拷贝到wsl里面
rm -rf ~/wasmbin
cp -r /mnt/e/study/Cpp/wasmbin ~/wasmbin
cd ~/wasmbin

# 编译
emcc parser.cpp -s "EXPORTED_FUNCTIONS=[\"_process_segment\", \"_generate_tiff\", \"_free_tiff\", \"_generate_base58_bin\", \"_parse_base58_bin\", \"_free_base58_bin\", \"_free_values\", \"_malloc\", \"_free\"]" \
     -s "EXPORTED_RUNTIME_METHODS=[\"UTF8ToString\", \"HEAP16\", \"HEAPU8\", \"HEAP32\", \"HEAPU16\"]" \
     -s ALLOW_MEMORY_GROWTH=1 \
     -s INITIAL_MEMORY=512MB \
     -s ALLOW_TABLE_GROWTH=1 \
     -s ENVIRONMENT=web \
     -s NO_FILESYSTEM=1 \
     -s EXPORT_ALL=0 \
     -s USE_PTHREADS=0 \
     -s USE_ZLIB=1 \
     -I ~/tiff-4.6.0/libtiff \
     -L ~/tiff-4.6.0/libtiff/.libs \
     -ltiff \
     -o parser.js

# 将编译完成的代码拷贝出来
cp -r ~/wasmbin/* /mnt/e/study/Cpp/wasmbin
```