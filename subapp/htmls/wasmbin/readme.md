## 从bin文件提取出平铺播放的数据

每帧数据头描述有52个字节，后的最后4个字节为后续数据的个数，后续每个数据为2字节INT16   
一个bin文件有n帧，帧之间直接是二进制字节拼接的

```cmd
emsdk_env.bat

emcc parser.cpp -s "EXPORTED_FUNCTIONS=[\"_process_segment\", \"_parse_groups\", \"_get_result_length\", \"_malloc\", \"_free\"]" -s "EXPORTED_RUNTIME_METHODS=[\"UTF8ToString\"]" -s ALLOW_MEMORY_GROWTH=1 -s ENVIRONMENT=web -s NO_FILESYSTEM=1 -s EXPORT_ALL=0 -s USE_PTHREADS=0 -o parser.js
```
