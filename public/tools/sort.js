let array = [];
let originalArray = [];
let comparisons = 0;
let swaps = 0;
let sorting = false;
let abort = false;
const canvas = document.getElementById('sort-canvas');
const ctx = canvas.getContext('2d');

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
  const barWidth = Math.min(60, Math.floor(canvas.width / n) - 2);
  const width = n * (barWidth + 2);
  canvas.width = width;
  canvas.height = 400;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  for (let i = 0; i < n; i++) {
    const x = i * (barWidth + 2);
    const h = (array[i] / max) * (canvas.height - 30);
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
    
    ctx.fillStyle = '#333';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    if (barWidth >= 20) {
      ctx.fillText(array[i], x + barWidth/2, y - 5);
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

async function startSort() {
  if (sorting) return;
  sorting = true;
  abort = false;
  document.querySelector('.btn').disabled = true;
  document.querySelector('.btn-secondary').disabled = false;
  
  const algorithm = document.getElementById('algorithm').value;
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
    alert(`排序完成！\n比较次数: ${comparisons}\n交换次数: ${swaps}`);
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
  resetArray();
});

window.addEventListener('load', () => {
  const size = parseInt(document.getElementById('array-size').value);
  generateArray(size);
});
