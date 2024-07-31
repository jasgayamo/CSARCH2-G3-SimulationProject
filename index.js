document.addEventListener('DOMContentLoaded', function() {

    const form = document.getElementById('signupForm');
    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault();

            let blockSize = parseInt(document.getElementById('block-size').value);
            let mmSize = parseInt(document.getElementById('main-memory-size').value);
            let cacheSize = parseInt(document.getElementById('cache-memory-size').value);
            let memoryAccessTime = parseInt(document.getElementById('memory-access-time').value);
            let cacheAccessTime = parseInt(document.getElementById('cache-access-time').value);
            let mmValues = document.getElementById('memory-value').value.split(',').map(Number);
            let programFlow = document.getElementById('sequence-number').value.split(',').map(Number);
            let memorySizeCategory = document.getElementById('memory-size-category').value;
            let inputCategory = document.getElementById('input-category').value;

            if (!validateInputs(blockSize, mmSize, cacheSize, memoryAccessTime, cacheAccessTime)) {
                alert("Invalid Input!");
                return;
            }

            if (memorySizeCategory === 'Word') {
                mmSize = convertToBlocks(mmSize, blockSize);
            }
            if (inputCategory === 'Address') {
                mmValues = mmValues.map(value => convertToBlock(value, blockSize));
                programFlow = programFlow.map(value => convertToBlock(value, blockSize));
            }

            let results = simulateCache(blockSize, mmSize, cacheSize, mmValues, memoryAccessTime, cacheAccessTime, programFlow);

            displayResults(results);
            displayInputSimulation(blockSize, mmSize, cacheSize, memoryAccessTime, cacheAccessTime, mmValues, programFlow);

            document.getElementById('output-as-txt').addEventListener('click', function() {
                saveResults(results);
            });

            document.getElementById('restart').addEventListener('click', function() {
                form.reset();
                document.getElementById('input-simulation').innerHTML = '';
                document.getElementById('cache-snapshot').innerText = '';
                document.getElementById('cache-hits').innerText = 'Cache Hits: 0';
                document.getElementById('cache-misses').innerText = 'Cache Misses: 0';
                document.getElementById('miss-penalty').innerText = 'Miss Penalty: 0';
                document.getElementById('avg-memory-access-time').innerText = 'Average Memory Access Time: 0';
                document.getElementById('total-memory-access-time').innerText = 'Total Memory Access Time: 0';
            });
        });
    }
});

function validateInputs(blockSize, mmSize, cacheSize, memoryAccessTime, cacheAccessTime) {
    return blockSize > 0 && mmSize > 0 && cacheSize > 0 &&
           memoryAccessTime > 0 && cacheAccessTime > 0 &&
           mmSize % blockSize === 0 && cacheSize % blockSize === 0 &&
           Math.log2(blockSize) % 1 === 0;
}

function convertToBlocks(size, blockSize) {
    return Math.ceil(size / blockSize);
}

function convertToBlock(value, blockSize) {
    return Math.floor(value / blockSize);
}

function simulateCache(blockSize, mmSize, cacheSize, mmValues, memAccessTime, cacheAccessTime, programFlow) {
    let cache = Array(cacheSize).fill(null);
    let cacheAge = Array(cacheSize).fill(-1);
    let cacheHit = 0;
    let cacheMiss = 0;
    let hit = false;
    let missPenalty = cacheAccessTime * 2 + blockSize * memAccessTime;
    let totalAccessTime = 0;
    let cacheSnapshot = [];
    
    let mainMemoryBlockMap = mmValues;

    programFlow.forEach((blockNum, i) => {
        let blockMap;
        hit = false;
        cache.forEach((block, j) => {
            if (block === blockNum) {
                cacheHit += 1;
                cacheAge[j] = i;
                blockMap = j;
                hit = true;
            }
        });

        if (!hit) {
            let minAge = Math.min(...cacheAge);
            blockMap = cacheAge.indexOf(minAge);
            cacheAge[blockMap] = i;
            cacheMiss += 1;
        }

        cache[blockMap] = blockNum;
        cacheSnapshot.push([...cache]);
    });

    let avgMemoryAccessTime = (cacheHit / (cacheHit + cacheMiss)) * cacheAccessTime +
        (cacheMiss / (cacheHit + cacheMiss)) * missPenalty;

    totalAccessTime = (cacheHit * blockSize * cacheAccessTime) +
        (cacheMiss * blockSize * (memAccessTime + cacheAccessTime)) +
        (cacheMiss * cacheAccessTime);

    return {
        cacheHits: cacheHit,
        cacheMisses: cacheMiss,
        missPenalty: missPenalty,
        avgMemoryAccessTime: avgMemoryAccessTime,
        totalMemoryAccessTime: totalAccessTime,
        cacheSnapshot: cacheSnapshot
    };
}

function displayResults(results) {
    document.getElementById('output').style.display = 'block';
    document.getElementById('cache-hits').innerText = `Cache Hits: ${results.cacheHits}`;
    document.getElementById('cache-misses').innerText = `Cache Misses: ${results.cacheMisses}`;
    document.getElementById('miss-penalty').innerText = `Miss Penalty: ${results.missPenalty}`;
    document.getElementById('avg-memory-access-time').innerText = `Average Memory Access Time: ${results.avgMemoryAccessTime}`;
    document.getElementById('total-memory-access-time').innerText = `Total Memory Access Time: ${results.totalMemoryAccessTime}`;
    document.getElementById('cache-snapshot').innerText = JSON.stringify(results.cacheSnapshot, null, 4);
}

function displayInputSimulation(blockSize, mmSize, cacheSize, memoryAccessTime, cacheAccessTime, mmValues, programFlow) {
    let inputSimulationDiv = document.getElementById('input-simulation');

    let inputHTML = `
        <p><strong>Block Size:</strong> ${blockSize}</p>
        <p><strong>Main Memory Size:</strong> ${mmSize}</p>
        <p><strong>Cache Memory Size:</strong> ${cacheSize}</p>
        <p><strong>Memory Access Time:</strong> ${memoryAccessTime}</p>
        <p><strong>Cache Access Time:</strong> ${cacheAccessTime}</p>
        <p><strong>Main Memory Values:</strong> ${mmValues.join(', ')}</p>
        <p><strong>Program Flow:</strong> ${programFlow.join(', ')}</p>
    `;

    inputSimulationDiv.innerHTML = inputHTML;
}

function saveResults(results) {
    let blob = new Blob([JSON.stringify(results, null, 4)], { type: 'text/plain;charset=utf-8' });
    let link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'simulation-results.txt';
    link.click();
}
