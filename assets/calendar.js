
async function loadDB(){
  await window.initSqlJsPromise;
  const res = await fetch('residencial.db');
  const buf = await res.arrayBuffer();
  const SQL = await window.initSqlJsPromise;
  return new SQL.Database(new Uint8Array(buf));
}
const MES_N = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
function fmt(iso){ const d = new Date(iso + 'T00:00:00'); return d.toLocaleDateString('es-GT', {weekday:'long', year:'numeric', month:'long', day:'numeric'}); }
function weekDayIndex(date){ let jsIdx = date.getDay(); return (jsIdx + 6) % 7; }
function fillSelectors(){
  const now = new Date();
  const mSel = document.getElementById('mes');
  const ySel = document.getElementById('anio');
  MES_N.forEach((m,i)=>{ const opt = document.createElement('option'); opt.value=i+1; opt.textContent=m; if(i===now.getMonth()) opt.selected=true; mSel.appendChild(opt); });
  const y = now.getFullYear(); for(let yy=y-2; yy<=y+2; yy++){ const opt = document.createElement('option'); opt.value=yy; opt.textContent=yy; if(yy===y) opt.selected=true; ySel.appendChild(opt); }
}
async function renderCalendar(){
  const mes = parseInt(document.getElementById('mes').value,10);
  const anio = parseInt(document.getElementById('anio').value,10);
  const first = new Date(anio, mes-1, 1);
  const last = new Date(anio, mes, 0);
  const grid = document.getElementById('calGrid'); grid.innerHTML='';
  const blanks = weekDayIndex(first);
  for(let i=0;i<blanks;i++){ const d = document.createElement('div'); d.className='day'; d.style.visibility='hidden'; grid.appendChild(d); }
  const db = await loadDB();
  const q = db.prepare(`SELECT Fecha, Titulo, Descripcion FROM Calendario WHERE substr(Fecha,1,7) = :ym`);
  const ym = `${anio}-${String(mes).padStart(2,'0')}`; q.bind({':ym': ym});
  const byDate = {}; while(q.step()){ const row = q.getAsObject(); (byDate[row.Fecha] ||= []).push(row); }
  for(let d=1; d<=last.getDate(); d++){
    const iso = `${anio}-${String(mes).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const cell = document.createElement('div'); cell.className='day'; cell.innerHTML = `<div class="date">${d}</div>`;
    (byDate[iso]||[]).forEach(ev => { const a = document.createElement('div'); a.className='event'; a.textContent = ev.Titulo; a.onclick = () => showEvent(ev); cell.appendChild(a); });
    grid.appendChild(cell);
  }
  db.close();
}
function showEvent(ev){
  const dlg = document.getElementById('dlg');
  document.getElementById('dlgTitle').textContent = ev.Titulo;
  document.getElementById('dlgDate').textContent = fmt(ev.Fecha);
  document.getElementById('dlgDesc').textContent = ev.Descripcion;
  dlg.showModal();
}
document.addEventListener('DOMContentLoaded', ()=>{
  fillSelectors(); renderCalendar(); document.getElementById('btnCargar').addEventListener('click', renderCalendar);
});
