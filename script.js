(function(){
'use strict';

var CATS=[
  {id:'food',name:'Food'},{id:'transport',name:'Transport'},{id:'housing',name:'Housing'},
  {id:'bills',name:'Bills'},{id:'health',name:'Health'},{id:'shopping',name:'Shopping'},
  {id:'fun',name:'Fun'},{id:'learning',name:'Learning'},{id:'other',name:'Other'}
];
var CAT_BY_ID={}; CATS.forEach(function(c){CAT_BY_ID[c.id]=c;});

var CURRENCIES=[
  ['INR','Indian Rupee'],['USD','US Dollar'],['EUR','Euro'],['GBP','British Pound'],
  ['JPY','Japanese Yen'],['AED','UAE Dirham'],['AUD','Australian Dollar'],['CAD','Canadian Dollar'],
  ['SGD','Singapore Dollar'],['CHF','Swiss Franc'],['CNY','Chinese Yuan'],['KRW','South Korean Won'],
  ['BRL','Brazilian Real'],['MXN','Mexican Peso'],['ZAR','South African Rand'],['NGN','Nigerian Naira']
];
var CUR_CODES={}; CURRENCIES.forEach(function(c){CUR_CODES[c[0]]=1;});
var REGION_CUR={IN:'INR',US:'USD',GB:'GBP',AE:'AED',AU:'AUD',CA:'CAD',SG:'SGD',CH:'CHF',CN:'CNY',KR:'KRW',
  BR:'BRL',MX:'MXN',ZA:'ZAR',NG:'NGN',JP:'JPY',DE:'EUR',FR:'EUR',ES:'EUR',IT:'EUR',NL:'EUR',IE:'EUR'};
var SCALE={INR:80,JPY:150,KRW:1300,NGN:1500,MXN:18,BRL:5,ZAR:18,CNY:7,AED:3.7,AUD:1.5,CAD:1.35,SGD:1.35,CHF:0.9,GBP:0.8,EUR:0.92,USD:1};

var KEY='tally:v1', mem=null, now=new Date();

/* First browser language that Intl accepts (some setups report invalid tags such as en-US@posix). */
var BASE_LOCALE=(function(){
  var list=(navigator.languages&&navigator.languages.length)?navigator.languages:[navigator.language];
  for(var i=0;i<list.length;i++){
    try{ new Intl.NumberFormat(list[i]); return list[i]; }catch(e){}
  }
  return 'en-US';
})();

function $(id){return document.getElementById(id);}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function pad(n){return n<10?'0'+n:''+n;}
function ymd(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
function parseYmd(s){var a=s.split('-');return new Date(+a[0],+a[1]-1,+a[2]);}
function monthKey(y,m){return y+'-'+pad(m+1);}
function daysIn(y,m){return new Date(y,m+1,0).getDate();}

function guessCurrency(){
  var m=/-([A-Za-z]{2})(?:-|$)/.exec(BASE_LOCALE);
  var region=m?m[1].toUpperCase():'';
  return REGION_CUR[region]||'USD';
}

/* Storage. Two modes:
   - 'server': page opened through server.py, data lives in data.json (via /api/data)
   - 'local' : page opened by double-click (or any other host), data lives in this browser (localStorage) */
var API='/api/data', mode='local', saveChain=Promise.resolve(), saveFailed=false;

function loadLocal(){
  try{var raw=localStorage.getItem(KEY); if(raw) return JSON.parse(raw);}catch(e){}
  return mem;
}
function setStorageNote(isError){
  var el=$('storageNote'); if(!el) return;
  if(isError){
    el.textContent='Could not save to data.json. Is server.py still running?';
    el.style.color='var(--warn)';
  }else{
    el.style.color='';
    el.textContent=mode==='server'
      ?'Your data is saved in data.json, next to server.py.'
      :'Your data stays in this browser. Run server.py to save it in data.json instead.';
  }
}
function persist(){
  var data={expenses:S.expenses,currency:S.currency,budget:S.budget};
  if(mode==='server'){
    var body=JSON.stringify(data);
    // One request at a time, in order, so an older save can never overwrite a newer one.
    saveChain=saveChain.then(function(){
      return fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:body});
    }).then(function(r){
      if(!r.ok) throw new Error('HTTP '+r.status);
      saveFailed=false; setStorageNote(false);
    }).catch(function(){
      setStorageNote(true);
      if(!saveFailed){saveFailed=true; toast('Could not save to data.json. Is server.py still running?');}
    });
  }else{
    mem=data;
    try{localStorage.setItem(KEY,JSON.stringify(data));}catch(e){}
  }
}
function validExpense(e){
  return e && typeof e.id==='string' && typeof e.date==='string' && /^\d{4}-\d{2}-\d{2}$/.test(e.date) &&
    typeof e.amount==='number' && isFinite(e.amount) && e.amount>0 && CAT_BY_ID[e.cat];
}

var S=null;
function buildState(saved){
  saved=saved||{};
  S={
    expenses:Array.isArray(saved.expenses)?saved.expenses.filter(validExpense):[],
    currency:CUR_CODES[saved.currency]?saved.currency:guessCurrency(),
    budget:Number(saved.budget)>0?Number(saved.budget):0,
    y:now.getFullYear(), m:now.getMonth(),
    filter:null, editingBudget:false, lastDeleted:null
  };
}

/* formatting */
function loc(){return S.currency==='INR'?'en-IN':BASE_LOCALE;}
function money(n,digits){
  var o={style:'currency',currency:S.currency};
  if(digits!==undefined){o.minimumFractionDigits=digits;o.maximumFractionDigits=digits;}
  try{return new Intl.NumberFormat(loc(),o).format(n);}catch(e){return S.currency+' '+n.toFixed(2);}
}
function moneyAuto(n){return n>=1000?money(n,0):money(n);}
function symbol(){
  try{
    var p=new Intl.NumberFormat(loc(),{style:'currency',currency:S.currency,currencyDisplay:'narrowSymbol'}).formatToParts(0);
    for(var i=0;i<p.length;i++){if(p[i].type==='currency') return p[i].value;}
  }catch(e){}
  return S.currency;
}
function monthName(y,m,withYear){
  var o=withYear?{month:'long',year:'numeric'}:{month:'long'};
  try{return new Date(y,m,1).toLocaleDateString(loc(),o);}catch(e){return (m+1)+'/'+y;}
}
function parseAmount(s){
  s=String(s).trim().replace(/\s/g,'');
  if(s.indexOf(',')>-1&&s.indexOf('.')===-1) s=s.replace(',','.'); else s=s.replace(/,/g,'');
  var n=parseFloat(s);
  return isFinite(n)?n:NaN;
}

function monthItems(y,m){var k=monthKey(y,m);return S.expenses.filter(function(e){return e.date.indexOf(k)===0;});}
function sum(list){return list.reduce(function(a,e){return a+e.amount;},0);}

/* render */
function render(){
  var cy=now.getFullYear(), cm=now.getMonth();
  var isCurrent=S.y===cy&&S.m===cm;
  var isPast=S.y<cy||(S.y===cy&&S.m<cm);
  var items=monthItems(S.y,S.m), total=sum(items);
  var label=monthName(S.y,S.m,true);

  $('monthLabel').textContent=label;
  $('nextBtn').disabled=!isPast;
  $('sym').textContent=symbol();
  $('currency').value=S.currency;
  $('total').textContent=moneyAuto(total);

  var sub=[];
  if(!items.length){ sub.push('Nothing logged for '+label+' yet.'); }
  else{
    sub.push(items.length+(items.length===1?' expense':' expenses')+' logged.');
    var elapsed=isCurrent?now.getDate():(isPast?daysIn(S.y,S.m):0);
    if(elapsed>0) sub.push('About '+moneyAuto(total/elapsed)+' a day.');
  }
  var pm=S.m===0?11:S.m-1, py=S.m===0?S.y-1:S.y;
  var prevTotal=sum(monthItems(py,pm));
  if(prevTotal>0) sub.push(monthName(py,pm,false)+': '+moneyAuto(prevTotal)+'.');
  $('heroSub').textContent=sub.join(' ');

  var byCat={};
  items.forEach(function(e){byCat[e.cat]=(byCat[e.cat]||0)+e.amount;});
  var cats=CATS.filter(function(c){return byCat[c.id]>0;}).sort(function(a,b){return byCat[b.id]-byCat[a.id];});

  renderRibbon(cats,byCat,total);
  renderBudget(total);
  renderBreakdown(cats,byCat,total);
  renderDaily(items,label);
  renderLedger(items,label);

  if(S.editingBudget){var bi=$('budgetInput'); if(bi){bi.focus();bi.select();}}
}

function renderRibbon(cats,byCat,total){
  var den=S.budget>0?Math.max(S.budget,total):total, h='';
  if(den>0){
    cats.forEach(function(c){
      var g=(byCat[c.id]/den*1000).toFixed(3);
      var dim=S.filter&&S.filter!==c.id?' data-dim="1"':'';
      var txt=c.name+': '+moneyAuto(byCat[c.id]);
      h+='<button class="seg" data-act="cat" data-cat="'+c.id+'"'+dim+' style="--c:var(--c-'+c.id+');flex:'+g+' 1 0" aria-label="'+esc(txt)+'" title="'+esc(txt)+'"></button>';
    });
    if(S.budget>total){h+='<span class="rest" style="flex:'+((S.budget-total)/den*1000).toFixed(3)+' 1 0"></span>';}
  }
  $('ribbon').innerHTML=h;
}

function renderBudget(total){
  var h='';
  if(S.editingBudget){
    h='<label class="lbl" for="budgetInput">Monthly budget</label>'+
      '<input id="budgetInput" class="in small" inputmode="decimal" autocomplete="off" value="'+(S.budget>0?esc(S.budget):'')+'">'+
      '<button class="btn small" data-act="budgetSave">Save budget</button>'+
      '<button class="link" data-act="budgetCancel">Cancel</button>'+
      (S.budget>0?'<button class="link" data-act="budgetClear">Remove budget</button>':'');
  }else if(S.budget>0){
    var left=S.budget-total;
    h=(left>=0?'<span>'+esc(moneyAuto(left))+' left of '+esc(moneyAuto(S.budget))+'</span>'
              :'<span class="over">Over budget by '+esc(moneyAuto(-left))+'</span>')+
      '<button class="link" data-act="budgetEdit">Edit budget</button>';
  }else{
    h='<button class="link" data-act="budgetEdit" style="margin-left:-4px">Set a monthly budget</button>';
  }
  $('budgetRow').innerHTML=h;
}

function renderBreakdown(cats,byCat,total){
  if(!cats.length){
    $('breakBody').innerHTML='<p class="hint">Categories appear here once you add an expense.</p>';
    return;
  }
  var h='<ul class="cats">';
  cats.forEach(function(c){
    var pct=total>0?byCat[c.id]/total*100:0;
    var pressed=S.filter===c.id;
    var dim=S.filter&&!pressed?' dim':'';
    h+='<li><button class="cat'+dim+'" data-act="cat" data-cat="'+c.id+'" aria-pressed="'+pressed+'" style="--c:var(--c-'+c.id+')">'+
       '<span class="dot"></span><span class="nm">'+c.name+'</span>'+
       '<span class="amt">'+esc(moneyAuto(byCat[c.id]))+'</span>'+
       '<span class="pc">'+Math.round(pct)+'%</span>'+
       '<span class="bar"><i style="width:'+pct.toFixed(1)+'%"></i></span></button></li>';
  });
  h+='</ul>';
  $('breakBody').innerHTML=h;
}

function renderDaily(items,label){
  var nd=daysIn(S.y,S.m), per=[], i;
  for(i=0;i<nd;i++) per.push(0);
  items.forEach(function(e){per[+e.date.slice(8,10)-1]+=e.amount;});
  var max=Math.max.apply(null,per), peak=per.indexOf(max);
  var W=nd*10;
  var svg='<svg class="spark" viewBox="0 0 '+W+' 84" role="img" aria-label="Daily spending for '+esc(label)+'">'+
    '<line x1="0" y1="80.5" x2="'+W+'" y2="80.5" stroke="var(--line)" stroke-width="1"/>';
  for(i=0;i<nd;i++){
    if(per[i]<=0) continue;
    var hgt=Math.max(3,per[i]/max*72);
    var d=new Date(S.y,S.m,i+1).toLocaleDateString(loc(),{day:'numeric',month:'short'});
    svg+='<rect x="'+(i*10+1)+'" y="'+(80-hgt).toFixed(1)+'" width="8" height="'+hgt.toFixed(1)+'" rx="1.5" fill="var(--accent)" opacity="'+(i===peak?1:0.45)+'"><title>'+esc(d+': '+moneyAuto(per[i]))+'</title></rect>';
  }
  svg+='</svg><div class="axis" aria-hidden="true"><span>1</span><span>'+nd+'</span></div>';
  var cap;
  if(max>0){
    var pd=new Date(S.y,S.m,peak+1).toLocaleDateString(loc(),{day:'numeric',month:'short'});
    cap='<p class="hint" style="margin-top:8px">Highest day: '+esc(pd)+', '+esc(moneyAuto(max))+'.</p>';
  }else{
    cap='<p class="hint" style="margin-top:8px">Daily totals appear here once you add an expense.</p>';
  }
  $('dailyBody').innerHTML=svg+cap;
}

function renderLedger(items,label){
  var tools='';
  if(S.filter){
    tools+='<span class="chip">'+esc(CAT_BY_ID[S.filter].name)+'<button data-act="clearFilter" aria-label="Show all categories">&times;</button></span>';
  }
  if(S.expenses.length){tools+='<button class="link" data-act="csv">Copy as CSV</button>';}
  $('ledgerTools').innerHTML=tools;

  var list=items.slice();
  if(S.filter) list=list.filter(function(e){return e.cat===S.filter;});
  list.sort(function(a,b){return a.date<b.date?1:a.date>b.date?-1:(a.id<b.id?1:-1);});

  if(!list.length){
    var body;
    if(!S.expenses.length){
      body='<div class="empty"><p>No expenses yet. Add your first one above, or fill Tally with example data to see how it looks.</p><button class="btn ghost" data-act="sample">Load sample data</button></div>';
    }else if(S.filter){
      body='<div class="empty"><p>No '+esc(CAT_BY_ID[S.filter].name)+' expenses in '+esc(label)+'.</p></div>';
    }else{
      body='<div class="empty"><p>No expenses in '+esc(label)+'. Add one above.</p></div>';
    }
    $('ledgerBody').innerHTML=body;
    return;
  }

  var h='', cur=null, daySum={};
  list.forEach(function(e){daySum[e.date]=(daySum[e.date]||0)+e.amount;});
  list.forEach(function(e){
    if(e.date!==cur){
      cur=e.date;
      var dl=parseYmd(e.date).toLocaleDateString(loc(),{weekday:'short',day:'numeric',month:'short'});
      h+='<div class="dayhead"><span>'+esc(dl)+'</span><span>'+esc(moneyAuto(daySum[e.date]))+'</span></div>';
    }
    var c=CAT_BY_ID[e.cat], what=e.note?esc(e.note):c.name;
    h+='<div class="row" style="--c:var(--c-'+c.id+')">'+
       '<span class="dot"></span>'+
       '<div class="who"><div class="what">'+what+'</div>'+(e.note?'<div class="cn">'+c.name+'</div>':'')+'</div>'+
       '<span class="amt">'+esc(money(e.amount))+'</span>'+
       '<button class="del" data-act="del" data-id="'+esc(e.id)+'" aria-label="Delete '+(e.note?esc(e.note):c.name)+' expense">'+
       '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h12M8 6V4h4v2M6 6l.7 10h6.6L14 6"/></svg></button></div>';
  });
  $('ledgerBody').innerHTML=h;
}

/* toast */
var toastTimer, toastAction=null;
function toast(msg,actionLabel,fn){
  var t=$('toast');
  t.innerHTML='<span>'+esc(msg)+'</span>'+(actionLabel?'<button data-act="toastAction">'+esc(actionLabel)+'</button>':'');
  toastAction=fn||null;
  t.hidden=false;
  clearTimeout(toastTimer);
  toastTimer=setTimeout(function(){t.hidden=true;},6000);
}

/* actions */
function newId(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6);}

