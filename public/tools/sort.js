// 排序算法元数据
const algorithmInfo = {
  bubble: {
    name: '冒泡排序',
    complexity: { time: 'O(n²)', space: 'O(1)' },
    desc: '重复遍历数组，比较相邻元素并交换位置，每轮将最大元素"冒泡"到末尾。',
    pros: ['实现简单', '稳定排序', '空间效率高'],
    cons: ['效率低，n较大时不适用', '交换次数多']
  },
  selection: {
    name: '选择排序',
    complexity: { time: 'O(n²)', space: 'O(1)' },
    desc: '每轮从未排序部分找出最小（或最大）元素，放到已排序部分的末尾。',
    pros: ['交换次数少（最多n-1次）', '空间效率高', '不稳定但易于理解'],
    cons: ['时间效率低', '不稳定排序']
  },
  insertion: {
    name: '插入排序',
    complexity: { time: 'O(n²)', space: 'O(1)' },
    desc: '将数组分为已排序和未排序两部分，每次从未排序部分取元素插入到已排序部分的正确位置。',
    pros: ['对小规模或基本有序数组高效', '稳定排序', '原地排序', '在线算法'],
    cons: ['大规模数据效率低', '交换次数多']
  },
  quick: {
    name: '快速排序',
    complexity: { time: 'O(n log n) 平均, O(n²) 最坏', space: 'O(log n)' },
    desc: '选择一个基准元素，将数组划分为小于基准和大于基准的两部分，递归排序。',
    pros: ['平均性能优秀', '常数因子小', '原地排序（递归栈除外）'],
    cons: ['最坏情况性能差（已排序数组）', '不稳定排序', '递归深度可能较大']
  },
  merge: {
    name: '归并排序',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    desc: '分治策略：将数组递归分成两半，分别排序后合并。',
    pros: ['稳定排序', '最坏情况也是 O(n log n)', '适合链表'],
    cons: ['需要额外空间 O(n)', '常数因子较大']
  }
};

let currentAlgorithm = 'bubble';
let barWidth = 40; // 默认柱子宽度
const baseBarWidth = 40; // 基础宽度
const minBarWidth = 4;   // 最小宽度
const maxBarWidth = 80;  // 最大宽度
const padding = 60;      // 画布两侧预留空间

const canvas = document.getElementById('sort-canvas');
const ctx = canvas.getContext('2d');

let array = [];
let originalArray = [];
let comparisons = 0;
let swaps = 0;
let sorting = false;
let abort = false;
let sortedCount = 0;

function getColor(value, max, state) {
  const hue = 220 + (value / max) * 60; // 蓝色到紫色范围
  switch(state) {
    case 'comparing': return '#ff6b6b';
    case 'sorted': return '#51cf66';
    case 'pivot': return '#ffd43b';
    default: return `hsl(${hue}, 80%, 65%)`;
  }
}

