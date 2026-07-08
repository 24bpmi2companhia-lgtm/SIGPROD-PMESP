const KEY='sigprod_pmesp_local_v1';
const APP_VERSION='4.0';
let state=loadState();
let editingPM=null, editingLanc=null;

const principais=['Pessoas','Carros','Motos','Ônibus','Caminhões','Condutores','Moto Apree.','Veiculos Apre.','AI Confec.','Presos','Mandados','Armas Fogo','Arma Branca','Tráfico','Porte','Apree. Drogas','BOPM Elabo.','Oc. Atendida'];
const comparativoFields=['Pessoas','Carros','Motos','Condutores','AI Confec.','Presos','Mandados','Armas Fogo','Arma Branca','Tráfico','Porte','Apree. Drogas','BOPM Elabo.','Oc. Atendida'];
const csvLabels={data:'Data',tipo:'Tipo',re:'RE',policial:'Policial',equipe:'Equipe',observacao:'Observação'};

function clone(o){return JSON.parse(JSON.stringify(o||{}))}
function loadState(){const raw=localStorage.getItem(KEY); let s=raw?JSON.parse(raw):clone(window.SIGPROD_SEED); return migrateState(s)}
function persist(){state.versao=APP_VERSION; localStorage.setItem(KEY,JSON.stringify(state)); refreshAll(); flashSave()}
function flashSave(){const el=document.getElementById('saveStatus'); if(!el) return; el.textContent='Banco salvo no navegador deste PC às '+new Date().toLocaleTimeString('pt-BR'); setTimeout(()=>{el.textContent='Banco local ativo. Faça backup JSON antes de atualizar.'},3500)}
function br(n){return Number(n||0).toLocaleString('pt-BR')}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function today(){return new Date().toISOString().slice(0,10)}
function monthStart(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`}
function cssId(s){return String(s).replace(/[^a-z0-9]/gi,'_')}
function isRE(s){return /^[0-9]{5,6}-[0-9A-Z]$/i.test(String(s||'').trim())}
function validRE(s){return isRE(s)}
function isGrad(s){return /PM|Subten|Sgt|Cb|Sd|Cap|Ten|Maj|Cel/i.test(String(s||''))}
function cleanText(s){return String(s||'').replaceAll('�','').normalize('NFC').trim()}
function normName(s){return cleanText(s).toUpperCase()}
function normKey(s){return normName(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Z0-9]/g,'')}
function normalizeGrad(g){g=cleanText(g); const k=normKey(g); if(!g||k==='PM') return 'PM'; if(k==='CBPM'||k==='CB') return 'Cb PM'; if(k==='SDPM'||k==='SD') return 'Sd PM'; if(k==='SUBTENPM'||k==='SUBTEN') return 'Subten PM'; if(k==='1SGTPM'||k==='1SGT') return '1º Sgt PM'; if(k==='2SGTPM'||k==='2SGT'||k==='SGT') return '2º Sgt PM'; if(k==='3SGTPM'||k==='3SGT') return '3º Sgt PM'; if(k==='CAPPM'||k==='CAP') return 'Cap PM'; if(k==='1TENPM'||k==='1TEN') return '1º Ten PM'; if(k==='2TENPM'||k==='2TEN') return '2º Ten PM'; return g}
function showPage(id){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));document.getElementById(id).classList.add('active');document.querySelectorAll('.nav').forEach(b=>b.classList.toggle('active',b.dataset.page===id));refreshAll()}

document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>showPage(b.dataset.page));

function buildIndexes(s){
  const byRE={}, byName={};
  (s.efetivo||[]).forEach(p=>{
    if(validRE(p.re)) byRE[String(p.re).trim().toUpperCase()]=p;
    if(p.qra){ const k=normKey(p.qra); if(k && !byName[k]) byName[k]=p; }
  });
  return {byRE,byName};
}
function mergeSeedEfetivo(s){
  const seedEf=(window.SIGPROD_SEED&&window.SIGPROD_SEED.efetivo)||[];
  const {byRE,byName}=buildIndexes(s);
  seedEf.forEach(sp=>{
    sp={...sp,grad:normalizeGrad(sp.grad),qra:normName(sp.qra),re:String(sp.re||'').trim().toUpperCase()};
    const target=(validRE(sp.re)&&byRE[sp.re]) || byName[normKey(sp.qra)];
    if(target){
      if(!isGrad(target.grad) || normalizeGrad(target.grad)==='PM') target.grad=sp.grad;
      if(!target.re && sp.re) target.re=sp.re;
      if(!target.qra || isRE(target.qra) || /^\d+$/.test(String(target.qra))) target.qra=sp.qra;
      if(!target.status) target.status=sp.status||'ATIVO';
    }else{
      s.efetivo.push({...sp});
    }
  });
}
function migrateState(s){
  s.efetivo=s.efetivo||[]; s.lancamentos=s.lancamentos||[]; s.metricas=s.metricas||principais; s.tipos=s.tipos||[]; s.equipes=s.equipes||[];
  s.efetivo=s.efetivo.map((p,idx)=>{
    p={...p};
    if(!isGrad(p.grad) && isGrad(p.re) && isRE(p.qra)){ const re=String(p.qra).trim().toUpperCase(); p.grad=p.re; p.re=re; p.qra=p.nome||re; }
    p.re=validRE(p.re)?String(p.re).trim().toUpperCase():'';
    p.qra=normName(p.qra||p.nome||'');
    p.grad=normalizeGrad(p.grad||'PM');
    if(!p.id) p.id=String(idx+1);
    if(!p.status) p.status='ATIVO';
    return p;
  });
  mergeSeedEfetivo(s);
  const idx=buildIndexes(s);
  s.lancamentos.forEach(r=>{
    r.data=String(r.data||'').slice(0,10);
    r.tipo=cleanText(r.tipo||'').replace('SUPERVSIÃO','SUPERVISÃO').replace('DELEG OU DEJEM','DELEGADA / DEJEM').replace('DELEG ou DEJEM','DELEGADA / DEJEM');
    r.re=validRE(r.re)?String(r.re).trim().toUpperCase():'';
    r.qra=normName(r.qra);
    let p=(r.re&&idx.byRE[r.re]) || idx.byName[normKey(r.qra)];
    if(p){ r.re=p.re||r.re; r.qra=p.qra; }
    else if(r.qra){
      const np={id:'auto_'+normKey(r.qra),grad:'PM',re:r.re||'',qra:r.qra,equipe:r.equipe||'',status:'ATIVO'};
      s.efetivo.push(np); idx.byName[normKey(np.qra)]=np; if(np.re) idx.byRE[np.re]=np;
    }
    principais.forEach(m=>{ r[m]=Number(r[m]||0); });
  });
  s.tipos=[...new Set([...(window.SIGPROD_SEED?.tipos||[]),...s.tipos,...s.lancamentos.map(x=>x.tipo).filter(Boolean)])].map(t=>cleanText(t).replace('DELEG OU DEJEM','DELEGADA / DEJEM').replace('DELEG ou DEJEM','DELEGADA / DEJEM')).filter(x=>x&&x!=='#N/A');
  s.versao=APP_VERSION;
  return s;
}

function activePMs(){return [...state.efetivo].filter(p=>p.status==='ATIVO').sort((a,b)=>displayPM(a).localeCompare(displayPM(b),'pt-BR'))}
function allTipos(){return [...new Set([...(state.tipos||[]),...state.lancamentos.map(x=>x.tipo).filter(Boolean)])].filter(x=>x&&x!=='#N/A').sort((a,b)=>a.localeCompare(b,'pt-BR'))}
function allEquipes(){return [...new Set([...(state.equipes||[]),...state.efetivo.map(p=>p.equipe).filter(Boolean),...state.lancamentos.map(x=>x.equipe).filter(Boolean)])].sort((a,b)=>a.localeCompare(b,'pt-BR'))}
function pmByRE(re){return validRE(re)?state.efetivo.find(p=>p.re===re):null}
function pmByName(qra){return state.efetivo.find(p=>normKey(p.qra)===normKey(qra))}
function displayPM(p){return p ? `${normalizeGrad(p.grad)||'PM'} ${p.qra||''}${p.re?` - ${p.re}`:''}`.trim() : ''}
function displayRec(r){const p=pmByRE(r.re)||pmByName(r.qra); return p?displayPM(p):`${r.qra||'Sem policial'}${r.re?` - ${r.re}`:''}`}
function recPMKey(r){const p=pmByRE(r.re)||pmByName(r.qra); return p?(p.re||normKey(p.qra)):(r.re||normKey(r.qra)||'Sem informação')}
function setSelect(id,arr,all='Todos'){const el=document.getElementById(id); if(!el) return; const val=el.value; el.innerHTML=`<option value="">${all}</option>`+arr.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join(''); if([...el.options].some(o=>o.value===val)) el.value=val}
function fillSelects(){
  const pols=activePMs().map(p=>({v:p.re||p.qra,t:displayPM(p)}));
  ['fPol'].forEach(id=>{const el=document.getElementById(id); if(el){const val=el.value; el.innerHTML='<option value="">Todos</option>'+pols.map(p=>`<option value="${esc(p.v)}">${esc(p.t)}</option>`).join(''); if([...el.options].some(o=>o.value===val)) el.value=val}});
  ['fTipo','dashTipo','rTipo'].forEach(id=>setSelect(id,allTipos(),'Todos')); setSelect('fEquipe',allEquipes(),'Todas')
}
function buildLancForm(){
  const f=document.getElementById('formLanc'); if(!f) return; const metrics=principais.filter(m=>state.metricas.includes(m));
  f.innerHTML=`<label>Data do serviço<input type="date" id="lData" required></label><label>Policial<select id="lPol"></select></label><label>Tipo de policiamento<select id="lTipo"></select></label><label>Equipe/Viatura<input id="lEquipe" placeholder="Ex.: RP, DEJEM, Equipe A"></label>`+metrics.map(m=>`<label>${esc(m)}<input type="number" min="0" value="0" id="m_${cssId(m)}"></label>`).join('')+`<label style="grid-column:1/-1">Observações<textarea id="lObs" placeholder="Observações do relatório de serviço"></textarea></label>`;
  document.getElementById('lData').value=today();
  document.getElementById('lPol').innerHTML=activePMs().map(p=>`<option value="${esc(p.re||p.qra)}" data-re="${esc(p.re||'')}" data-qra="${esc(p.qra||'')}">${esc(displayPM(p))}</option>`).join('');
  document.getElementById('lTipo').innerHTML=allTipos().map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join('')
}
function clearLanc(){editingLanc=null; buildLancForm()}
document.getElementById('novoLanc').onclick=clearLanc;
document.getElementById('salvarLanc').onclick=e=>{e.preventDefault(); const sel=document.getElementById('lPol'); if(!sel.value){alert('Selecione o policial.');return} const rec= editingLanc ? state.lancamentos.find(x=>x.id===editingLanc) : {id:String(Date.now())}; rec.data=lData.value; rec.tipo=lTipo.value; rec.re=sel.selectedOptions[0]?.dataset.re||''; rec.qra=sel.selectedOptions[0]?.dataset.qra||sel.selectedOptions[0]?.textContent||sel.value; rec.equipe=lEquipe.value; rec.observacao=lObs.value; rec.cadastro=today(); state.metricas.forEach(m=>{const el=document.getElementById('m_'+cssId(m)); if(el) rec[m]=Number(el.value||0)}); if(!editingLanc) state.lancamentos.push(rec); editingLanc=null; persist(); alert('Lançamento salvo.')}
function editLanc(id){const r=state.lancamentos.find(x=>x.id==id); if(!r) return; showPage('lancar'); editingLanc=String(id); setTimeout(()=>{lData.value=r.data||today(); lTipo.value=r.tipo||''; lPol.value=r.re||r.qra||''; lEquipe.value=r.equipe||''; lObs.value=r.observacao||''; state.metricas.forEach(m=>{const el=document.getElementById('m_'+cssId(m)); if(el) el.value=Number(r[m]||0)})},0)}
function delLanc(id){if(confirm('Excluir este lançamento?')){state.lancamentos=state.lancamentos.filter(x=>x.id!=id);persist()}}
function between(r,ini,fim,tipo,pol,equipe){const okPol=!pol || r.re===pol || r.qra===pol || recPMKey(r)===pol; return (!ini||r.data>=ini)&&(!fim||r.data<=fim)&&(!tipo||r.tipo===tipo)&&okPol&&(!equipe||r.equipe===equipe)}
function dataConsulta(){return state.lancamentos.filter(r=>between(r,fIni.value,fFim.value,fTipo.value,fPol.value,fEquipe.value))}
function dataDash(){return state.lancamentos.filter(r=>between(r,dashIni.value,dashFim.value,dashTipo.value,'',''))}
function dataRank(){return state.lancamentos.filter(r=>between(r,rIni.value,rFim.value,rTipo.value,'',''))}
function sum(arr,field){return arr.reduce((a,r)=>a+Number(r[field]||0),0)}
function table(id,heads,rows){const el=document.getElementById(id); if(!el) return; el.innerHTML='<thead><tr>'+heads.map(h=>`<th>${esc(h)}</th>`).join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(c=>`<td>${c}</td>`).join('')+'</tr>').join('')+'</tbody>'}
function group(arr,key,fields){const m={}; arr.forEach(r=>{const k=key==='policial'?recPMKey(r):(r[key]||'Sem informação'); if(!m[k]){m[k]={reg:0,label:key==='policial'?displayRec(r):k}; fields.forEach(f=>m[k][f]=0)} m[k].reg++; fields.forEach(f=>m[k][f]+=Number(r[f]||0))}); return m}
function rank(arr,field,limit=15){const g=group(arr,'policial',[field]); return Object.entries(g).sort((a,b)=>b[1][field]-a[1][field]).slice(0,limit).map(([k,v],i)=>[i+1,esc(v.label),br(v[field])])}
function countRank(arr,limit=15){const m={}; arr.forEach(r=>{const k=recPMKey(r); if(!m[k])m[k]={n:0,label:displayRec(r)}; m[k].n++}); return Object.entries(m).sort((a,b)=>b[1].n-a[1].n).slice(0,limit).map(([k,v],i)=>[i+1,esc(v.label),br(v.n)])}
function cards(id,arr){document.getElementById(id).innerHTML=arr.map(c=>`<div class="card"><span>${esc(c[0])}</span><strong>${br(c[1])}</strong></div>`).join('')}
function shiftYear(dateStr,delta){if(!dateStr) return ''; const [y,m,d]=dateStr.split('-').map(Number); return `${y+delta}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`}
function samePeriodPrevious(ini,fim,tipo,pol='',equipe=''){return state.lancamentos.filter(r=>between(r,shiftYear(ini,-1),shiftYear(fim,-1),tipo,pol,equipe))}
function pct(cur,prev){if(!prev && !cur) return '0%'; if(!prev) return '+100%'; const v=((cur-prev)/prev)*100; return `${v>=0?'+':''}${v.toFixed(1).replace('.',',')}%`}
function comparativoTable(id,cur,prev){table(id,['Indicador','Período atual','Ano anterior','Diferença','Variação'],comparativoFields.map(f=>{const a=sum(cur,f),b=sum(prev,f); return [esc(f),br(a),br(b),br(a-b),pct(a,b)]}))}
function refreshDashboard(){const d=dataDash(); const prev=samePeriodPrevious(dashIni.value,dashFim.value,dashTipo.value); cards('dashCards',[['Registros',d.length],['Pessoas',sum(d,'Pessoas')],['Veículos',sum(d,'Carros')+sum(d,'Motos')+sum(d,'Ônibus')+sum(d,'Caminhões')],['AI confeccionados',sum(d,'AI Confec.')],['Presos',sum(d,'Presos')],['BOPM',sum(d,'BOPM Elabo.')]]); comparativoTable('dashComparativo',d,prev); table('dashRankPessoas',['#','Policial','Pessoas'],rank(d,'Pessoas',10)); table('dashRankAparece',['#','Policial','Lançamentos'],countRank(d,10)); barChart('chartTipo',Object.entries(group(d,'tipo',['Pessoas'])).map(([k,v])=>[v.label||k,v.Pessoas]).sort((a,b)=>b[1]-a[1]).slice(0,12)); const mes={}; d.forEach(r=>{const k=(r.data||'').slice(0,7); if(k) mes[k]=(mes[k]||0)+Number(r.Pessoas||0)}); barChart('chartMes',Object.entries(mes).sort().slice(-12));}
function barChart(id,items){const max=Math.max(1,...items.map(x=>x[1])); document.getElementById(id).innerHTML=items.map(([k,v])=>`<div class="barrow"><div class="barlabel" title="${esc(k)}">${esc(k)}</div><div class="bartrack"><div class="barfill" style="width:${Math.max(2,(v/max)*100)}%"></div></div><div class="barval">${br(v)}</div></div>`).join('') || '<p>Sem dados no período.</p>'}
function refreshConsultas(){const d=dataConsulta(); const prev=samePeriodPrevious(fIni.value,fFim.value,fTipo.value,fPol.value,fEquipe.value); cards('relCards',[['Registros',d.length],['Pessoas',sum(d,'Pessoas')],['Carros',sum(d,'Carros')],['Motos',sum(d,'Motos')],['Presos',sum(d,'Presos')],['Mandados',sum(d,'Mandados')],['AI',sum(d,'AI Confec.')],['BOPM',sum(d,'BOPM Elabo.')],['Ocorrências',sum(d,'Oc. Atendida')],['Drogas',sum(d,'Apree. Drogas')],['Armas fogo',sum(d,'Armas Fogo')],['Tráfico',sum(d,'Tráfico')]]); comparativoTable('relComparativo',d,prev); const fields=['Pessoas','Carros','Motos','AI Confec.','Presos','BOPM Elabo.']; const gp=group(d,'policial',fields); table('resumoPolicial',['Policial','Reg.','Pessoas','Carros','Motos','AI','Presos','BOPM'],Object.entries(gp).sort((a,b)=>b[1].Pessoas-a[1].Pessoas).map(([k,v])=>[esc(v.label),v.reg,br(v.Pessoas),br(v.Carros),br(v.Motos),br(v['AI Confec.']),br(v.Presos),br(v['BOPM Elabo.'])])); const gt=group(d,'tipo',fields); table('resumoTipo',['Tipo','Reg.','Pessoas','Carros','Motos','AI','Presos','BOPM'],Object.entries(gt).sort((a,b)=>b[1].reg-a[1].reg).map(([k,v])=>[esc(v.label||k),v.reg,br(v.Pessoas),br(v.Carros),br(v.Motos),br(v['AI Confec.']),br(v.Presos),br(v['BOPM Elabo.'])])); table('registros',['Data','Tipo','RE','Policial','Equipe','Pessoas','Carros','Motos','AI','Presos','BOPM','Ações'],d.slice(-1000).reverse().map(r=>[esc(formatDateBR(r.data)),esc(r.tipo),esc(r.re),esc(displayRec(r)),esc(r.equipe),br(r.Pessoas),br(r.Carros),br(r.Motos),br(r['AI Confec.']),br(r.Presos),br(r['BOPM Elabo.']),`<button onclick="editLanc('${r.id}')">Editar</button> <button class="danger" onclick="delLanc('${r.id}')">Excluir</button>`]));}
function refreshRankings(){const d=dataRank(); const fields=['Pessoas','Carros','Motos','Condutores','AI Confec.','Presos','Mandados','Armas Fogo','Tráfico','Apree. Drogas','BOPM Elabo.','Oc. Atendida']; document.getElementById('rankingGrid').innerHTML=fields.map(f=>`<div class="panel"><h3>${esc(f)}</h3><table id="rank_${cssId(f)}"></table></div>`).join(''); fields.forEach(f=>table('rank_'+cssId(f),['#','Policial','Total'],rank(d,f,10))) }
function refreshEfetivo(){table('tEfetivo',['Grad','RE','Nome/QRA','Exibição','Equipe','Status','Ações'],state.efetivo.map((p,i)=>[esc(normalizeGrad(p.grad)),esc(p.re),esc(p.qra),esc(displayPM(p)),esc(p.equipe||''),`<span class="pill">${esc(p.status)}</span>`,`<button onclick="editPM(${i})">Editar</button> <button onclick="statusPM(${i},'TRANSFERIDO')">Transferido</button> <button onclick="statusPM(${i},'ATIVO')">Ativar</button>`])); refreshConferencia()}
function editPM(i){const p=state.efetivo[i]; editingPM=i; pmGrad.value=normalizeGrad(p.grad); pmRE.value=p.re; pmQRA.value=p.qra; pmEquipe.value=p.equipe||''; pmStatus.value=p.status}
function statusPM(i,s){state.efetivo[i].status=s; persist()}
document.getElementById('salvarPM').onclick=e=>{e.preventDefault(); const old=editingPM!==null?state.efetivo[editingPM]:null; const p={id:old?.id||String(Date.now()),grad:normalizeGrad(pmGrad.value.trim()),re:validRE(pmRE.value)?pmRE.value.trim().toUpperCase():'',qra:normName(pmQRA.value),equipe:pmEquipe.value.trim(),status:pmStatus.value}; if(!p.qra){alert('Informe o nome/QRA.'); return} if(editingPM!==null){state.efetivo[editingPM]=p; state.lancamentos.forEach(r=>{if((p.re&&r.re===p.re)||normKey(r.qra)===normKey(p.qra)){r.re=p.re; r.qra=p.qra}}); editingPM=null}else state.efetivo.push(p); pmGrad.value=pmRE.value=pmQRA.value=pmEquipe.value=''; pmStatus.value='ATIVO'; persist()}
function refreshUltimos(){table('ultimos',['Data','Tipo','Policial','Pessoas','Carros','Motos','BOPM'],state.lancamentos.slice(-25).reverse().map(r=>[esc(formatDateBR(r.data)),esc(r.tipo),esc(displayRec(r)),br(r.Pessoas),br(r.Carros),br(r.Motos),br(r['BOPM Elabo.'])]))}
function refreshConferencia(){const rows=state.efetivo.filter(p=>!isGrad(p.grad)||normalizeGrad(p.grad)==='PM'||!p.qra).map((p,i)=>[esc(p.grad||''),esc(p.re||''),esc(p.qra||''),`<button onclick="editPM(${state.efetivo.indexOf(p)})">Corrigir</button>`]); table('conferenciaEfetivo',['Graduação atual','RE','Nome/QRA','Ação'],rows.length?rows:[["Tudo certo","","Nenhum policial sem graduação aparente",""]])}
function download(name,text,type='text/plain'){const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type})); a.download=name; a.click()}
function formatDateBR(s){if(!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return s||''; const [y,m,d]=s.split('-'); return `${d}/${m}/${y}`}
function csvEscape(v){return '="'+String(v??'').replaceAll('"','""').replaceAll('\n',' ')+'"'}
function csvFrom(rows){const cols=['data','tipo','re','policial','equipe',...principais.filter(m=>state.metricas.includes(m)),'observacao']; const head='sep=;\r\n'+cols.map(c=>csvLabels[c]||c).join(';'); const body=rows.map(r=>cols.map(c=>{let v=c==='policial'?displayRec(r):(c==='data'?formatDateBR(r.data):r[c]); return csvEscape(v)}).join(';')).join('\r\n'); return '\ufeff'+head+'\r\n'+body}
function htmlExcel(rows){const cols=['data','tipo','re','policial','equipe',...principais.filter(m=>state.metricas.includes(m)),'observacao']; const th=cols.map(c=>`<th>${esc(csvLabels[c]||c)}</th>`).join(''); const trs=rows.map(r=>'<tr>'+cols.map(c=>{let v=c==='policial'?displayRec(r):(c==='data'?formatDateBR(r.data):r[c]); return `<td style="mso-number-format:'\\@';">${esc(v)}</td>`}).join('')+'</tr>').join(''); return `<!doctype html><html><head><meta charset="utf-8"><style>table{border-collapse:collapse}td,th{border:1px solid #999;padding:4px}th{background:#0b347c;color:#fff}</style></head><body><table>${th}${trs}</table></body></html>`}
function exportExcelFiltrado(){download('relatorio_filtrado_SIGPROD.xls',htmlExcel(dataConsulta()),'application/vnd.ms-excel;charset=utf-8')}
function exportExcelTudo(){download('lancamentos_SIGPROD.xls',htmlExcel(state.lancamentos),'application/vnd.ms-excel;charset=utf-8')}
exportarJson.onclick=()=>download('backup_SIGPROD.json',JSON.stringify(state,null,2),'application/json');
exportarTudoCsv.onclick=()=>download('lancamentos_SIGPROD.csv',csvFrom(state.lancamentos),'text/csv;charset=utf-8');
exportarTudoXls.onclick=exportExcelTudo;
btnCsv.onclick=()=>download('relatorio_filtrado_SIGPROD.csv',csvFrom(dataConsulta()),'text/csv;charset=utf-8');
btnXls.onclick=exportExcelFiltrado;
importJson.onchange=e=>{const f=e.target.files[0]; if(!f) return; const rd=new FileReader(); rd.onload=()=>{state=migrateState(JSON.parse(rd.result)); persist(); alert('Backup importado.')}; rd.readAsText(f)};
resetar.onclick=()=>{if(confirm('Restaurar a base inicial importada do Excel? Isso não apaga o backup que você já exportou.')){localStorage.removeItem(KEY); state=migrateState(clone(window.SIGPROD_SEED)); persist()}}
dashAtualizar.onclick=refreshDashboard; btnFiltrar.onclick=refreshConsultas; rAtualizar.onclick=refreshRankings;
function initDates(){['dashIni','fIni','rIni'].forEach(id=>{const el=document.getElementById(id); if(el&&!el.value) el.value=monthStart()}); ['dashFim','fFim','rFim'].forEach(id=>{const el=document.getElementById(id); if(el&&!el.value) el.value=today()})}
function refreshAll(){state=migrateState(state); fillSelects(); if(!document.getElementById('formLanc').children.length) buildLancForm(); refreshDashboard(); refreshConsultas(); refreshRankings(); refreshEfetivo(); refreshUltimos(); localStorage.setItem(KEY,JSON.stringify(state))}
initDates(); refreshAll(); if('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js').catch(()=>{});

let deferredInstallPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault(); deferredInstallPrompt=e; const b=document.getElementById('installApp'); if(b) b.style.display='block';});
document.getElementById('installApp')?.addEventListener('click',async()=>{if(!deferredInstallPrompt){alert('Para instalar, publique no GitHub Pages ou abra por um servidor local; em arquivo local o Chrome pode não permitir instalação.');return} deferredInstallPrompt.prompt(); await deferredInstallPrompt.userChoice; deferredInstallPrompt=null; document.getElementById('installApp').style.display='none';});
