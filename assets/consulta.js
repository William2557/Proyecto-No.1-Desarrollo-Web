
async function loadDB(){
  await window.initSqlJsPromise;
  const res = await fetch('residencial.db');
  const buf = await res.arrayBuffer();
  const SQL = await window.initSqlJsPromise;
  return new SQL.Database(new Uint8Array(buf));
}
function monthNow(){ const d = new Date(); return { y: d.getFullYear(), m: d.getMonth()+1 }; }
function statusMsg(ok, text){ const el = document.getElementById('status'); el.textContent = text; el.style.color = ok ? '#16a34a' : '#f59e0b'; }
async function validarIdentidad(db, data){
  const stmt = db.prepare(`SELECT 1 FROM Inquilino WHERE DPI = :dpi AND NumeroCasa = :casa AND lower(PrimerNombre) = lower(:nom) AND lower(PrimerApellido) = lower(:ape) AND FechaNacimiento = :fn`);
  stmt.bind({ ':dpi': data.dpi.replaceAll(' ','').trim(), ':casa': parseInt(data.casa,10), ':nom': data.nombre.trim(), ':ape': data.apellido.trim(), ':fn': data.fnac });
  const ok = stmt.step(); stmt.free(); return ok;
}
async function estaAlDia(db, casa, y, m){
  const stmt = db.prepare(`SELECT 1 FROM PagoDeCuotas WHERE NumeroCasa = :casa AND Anio = :y AND Mes = :m`);
  stmt.bind({':casa': parseInt(casa,10), ':y': y, ':m': m});
  const ok = stmt.step(); stmt.free(); return ok;
}
async function historial(db, casa, ym1, ym2){
  const [y1,m1] = ym1.split('-').map(Number); const [y2,m2] = ym2.split('-').map(Number);
  const stmt = db.prepare(`SELECT Anio, Mes, FechaPago FROM PagoDeCuotas WHERE NumeroCasa = :casa AND (Anio*12+Mes) BETWEEN (:y1*12+:m1) AND (:y2*12+:m2) ORDER BY Anio DESC, Mes DESC`);
  stmt.bind({':casa': parseInt(casa,10), ':y1': y1, ':m1': m1, ':y2': y2, ':m2': m2});
  const rows = []; while(stmt.step()) rows.push(stmt.getAsObject()); stmt.free(); return rows;
}
function renderTabla(rows){
  if(!rows.length) return '<p class="muted">Sin pagos en el rango seleccionado.</p>';
  let html = '<table><thead><tr><th>Año</th><th>Mes</th><th>Fecha de Pago</th></tr></thead><tbody>';
  for(const r of rows){ html += `<tr><td>${r.Anio}</td><td>${r.Mes}</td><td>${r.FechaPago}</td></tr>`; } html += '</tbody></table>'; return html;
}
document.addEventListener('DOMContentLoaded', ()=>{
  const frm = document.getElementById('frm');
  frm.addEventListener('submit', async (e)=>{
    e.preventDefault(); const data = Object.fromEntries(new FormData(frm).entries());
    if(!frm.reportValidity()) return;
    try{
      const db = await loadDB(); const ok = await validarIdentidad(db, data);
      if(!ok){ statusMsg(false, 'Datos no válidos. Verifique su información.'); db.close(); return; }
      const now = monthNow(); const pago = await estaAlDia(db, data.casa, now.y, now.m);
      if(pago) statusMsg(true, 'Cuota de mantenimiento al día'); else statusMsg(false, 'Cuota de mantenimiento pendiente');
      db.close();
    }catch(err){ console.error(err); statusMsg(false, 'Error al consultar. Intente de nuevo.'); }
  });
  document.getElementById('btnHist').addEventListener('click', async ()=>{
    const casa = document.getElementById('casa').value; const d = document.getElementById('desde').value; const h = document.getElementById('hasta').value;
    if(!casa){ alert('Ingrese primero su Número de Casa en el formulario superior.'); return; }
    if(!d || !h){ alert('Seleccione el rango (desde/hasta).'); return; }
    const db = await loadDB(); const rows = await historial(db, casa, d, h);
    document.getElementById('hist').innerHTML = renderTabla(rows); db.close();
  });
});
