const worker = new Worker('worker.js');
const output = document.getElementById('output');

document.getElementById('fileInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) {
        output.textContent = '请选择一个文件';
        return;
    }

    output.textContent = '正在解析文件...\n';
    const arrayBuffer = await file.arrayBuffer();
    
    worker.postMessage({
        type: 'parse',
        buffer: arrayBuffer,
        fileName: file.name
    }, [arrayBuffer]);
});

worker.onmessage = (e) => {
    const { type, data, error } = e.data;
    if (type === 'result') {
        output.textContent = `解析结果:\n${JSON.stringify(data, null, 2)}`;
    } else if (type === 'error') {
        output.textContent = `错误: ${error}`;
    }
};