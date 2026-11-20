let forecast = new Map(), zone = 'UTC', compareRequest = 0;
const el = id => document.getElementById(id);
const clock = t => new Date(t*1000).toLocaleString('en-GB',{timeZone:zone,month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',timeZoneName:'short'});
function interval(start, minutes) {
  const end=start+minutes*60;
  let total=0,peak=0;
  for(let t=start;t<end;){
    const hour=start+Math.floor((t-start)/3600)*3600, next=Math.min(end,hour+3600), value=forecast.get(hour);
    if(!Number.isFinite(value)) return null;
    total+=value*(next-t);peak=Math.max(peak,value);t=next;
  }
  return {average:total/(minutes*60),peak};
}
function resetTools(){
  forecast.clear();compareRequest++;zone='UTC';
  for(const id of ['from','until','eventtime','matches','tablebox','comparison','why'])el(id).replaceChildren();
  el('best').textContent='Waiting for forecast data.';
  document.querySelectorAll('.zone').forEach(p=>p.textContent=city[0]+' · Forecast hours unavailable');
  renderEvents();
}
function prepareTools(d){
  zone=d.timezone||'UTC';
  const now=Date.now()/1000;
  d.hourly.time.forEach((t,i)=>forecast.set(t,d.hourly.us_aqi[i]));
  const future=[...forecast.keys()].filter(t=>t>=now&&Number.isFinite(forecast.get(t)));
  for(const id of ['from','until','eventtime']){
    for(const t of future){const time=id==='until'?t+3600:t;el(id).add(new Option(clock(time),time))}
  }
  if(future.length)el('until').selectedIndex=Math.min(5,future.length-1);
  document.querySelectorAll('.zone').forEach(p=>p.textContent=city[0]+' · '+zone+' · Hourly forecasts');
  el('best').textContent=future.length?'Choose a window to compare hourly starts.':'Forecast unavailable.';
  renderEvents();
}
function explain(v,time){
  if(sample||v<101||el('tips').hidden)return;
  const old=history.find(([t])=>t===history.at(-1)?.[0]-10800)?.[1];
  const category=n=>band(n)===2?'Unhealthy for sensitive groups':cats[band(n)];
  el('why').textContent=Number.isFinite(old)?'Three hours ago AQI was '+old+'. It is now '+v+'. '+(band(old)===band(v)?'Both readings are in the '+category(v)+' category.':'The category changed from '+category(old)+' to '+category(v)+'.'):'AQI is above 100. A three-hour comparison is unavailable.';
}
el('plan').onsubmit=e=>{
  e.preventDefault();const start=+el('from').value,end=+el('until').value,m=+el('duration').value;
  let best=null;
  for(let t=start;t>=Date.now()/1000&&t+m*60<=end;t+=3600){
    const score=interval(t,m);if(score&&(!best||score.average<best.average))best={t,...score};
  }
  el('best').textContent=best?clock(best.t)+' – '+clock(best.t+m*60)+' · Lowest average AQI '+best.average.toFixed(1)+' · Peak '+best.peak:'No complete forecast fits this window and duration.';
};
const key=()=> 'hawawatch.events.'+city.slice(2,4).map(n=>n.toFixed(2)).join(',');
function readEvents(){try{return JSON.parse(localStorage.getItem(key()))||[]}catch{return []}}
function renderEvents(){
  const box=el('events');box.replaceChildren();
  for(const ev of readEvents().sort((a,b)=>a.t-b.t)){
    const score=interval(ev.t,ev.m),row=document.createElement('p');
    row.textContent=ev.name+' · '+clock(ev.t)+' · '+ev.m+' min · '+(score?(score.peak>=101?'Elevated AQI during event':'Below alert threshold')+' (peak '+score.peak+')':'Forecast unavailable');
    const remove=document.createElement('button');remove.textContent='Remove';remove.onclick=()=>{localStorage.setItem(key(),JSON.stringify(readEvents().filter(item=>item.id!==ev.id)));renderEvents()};row.append(' ',remove);box.append(row);
  }
}
el('eventform').onsubmit=e=>{
  e.preventDefault();const name=el('activity').value.trim(),t=+el('eventtime').value;
  if(!name||t<Date.now()/1000){el('events').prepend('Choose a future forecast hour and enter an activity. ');return}
  const events=readEvents();events.push({id:crypto.randomUUID(),name,t,m:+el('length').value});
  try{localStorage.setItem(key(),JSON.stringify(events));renderEvents();el('activity').value=''}catch{el('events').prepend('Browser storage unavailable. ')}
};
el('compare').onsubmit=async e=>{
  e.preventDefault();const request=++compareRequest,box=el('matches');
  box.replaceChildren();el('tablebox').replaceChildren();el('comparison').textContent='Searching…';
  try{
    const data=await json('https://geocoding-api.open-meteo.com/v1/search?count=5&name='+encodeURIComponent(el('other').value.trim()));
    if(request!==compareRequest)return;
    el('comparison').textContent=data.results?.length?'Choose a place.':'No matching places.';
    for(const place of data.results||[]){
      const b=document.createElement('button');b.textContent=[place.name,place.admin1,place.country].filter(Boolean).join(', ');
      b.onclick=()=>comparePlace(place,b.textContent);box.append(b);
    }
  }catch{if(request===compareRequest)el('comparison').textContent='Search unavailable. Try again.'}
};
async function comparePlace(place,label){
  const request=++compareRequest;el('matches').replaceChildren();el('comparison').textContent='Loading hourly comparison…';
  try{
    if(sample||!history.length)throw Error();
    const d=await json(api(place.latitude,place.longitude,'&hourly=us_aqi&past_days=2&forecast_days=1'));
    if(request!==compareRequest)return;
    const other=new Map(d.hourly.time.map((t,i)=>[t,d.hourly.us_aqi[i]]));
    const pairs=history.slice(-24).map(([t,a])=>[t,a,other.get(t)]).filter(([,a,b])=>Number.isFinite(a)&&Number.isFinite(b));
    if(!pairs.length)throw Error();
    const table=document.createElement('table');
    function row(items,tag){const r=table.insertRow();for(const text of items){const c=document.createElement(tag);c.textContent=text;r.append(c)}}
    row(['Time',city[0],label],'th');for(const [t,a,b] of pairs.slice().reverse())row([clock(t),a,b],'td');
    el('tablebox').replaceChildren(table);
    el('comparison').textContent=pairs.length+' matched hours. '+(pairs.every(([,a,b])=>a===b)?'Both places have identical estimates throughout.':pairs.at(-1)[1]===pairs.at(-1)[2]?'Latest estimates match.':'Latest estimates differ.');
  }catch{if(request===compareRequest)el('comparison').textContent='Comparable live history is unavailable.'}
}

function selectFeature(id) {
  document.querySelectorAll('[data-view]').forEach(button => {
    const active = button.dataset.view === id;
    button.setAttribute('aria-pressed', String(active));
    document.getElementById(button.dataset.view).hidden = !active;
  });
}
document.querySelectorAll('[data-view]').forEach(button => {
  button.onclick = () => selectFeature(button.dataset.view);
});
document.querySelectorAll('header nav a').forEach(link => {
  link.addEventListener('click', () => selectFeature('dashboard-view'));
});
