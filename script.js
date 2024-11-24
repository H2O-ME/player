let mediaStream = null;
let currentProcessFrame = null; // 用于跟踪当前帧处理函数

// 本地文件处理
document.getElementById('localFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        loadMedia(url);
    }
});

// URL加载功能
function loadFromUrl() {
    const url = document.getElementById('urlInput').value.trim();
    if (url) {
        loadMedia(url);
    }
}

// 统一的媒体加载函数
function loadMedia(url) {
    const video = document.getElementById('mainVideo');
    video.src = url;
    video.style.display = 'block'; // 确保视频可见
    
    // 重置播放模式
    const modeToggle = document.getElementById('modeToggle');
    modeToggle.checked = false;
    document.querySelector('.mode-text').textContent = '普通模式';
    
    video.play().catch(err => {
        console.log('自动播放失败:', err);
        // 显示播放按钮或提示用户手动播放
        video.controls = true;
    });
}

// 摄像头功能
document.getElementById('cameraBtn').addEventListener('click', async function() {
    try {
        if (!mediaStream) {
            mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: true,
                audio: true 
            });
            document.getElementById('mainVideo').srcObject = mediaStream;
            this.textContent = '关闭摄像头';
            this.style.backgroundColor = '#ff4757';
        } else {
            mediaStream.getTracks().forEach(track => track.stop());
            mediaStream = null;
            document.getElementById('mainVideo').srcObject = null;
            this.textContent = '开启摄像头';
            this.style.backgroundColor = '';
        }
    } catch (err) {
        alert('无法访问摄像头：' + err.message);
    }
});

// 错误处理
document.getElementById('mainVideo').addEventListener('error', function(e) {
    console.error('视频加载错误:', e.target.error);
    alert('视频加载失败，请检查文件或链接是否正确');
});

// 确保视频控件可见
document.getElementById('mainVideo').controls = true;

// 滤镜控制
document.getElementById('filterSelect').addEventListener('change', function(e) {
    const video = document.getElementById('mainVideo');
    const filterValue = e.target.value;
    
    const filterSettings = {
        'none': '',
        'grayscale': 'grayscale(100%)',
        'sepia': 'sepia(100%)',
        'blur': 'blur(5px)',
        'brightness': 'brightness(150%)',
        'contrast': 'contrast(150%)',
        'saturate': 'saturate(200%)',
        'hue-rotate': 'hue-rotate(90deg)',
        'invert': 'invert(100%)',
        'opacity': 'opacity(50%)',
        'custom': 'contrast(150%) brightness(120%) saturate(150%)'
    };
    
    video.style.filter = filterSettings[filterValue];
});

// 播放速度控制
document.getElementById('playbackSpeed').addEventListener('change', function(e) {
    const video = document.getElementById('mainVideo');
    video.playbackRate = parseFloat(e.target.value);
});

// 亮度控制
document.getElementById('brightnessRange').addEventListener('input', function(e) {
    updateVideoFilters();
});

// 对比度控制
document.getElementById('contrastRange').addEventListener('input', function(e) {
    updateVideoFilters();
});

// 更新视频滤镜
function updateVideoFilters() {
    const video = document.getElementById('mainVideo');
    const brightness = document.getElementById('brightnessRange').value;
    const contrast = document.getElementById('contrastRange').value;
    
    video.style.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
}

// 添加键盘快捷键
document.addEventListener('keydown', function(e) {
    const video = document.getElementById('mainVideo');
    
    switch(e.key.toLowerCase()) {
        case 'arrowleft': // 快退5秒
            video.currentTime -= 5;
            break;
        case 'arrowright': // 快进5秒
            video.currentTime += 5;
            break;
        case 'arrowup': // 音量增加
            video.volume = Math.min(1, video.volume + 0.1);
            break;
        case 'arrowdown': // 音量减少
            video.volume = Math.max(0, video.volume - 0.1);
            break;
    }
});

// 拖放支持
const dropZone = document.querySelector('.video-container');

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file);
        loadMedia(url);
    }
});

// 添加网格生成和控制功能
function createPlaybackGrid() {
    const grid = document.getElementById('playbackGrid');
    const rows = 30;
    const cols = 80;
    
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    
    for (let i = 0; i < rows * cols; i++) {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'grid-checkbox';
        checkbox.disabled = true;
        grid.appendChild(checkbox);
    }
}

