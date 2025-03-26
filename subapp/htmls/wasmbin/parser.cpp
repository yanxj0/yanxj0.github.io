#include <emscripten.h>
#include <cstdlib>
#include <cstring>
#include <cstdio>
#include <chrono>

struct Header {
    char padding[48];
    int32_t data_count;
};

extern "C" {
    EMSCRIPTEN_KEEPALIVE
    uint8_t* process_segment(uint8_t* buffer, int length, int start_offset, int* processed_bytes, int* group_count) {
        if (length < 52 || start_offset >= length) {
            *processed_bytes = 0;
            *group_count = 0;
            return (uint8_t*)strdup("");
        }

        Header* first_h = (Header*)(buffer + start_offset);
        int first_data_count = first_h->data_count;
        int group_size = 52 + first_data_count * 2;

        const size_t chunk_size = 10 * 1024 * 1024;
        char* json = (char*)malloc(chunk_size);
        if (!json) {
            printf("Memory allocation failed for json buffer\n");
            *processed_bytes = 0;
            *group_count = 0;
            return (uint8_t*)strdup("");
        }

        int pos = 0;
        *group_count = 0;
        *processed_bytes = 0;

        int offset = start_offset;
        while (offset + 52 <= length && *processed_bytes < chunk_size / 2) {
            Header* h = (Header*)(buffer + offset);
            int data_count = h->data_count;
            int data_bytes = data_count * 2;
            int total_size = 52 + data_bytes;

            if (total_size != group_size) {
                offset += 52;
                continue;
            }

            if (data_count <= 0 || offset + total_size > length) {
                break;
            }

            json[pos++] = '['; // 每组独立开始

            int16_t* data = (int16_t*)(buffer + offset + 52);
            for (int i = 0; i < data_count; i++) {
                if (pos + 20 >= chunk_size) {
                    printf("Buffer overflow imminent at group %d, pos=%d\n", *group_count, pos);
                    break;
                }
                if (i > 0) json[pos++] = ',';
                pos += snprintf(json + pos, chunk_size - pos, "%d", data[i]);
            }

            json[pos++] = ']'; // 每组独立结束
            (*group_count)++;
            *processed_bytes += total_size;
            offset += total_size;

            // 如果还有更多组，添加逗号
            if (offset + 52 <= length && *processed_bytes < chunk_size / 2) {
                Header* next_h = (Header*)(buffer + offset);
                if (next_h->data_count > 0 && offset + 52 + next_h->data_count * 2 <= length) {
                    json[pos++] = ',';
                }
            }
        }

        json[pos] = '\0';
        return (uint8_t*)json;
    }

    EMSCRIPTEN_KEEPALIVE
    int get_result_length(uint8_t* result) {
        return strlen((char*)result);
    }

    EMSCRIPTEN_KEEPALIVE
    void parse_groups(uint8_t* buffer, int length) {
        auto start_time = std::chrono::high_resolution_clock::now();
        int total_offset = 0;
        int total_groups = 0;

        while (total_offset < length) {
            int processed_bytes = 0;
            int group_count = 0;

            uint8_t* result = process_segment(buffer, length, total_offset, &processed_bytes, &group_count);
            int result_length = get_result_length(result);

            if (result_length > 0) {
                EM_ASM({
                    Module.onChunk(UTF8ToString($0), $1, $2, $3);
                }, result, group_count, total_offset, total_groups);
            }

            total_offset += processed_bytes;
            total_groups += group_count;

            free(result);

            if (processed_bytes == 0) break;

            printf("Processed segment: offset=%d, groups=%d, total_groups=%d\n", 
                   total_offset, group_count, total_groups);
            long progress = (long)(total_offset * 100.0 / length);
            EM_ASM({
                Module.onProgress($0, $1);
            }, total_groups, progress);
        }

        auto end_time = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end_time - start_time).count();
        int final_groups = total_groups;

        printf("Before completion: total_groups=%d, duration=%lld\n", final_groups, duration);
        EM_ASM({
            Module.onComplete($0, $1);
        }, final_groups, duration);
        printf("Parsing completed in %lld ms, total_groups=%d\n", duration, final_groups);
    }
}