function addExpense(){
  var msg=$('formMsg'); msg.textContent='';
  var amt=parseAmount($('amount').value);
  if(!(amt>0)||amt>=1e12){
    msg.textContent='Enter an amount greater than 0.';
    $('amount').focus(); return;
  }
  amt=Math.round(amt*100)/100;
  var date=$('date').value||ymd(new Date());
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)){msg.textContent='Pick a valid date.';return;}
  var cat=$('category').value;
  var note=$('note').value.trim().slice(0,80);
  S.expenses.push({id:newId(),date:date,amount:amt,cat:cat,note:note});
  persist();
  var d=parseYmd(date); S.y=d.getFullYear(); S.m=d.getMonth(); S.filter=null;
  $('amount').value=''; $('note').value='';
  render();
  toast('Added '+money(amt)+' to '+CAT_BY_ID[cat].name+'.');
  $('amount').focus();
}

function deleteExpense(id){
  var idx=-1,i;
  for(i=0;i<S.expenses.length;i++){if(S.expenses[i].id===id){idx=i;break;}}
  if(idx<0) return;
  var item=S.expenses.splice(idx,1)[0];
  persist(); render();
  toast('Expense deleted.','Undo',function(){
    S.expenses.splice(Math.min(idx,S.expenses.length),0,item);
    persist(); render(); $('toast').hidden=true;
  });
}

