  
    // --- State ---
    let running = false;
    let startTime = 0;     // timestamp when (re)started
    let elapsed = 0;       // accumulated ms when paused
    let rafId = null;      // animation frame id
    let laps = [];         // {total:number, split:number}

    // --- DOM ---
    const display = document.getElementById('display');
    const startPauseBtn = document.getElementById('startPause');
    const lapBtn = document.getElementById('lap');
    const resetBtn = document.getElementById('reset');
    const clearLapsBtn = document.getElementById('clearLaps');
    const exportBtn = document.getElementById('exportCsv');
    const tbody = document.getElementById('lapsBody');

    // --- Helpers ---
    function formatTime(ms){
      const totalMs = Math.max(0, Math.floor(ms));
      const hours = Math.floor(totalMs / 3600000);
      const minutes = Math.floor((totalMs % 3600000) / 60000);
      const seconds = Math.floor((totalMs % 60000) / 1000);
      const centis = Math.floor((totalMs % 1000) / 10);
      const hh = String(hours).padStart(2,'0');
      const mm = String(minutes).padStart(2,'0');
      const ss = String(seconds).padStart(2,'0');
      const cc = String(centis).padStart(2,'0');
      return `${hh}:${mm}:${ss}.${cc}`;
    }

    function render(){
      const now = performance.now();
      const t = running ? (now - startTime) + elapsed : elapsed;
      display.textContent = formatTime(t);
      if(running) rafId = requestAnimationFrame(render);
    }

    function setRunning(isRunning){
      if(isRunning === running) return;
      running = isRunning;
      if(running){
        startTime = performance.now();
        startPauseBtn.textContent = 'Pause';
        startPauseBtn.classList.add('success');
        startPauseBtn.setAttribute('aria-pressed', 'true');
        lapBtn.disabled = false; resetBtn.disabled = false;
        render();
      } else {
        cancelAnimationFrame(rafId);
        elapsed += performance.now() - startTime;
        startPauseBtn.textContent = 'Resume';
        startPauseBtn.classList.remove('success');
        startPauseBtn.setAttribute('aria-pressed', 'false');
        render();
      }
    }

    function reset(){
      cancelAnimationFrame(rafId);
      running = false; startTime = 0; elapsed = 0; laps = [];
      startPauseBtn.textContent = 'Start';
      startPauseBtn.classList.remove('success');
      lapBtn.disabled = true; resetBtn.disabled = true; clearLapsBtn.disabled = true;
      display.textContent = '00:00:00.00';
      tbody.innerHTML = `<tr><td colspan="4" class="tiny">No laps yet. Press <span class="kbd">L</span> while running.</td></tr>`;
    }

    function addLap(){
      const total = running ? (performance.now() - startTime) + elapsed : elapsed;
      const prevTotal = laps.length ? laps[laps.length-1].total : 0;
      const split = total - prevTotal;
      laps.push({ total, split });
      renderLaps();
    }

    function removeLap(index){
      laps.splice(index,1);
      renderLaps();
    }

    function clearLaps(){
      laps = []; renderLaps();
    }

    function renderLaps(){
      clearLapsBtn.disabled = laps.length === 0;
      if(laps.length === 0){
        tbody.innerHTML = `<tr><td colspan="4" class="tiny">No laps yet. Press <span class="kbd">L</span> while running.</td></tr>`;
        return;
      }
      tbody.innerHTML = laps.map((lap, i)=>{
        return `<tr>
          <td><span class="pill">${i+1}</span></td>
          <td>${formatTime(lap.total)}</td>
          <td>${formatTime(lap.split)}</td>
          <td class="right"><button class="btn ghost" data-remove="${i}">Delete</button></td>
        </tr>`;
      }).join('');
    }

    function exportCSV(){
      if(laps.length === 0){ alert('No laps to export yet.'); return; }
      const header = 'Lap,Total,Split\n';
      const rows = laps.map((lap,i)=>`${i+1},${formatTime(lap.total)},${formatTime(lap.split)}`).join('\n');
      const csv = header + rows + '\n';
      const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'laps.csv'; a.click();
      setTimeout(()=>URL.revokeObjectURL(url), 1000);
    }

    // --- Events ---
    startPauseBtn.addEventListener('click', ()=>{
      if(!running){
        // starting fresh or resuming
        startTime = performance.now();
        setRunning(true);
      } else {
        setRunning(false);
      }
    });
    lapBtn.addEventListener('click', ()=> running && addLap());
    resetBtn.addEventListener('click', reset);
    clearLapsBtn.addEventListener('click', clearLaps);
    exportBtn.addEventListener('click', exportCSV);

    tbody.addEventListener('click', (e)=>{
      const btn = e.target.closest('button[data-remove]');
      if(!btn) return;
      const idx = Number(btn.getAttribute('data-remove'));
      removeLap(idx);
    });

    // Keyboard shortcuts
    window.addEventListener('keydown', (e)=>{
      if(e.target && ['INPUT','TEXTAREA'].includes(e.target.tagName)) return;
      if(e.code === 'Space') { e.preventDefault(); startPauseBtn.click(); }
      else if(e.key.toLowerCase() === 'l') { e.preventDefault(); lapBtn.click(); }
      else if(e.key.toLowerCase() === 'r') { e.preventDefault(); resetBtn.click(); }
    });

    // Initialize
    render();
  