// 更新播放模式
function updatePlaybackPattern() {
    const pattern = [];
    const checkboxes = document.querySelectorAll('.grid-checkbox');
    
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            pattern.push({
                row: parseInt(checkbox.dataset.row),
                col: parseInt(checkbox.dataset.col)
            });
        }
    });
    
    // 这里可以添加根据pattern来控制视频播放的逻辑
    console.log('当前播放模式:', pattern);
}

// 页面加载时创建网格
document.addEventListener('DOMContentLoaded', function() {
    createPlaybackGrid();
});

// 添加预设模��功能（可选）
function setPresetPattern(pattern) {
    const checkboxes = document.querySelectorAll('.grid-checkbox');
    checkboxes.forEach(checkbox => checkbox.checked = false);
    
    pattern.forEach(pos => {
        const index = pos.row * 80 + pos.col;
        if (checkboxes[index]) {
            checkboxes[index].checked = true;
        }
    });
    
    updatePlaybackPattern();
}

// 视频像素化处理
function processVideoFrame(video) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const gridRows = 30;
    const gridCols = 80;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // 绘制镜像视频帧
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();
    
    const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = pixelData.data;
    const checkboxes = document.querySelectorAll('.grid-checkbox');
    const cellWidth = Math.floor(canvas.width / gridCols);
    const cellHeight = Math.floor(canvas.height / gridRows);
    
    // 提高灵敏度的阈值调整
    const sensitivityThreshold = 160; // 提高阈值，使更多像素能被检测到
    
    for (let i = 0; i < gridRows; i++) {
        for (let j = 0; j < gridCols; j++) {
            let brightness = 0;
            let count = 0;
            
            // 计算当前网格区域的平均亮度
            for (let y = i * cellHeight; y < (i + 1) * cellHeight; y++) {
                for (let x = j * cellWidth; x < (j + 1) * cellWidth; x++) {
                    if (x < canvas.width && y < canvas.height) {
                        const index = (y * canvas.width + x) * 4;
                        // 增加绿色通道的权重，提高对亮度变化的敏感度
                        const r = pixels[index] * 0.3;
                        const g = pixels[index + 1] * 0.59;
                        const b = pixels[index + 2] * 0.11;
                        brightness += (r + g + b);
                        count++;
                    }
                }
            }
            
            // 设置复选框状态
            const checkbox = checkboxes[i * gridCols + j];
            if (checkbox) {
                const avgBrightness = count > 0 ? brightness / count : 0;
                // 使用新的阈值和更敏感的判断逻辑
                checkbox.checked = avgBrightness < sensitivityThreshold;
                checkbox.style.backgroundColor = checkbox.checked ? '#666' : '#fff';
            }
        }
    }
}

// 视频播放时持续更新像素效果
function startPixelProcessing() {
    const video = document.getElementById('mainVideo');
    const processFrame = () => {
        if (!video.paused && !video.ended) {
            processVideoFrame(video);
        }
        requestAnimationFrame(processFrame);
    };
    
    video.addEventListener('play', processFrame);
}

// 添加模式切换功能
document.getElementById('modeToggle').addEventListener('change', function(e) {
    const playbackGrid = document.getElementById('playbackGrid');
    const video = document.getElementById('mainVideo');
    const modeText = document.querySelector('.mode-text');
    
    if (this.checked) {
        // 切换到像素模式
        video.style.display = 'none';
        playbackGrid.style.display = 'grid';
        modeText.textContent = '像素模式';
        
        // 停止之前的帧处理
        if (currentProcessFrame) {
            video.removeEventListener('play', currentProcessFrame);
        }
        
        // 创建新的帧处理函数
        currentProcessFrame = () => {
            if (video.readyState >= 2 && !video.paused && !video.ended) {
                processVideoFrame(video);
            }
            requestAnimationFrame(currentProcessFrame);
        };
        
        createPlaybackGrid();
        video.addEventListener('play', currentProcessFrame);
        if (!video.paused) {
            currentProcessFrame();
        }
    } else {
        // 切换到普通模式
        playbackGrid.style.display = 'none';
        video.style.display = 'block';
        modeText.textContent = '普通模式';
        
        // 停止像素处理
        if (currentProcessFrame) {
            video.removeEventListener('play', currentProcessFrame);
            currentProcessFrame = null;
        }
    }
});

// 停止像素处理
function stopPixelProcessing() {
    const video = document.getElementById('mainVideo');
    video.removeEventListener('play', processFrame);
}