function saveBudget(){
  var v=parseAmount($('budgetInput').value);
  if(!(v>0)){ S.budget=0; } else { S.budget=Math.round(v*100)/100; }
  S.editingBudget=false; persist(); render();
}

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

function loadSample(){
  var scale=SCALE[S.currency]||1, rnd=mulberry32(11), n=0;
  var DAILY=[['food','Lunch',9],['food','Groceries',38],['food','Coffee',3.6],['food','Dinner out',24],
    ['transport','Cab ride',12],['transport','Metro top-up',15],['shopping','Online order',34],
    ['fun','Movie night',15],['fun','Concert ticket',45],['health','Pharmacy',11],
    ['learning','Course lesson',12],['other','Gift',20]];
  var FIXED=[[1,'housing','Rent',540],[5,'bills','Internet',22],[8,'bills','Phone plan',14],[12,'learning','Subscription',10]];
  function amountFor(base){
    var v=base*scale*(0.7+rnd()*0.7);
    if(v>=1000) return Math.round(v/10)*10;
    if(v>=100) return Math.round(v);
    if(scale>=10) return Math.max(1,Math.round(v));
    return Math.max(0.5,Math.round(v*100)/100);
  }
  for(var back=1;back>=0;back--){
    var y=now.getFullYear(), m=now.getMonth()-back;
    if(m<0){m+=12;y--;}
    var last=back===0?now.getDate():daysIn(y,m);
    for(var d=1;d<=last;d++){
      var date=y+'-'+pad(m+1)+'-'+pad(d);
      FIXED.forEach(function(f){
        if(f[0]===d) S.expenses.push({id:'s'+(n++)+newId(),date:date,amount:amountFor(f[3]),cat:f[1],note:f[2]});
      });
      if(rnd()<0.7){
        var count=rnd()<0.25?2:1;
        for(var k=0;k<count;k++){
          var p=DAILY[Math.floor(Math.pow(rnd(),1.4)*DAILY.length)];
          S.expenses.push({id:'s'+(n++)+newId(),date:date,amount:amountFor(p[2]),cat:p[0],note:p[1]});
        }
      }
    }
  }
  S.y=now.getFullYear(); S.m=now.getMonth(); S.filter=null;
  persist(); render(); toast('Sample data added.');
}