function drawArray(highlight = [], pivotIdx = -1) {
  const n = array.length;
  const max = Math.max(...array);
  
  // 智能柱宽计算：基于容器宽度自适应，但保持基础宽度优先
  const containerWidth = Math.min(800, window.innerWidth - 100); // 最大可用宽度
  const preferredWidth = n * baseBarWidth + (n - 1) * 2; // 基础宽度需求
  
  if (preferredWidth > containerWidth - padding) {
    // 如果基础宽度超出容器，则缩小柱子
    barWidth = Math.max(minBarWidth, Math.floor((containerWidth - padding) / n));
  } else if (n < 10 && barWidth < maxBarWidth) {
    // 小数组时，如果当前宽度小于最大宽度，适当增加
    barWidth = Math.min(maxBarWidth, baseBarWidth + (10 - n) * 5);
  } else if (barWidth < baseBarWidth) {
    // 恢复基础宽度（当数组变大后再变回小）
    barWidth = baseBarWidth;
  }
  
  const spacing = Math.max(1, Math.floor(barWidth / 5));
  const cellWidth = barWidth + spacing;
  const width = n * cellWidth - spacing;
  const cellHeight = 10;
  
  canvas.width = width;
  canvas.height = 400;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  for (let i = 0; i < n; i++) {
    const x = i * cellWidth;
    const h = Math.max(2, Math.floor((array[i] / max) * (canvas.height - 30)));
    const y = canvas.height - h;
    
    if (i === pivotIdx) {
      ctx.fillStyle = getColor(array[i], max, 'pivot');
    } else if (highlight.includes(i)) {
      ctx.fillStyle = getColor(array[i], max, 'comparing');
    } else if (i < array.length - sortedCount) {
      ctx.fillStyle = getColor(array[i], max, 'default');
    } else {
      ctx.fillStyle = getColor(array[i], max, 'sorted');
    }
    
    ctx.fillRect(x, y, barWidth, h);
    
    if (barWidth >= 12) {
      ctx.fillStyle = '#333';
      ctx.font = 'bold ' + Math.max(8, barWidth/3) + 'px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(array[i], x + barWidth/2, y - 8);
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateArray(size) {
  array = Array.from({length: size}, () => Math.floor(Math.random() * 100) + 1);
  originalArray = [...array];
  sortedCount = 0;
  comparisons = 0;
  swaps = 0;
  updateStats();
  drawArray();
}

function updateStats() {
  document.getElementById('comparisons').textContent = comparisons;
  document.getElementById('swaps').textContent = swaps;
}

function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

async function bubbleSort() {
  const n = array.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (abort) return;
      comparisons++;
      drawArray([j, j+1]);
      await sleep(getSpeed());
      if (array[j] > array[j+1]) {
        [array[j], array[j+1]] = [array[j+1], array[j]];
        swaps++;
        drawArray([j, j+1]);
        await sleep(getSpeed());
      }
    }
    sortedCount++;
    drawArray([], n - i - 1);
  }
  sortedCount = n;
  drawArray([]);
}

async function selectionSort() {
  const n = array.length;
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      if (abort) return;
      comparisons++;
      drawArray([i, j, minIdx], minIdx);
      await sleep(getSpeed());
      if (array[j] < array[minIdx]) {
        minIdx = j;
      }
    }
    if (minIdx !== i) {
      [array[i], array[minIdx]] = [array[minIdx], array[i]];
      swaps++;
    }
    drawArray([], i);
    await sleep(getSpeed());
  }
  sortedCount = n;
  drawArray([]);
}

async function insertionSort() {
  const n = array.length;
  for (let i = 1; i < n; i++) {
    if (abort) return;
    let key = array[i];
    let j = i - 1;
    while (j >= 0 && array[j] > key) {
      comparisons++;
      array[j+1] = array[j];
      swaps++;
      drawArray([j, j+1]);
      await sleep(getSpeed());
      j--;
    }
    array[j+1] = key;
    drawArray([], i);
  }
  sortedCount = n;
  drawArray([]);
}

async function quickSort() {
  let comps = 0, swapCount = 0;
  const partition = async (low, high) => {
    const pivot = array[high];
    let i = low - 1;
    for (let j = low; j < high; j++) {
      if (abort) return -1;
      comps++;
      comparisons = comps;
      swaps = swapCount;
      updateStats();
      drawArray([j, high], high);
      await sleep(getSpeed());
      if (array[j] < pivot) {
        i++;
        if (i !== j) {
          [array[i], array[j]] = [array[j], array[i]];
          swapCount++;
        }
      }
    }
    [array[i+1], array[high]] = [array[high], array[i+1]];
    swaps = swapCount;
    updateStats();
    drawArray([i+1, high], i+1);
    await sleep(getSpeed());
    return i+1;
  };

  const stack = [[0, array.length-1]];
  while (stack.length > 0) {
    if (abort) return;
    const [low, high] = stack.pop();
    if (low < high) {
      const pi = await partition(low, high);
      if (pi === -1) return;
      stack.push([pi+1, high]);
      stack.push([low, pi-1]);
    }
  }
  sortedCount = array.length;
  drawArray([]);
}

