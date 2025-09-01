
async function loadDB(){
  await window.initSqlJsPromise;
  const res = await fetch('residencial.db');
  const buf = await res.arrayBuffer();
  const SQL = await window.initSqlJsPromise;
  return new SQL.Database(new Uint8Array(buf));
}
function fmtDate(iso){
  const d = new Date(iso+'T00:00:00');
  return d.toLocaleDateString('es-GT', { year:'numeric', month:'short', day:'2-digit' });
}
async function loadNews(){
  try{
    const db = await loadDB();
    const stmt = db.prepare(`SELECT Fecha, Noticia FROM Noticias ORDER BY Fecha DESC LIMIT 3`);
    const container = document.getElementById('newsList');
    while(stmt.step()){
      const {Fecha, Noticia} = stmt.getAsObject();
      const item = document.createElement('div'); item.className = 'news-item';
      item.innerHTML = `<div class="news-date">${fmtDate(Fecha)}</div><div class="news-text">${Noticia}</div>`;
      container.appendChild(item);
    }
    db.close();
  }catch(err){ console.error(err); }
}
document.addEventListener('DOMContentLoaded', loadNews);