function csvCell(s){
  s=String(s);
  if(/^[=+\-@]/.test(s)) s="'"+s;
  return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;
}
function fallbackCopy(text){
  try{
    var ta=document.createElement('textarea');
    ta.value=text; ta.setAttribute('readonly','');
    ta.style.position='fixed'; ta.style.top='0'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.select();
    var ok=document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  }catch(e){return false;}
}
function copyCsv(){
  var rows=S.expenses.slice().sort(function(a,b){return a.date<b.date?-1:a.date>b.date?1:0;});
  var lines=['date,category,note,amount,currency'];
  rows.forEach(function(e){
    lines.push([e.date,CAT_BY_ID[e.cat].name,csvCell(e.note||''),e.amount.toFixed(2),S.currency].join(','));
  });
  var text=lines.join('\n'), count=rows.length;
  function done(ok){
    toast(ok?('Copied '+count+(count===1?' expense':' expenses')+' as CSV.'):'Could not copy. Your browser blocked clipboard access.');
  }
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(function(){done(true);},function(){done(fallbackCopy(text));});
  }else{ done(fallbackCopy(text)); }
}

var resetTimer, resetArmed=false;
function resetData(){
  var b=$('resetBtn');
  if(!resetArmed){
    resetArmed=true; b.textContent='Click again to delete everything';
    clearTimeout(resetTimer);
    resetTimer=setTimeout(function(){resetArmed=false;b.textContent='Delete all data';},4000);
    return;
  }
  resetArmed=false; clearTimeout(resetTimer); b.textContent='Delete all data';
  S.expenses=[]; S.budget=0; S.filter=null; S.editingBudget=false;
  persist(); render(); toast('All data deleted.');
}