async function mergeSort() {
  const n = array.length;
  let comps = 0, swapCount = 0;
  
  const merge = async (left, mid, right) => {
    const leftArr = array.slice(left, mid + 1);
    const rightArr = array.slice(mid + 1, right + 1);
    let i = 0, j = 0, k = left;
    
    while (i < leftArr.length && j < rightArr.length) {
      if (abort) return;
      comps++;
      comparisons = comps;
      swaps = swapCount;
      updateStats();
      drawArray([k], -1);
      await sleep(getSpeed());
      if (leftArr[i] <= rightArr[j]) {
        array[k] = leftArr[i];
        i++;
      } else {
        array[k] = rightArr[j];
        j++;
      }
      swapCount++;
      k++;
    }
    
    while (i < leftArr.length) {
      if (abort) return;
      array[k] = leftArr[i];
      swaps = swapCount;
      updateStats();
      drawArray([k], -1);
      await sleep(getSpeed());
      i++; k++;
    }
    while (j < rightArr.length) {
      if (abort) return;
      array[k] = rightArr[j];
      swaps = swapCount;
      updateStats();
      drawArray([k], -1);
      await sleep(getSpeed());
      j++; k++;
    }
  };

  const stack = [[0, n-1]];
  while (stack.length > 0) {
    if (abort) return;
    const [left, right] = stack.pop();
    if (left < right) {
      const mid = Math.floor((left + right) / 2);
      stack.push([left, mid]);
      stack.push([mid+1, right]);
      await merge(left, mid, right);
    }
  }
  sortedCount = n;
  drawArray([]);
}

function getSpeed() {
  const speed = parseInt(document.getElementById('speed').value);
  return speed === 1 ? 5 : speed === 50 ? 30 : 100;
}

async function updateAlgorithmInfo() {
  const info = algorithmInfo[currentAlgorithm];
  const container = document.getElementById('algorithm-info');
  container.innerHTML = `
    <h3>${info.name}</h3>
    <div class="meta">
      时间复杂度: <code>${info.complexity.time}</code> | 
      空间复杂度: <code>${info.complexity.space}</code>
    </div>
    <p class="desc">${info.desc}</p>
    <div class="pros-cons">
      <div class="pros">
        <strong>✅ 优点：</strong>
        <ul>${info.pros.map(p => `<li>${p}</li>`).join('')}</ul>
      </div>
      <div class="cons">
        <strong>❌ 缺点：</strong>
        <ul>${info.cons.map(c => `<li>${c}</li>`).join('')}</ul>
      </div>
    </div>
  `;
}

async function startSort() {
  if (sorting) return;
  sorting = true;
  abort = false;
  document.querySelector('.btn').disabled = true;
  document.querySelector('.btn-secondary').disabled = false;
  
  const algorithm = document.getElementById('algorithm').value;
  currentAlgorithm = algorithm; // 记录当前算法
  updateAlgorithmInfo(); // 更新信息显示
  array = [...originalArray];
  comparisons = 0;
  swaps = 0;
  sortedCount = 0;
  updateStats();
  drawArray();
  
  switch(algorithm) {
    case 'bubble': await bubbleSort(); break;
    case 'selection': await selectionSort(); break;
    case 'insertion': await insertionSort(); break;
    case 'quick': await quickSort(); break;
    case 'merge': await mergeSort(); break;
  }
  
  if (!abort) {
    drawArray([]);
    showToast(`✅ 排序完成！比较: ${comparisons}, 交换: ${swaps}`);
  }
  
  sorting = false;
  document.querySelector('.btn').disabled = false;
}

function resetArray() {
  if (sorting) {
    abort = true;
    sorting = false;
  }
  const size = parseInt(document.getElementById('array-size').value);
  generateArray(size);
}

document.getElementById('array-size').addEventListener('change', resetArray);
document.getElementById('algorithm').addEventListener('change', () => {
  if (sorting) return;
  currentAlgorithm = document.getElementById('algorithm').value;
  updateAlgorithmInfo();
  resetArray();
});

window.addEventListener('load', () => {
  const size = parseInt(document.getElementById('array-size').value);
  generateArray(size);
  updateAlgorithmInfo(); // 初始化显示
});