/* events */
document.addEventListener('click',function(ev){
  if(!S) return;
  var t=ev.target.closest?ev.target.closest('[data-act]'):null;
  if(!t) return;
  var a=t.getAttribute('data-act');
  switch(a){
    case 'prev': S.m--; if(S.m<0){S.m=11;S.y--;} render(); break;
    case 'next': S.m++; if(S.m>11){S.m=0;S.y++;} render(); break;
    case 'cat': var id=t.getAttribute('data-cat'); S.filter=S.filter===id?null:id; render(); break;
    case 'clearFilter': S.filter=null; render(); break;
    case 'add': addExpense(); break;
    case 'del': deleteExpense(t.getAttribute('data-id')); break;
    case 'budgetEdit': S.editingBudget=true; render(); break;
    case 'budgetSave': saveBudget(); break;
    case 'budgetCancel': S.editingBudget=false; render(); break;
    case 'budgetClear': S.budget=0; S.editingBudget=false; persist(); render(); break;
    case 'sample': loadSample(); break;
    case 'csv': copyCsv(); break;
    case 'reset': resetData(); break;
    case 'toastAction': if(toastAction){var fn=toastAction; toastAction=null; fn();} break;
  }
});

document.addEventListener('keydown',function(ev){
  if(!S) return;
  var id=ev.target&&ev.target.id;
  if(ev.key==='Enter'){
    if(id==='amount'||id==='note'||id==='date'){ev.preventDefault();addExpense();}
    else if(id==='budgetInput'){ev.preventDefault();saveBudget();}
  }else if(ev.key==='Escape'&&id==='budgetInput'){
    S.editingBudget=false; render();
  }
});

$('currency').addEventListener('change',function(ev){
  if(!S) return;
  S.currency=ev.target.value; persist(); render();
});

$('ribbon').addEventListener('animationend',function(){$('ribbon').classList.remove('draw');});

/* init */
function init(){
  var cs=$('currency'), h='';
  CURRENCIES.forEach(function(c){h+='<option value="'+c[0]+'">'+c[0]+' \u2013 '+c[1]+'</option>';});
  cs.innerHTML=h;
  var ct=$('category'); h='';
  CATS.forEach(function(c){h+='<option value="'+c.id+'">'+c.name+'</option>';});
  ct.innerHTML=h;
  $('date').value=ymd(now);
  render();
  setStorageNote(false);
}

function start(saved){buildState(saved); init();}

/* Try the data.json server first; fall back to this browser's storage. */
(function boot(){
  var p=location.protocol;
  if(p==='http:'||p==='https:'){
    fetch(API,{cache:'no-store',headers:{'Accept':'application/json'}})
      .then(function(r){if(!r.ok) throw new Error('no api'); return r.json();})
      .then(function(data){mode='server'; start(data);})
      .catch(function(){start(loadLocal());});
  }else{
    start(loadLocal());
  }
})();

})();
