let hindi=false,reading=null,stationRows=[],quizIndex=0;
const tr=(en,hi)=>hindi?hi:en;
const pollutants=[
 ['pm2_5','PM2.5','Fine airborne particles small enough to reach deep into the lungs.','बहुत महीन कण जो फेफड़ों में गहराई तक पहुँच सकते हैं।'],
 ['pm10','PM10','Airborne particles, including dust from roads and construction.','हवा में मौजूद कण, जिनमें सड़क और निर्माण की धूल शामिल है।'],
 ['nitrogen_dioxide','NO₂','A gas produced when fuels burn, including in vehicles.','वाहनों सहित ईंधन जलाने से बनने वाली गैस।'],
 ['sulphur_dioxide','SO₂','A gas released when sulphur-containing fuels burn.','सल्फर वाले ईंधन जलने से निकलने वाली गैस।'],
 ['ozone','O₃','Ground-level ozone forms when gases react in sunlight.','धूप में गैसों की प्रतिक्रिया से धरातल के पास ओज़ोन बनती है।'],
 ['carbon_monoxide','CO','An invisible gas from incomplete burning of fuel.','ईंधन के अधूरे दहन से बनने वाली अदृश्य गैस।']
];
function resetInsights(){reading=null;renderInsights();renderStations()}
function showInsights(data){reading=data;renderInsights()}
function tile(id,label,value){const box=document.createElement('span'),b=document.createElement('b');box.append(label,b);b.textContent=value??'—';if(Number.isFinite(value))b.style.borderBottom='4px solid '+colors[band(value)];el(id).append(box)}
function dateKey(t){return new Intl.DateTimeFormat('sv-SE',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(t*1000)}
function renderInsights(){
  const missing=tr('Model data unavailable.','मॉडल डेटा उपलब्ध नहीं है।');
  for(const id of ['prediction','calendar','driver','extremes','sport-tip'])el(id).textContent=missing;
  el('report').disabled=!reading;if(!reading)return;
  const {hourly,current}=reading,idx=hourly.time.findLastIndex(t=>t<=current.time);
  const subs=pollutants.map(([key,name])=>[name,hourly['us_aqi_'+key]?.[idx]]).filter(p=>Number.isFinite(p[1])).sort((a,b)=>b[1]-a[1]);
  if(subs.length){const high=subs[0][1];el('driver').textContent=tr('Highest available pollutant sub-index','उपलब्ध प्रदूषकों में सबसे ऊँचा उप-सूचकांक')+' · '+subs.filter(p=>p[1]===high).map(p=>p[0]).join(' / ')+' · '+high+tr('. Emission source is unknown.','. उत्सर्जन स्रोत अज्ञात है।')}
  const activity=el('sport').selectedOptions[0].textContent,level=band(current.us_aqi);
  const actions=el('sport').selectedIndex===0?['Shorten long walks or take breaks.','लंबी सैर छोटी करें या विराम लें।']:el('sport').selectedIndex===1?['Choose a shorter, easier ride.','छोटी और कम मेहनत वाली सवारी चुनें।']:['Shorten training and take more breaks.','अभ्यास छोटा करें और अधिक विराम लें।'];
  el('sport-tip').textContent=activity+' · '+(level>=4?tr('Move strenuous activity indoors.','कठिन गतिविधियाँ अंदर करें।'):level>=2?(level===2?tr('For sensitive groups: ','संवेदनशील समूह: '):'')+tr(...actions):tr('Usual activity is generally appropriate; adjust if sensitive.','सामान्य गतिविधि कर सकते हैं। संवेदनशील हों तो सावधानी रखें।'));
  el('prediction').replaceChildren();hourly.time.slice(idx+1,idx+25).forEach((t,i)=>tile('prediction',clock(t),hourly.us_aqi[idx+1+i]));
  const past=history.filter(p=>Number.isFinite(p[1]));if(!past.length)return;
  const ordered=[...past].sort((a,b)=>a[1]-b[1]);el('extremes').textContent=[ordered[0],ordered.at(-1)].map(([t,v],i)=>(i?tr('Highest','उच्चतम'):tr('Lowest','न्यूनतम'))+' · '+clock(t)+' · '+v).join(' | ');
  const days=new Map();past.forEach(([t,v])=>{const k=dateKey(t);if(!days.has(k))days.set(k,[]);days.get(k).push(v)});
  el('calendar').replaceChildren();
  const week=hindi?['सोम','मंगल','बुध','गुरु','शुक्र','शनि','रवि']:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  for(const day of week){const header=document.createElement('b');header.textContent=day;el('calendar').append(header)}
  const dates=[...days.keys()],first=new Date(dates[0]+'T00:00:00Z');
  for(let pad=0;pad<(first.getUTCDay()+6)%7;pad++)el('calendar').append(document.createElement('i'));
  for(let t=first.getTime();t<=Date.parse(dates.at(-1)+'T00:00:00Z');t+=86400000){const date=new Date(t).toISOString().slice(0,10),values=days.get(date)||[];tile('calendar',date.slice(5)+' · '+values.length+'h',values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length):null)}
}
el('sport').onchange=renderInsights;
el('report').onclick=()=>{
 if(!reading)return;const day=dateKey(reading.current.time);
 const rows=history.filter(p=>dateKey(p[0])===day&&Number.isFinite(p[1]));
 const text=['HawaWatch · '+day,city.slice(0,2).join(', '),el('stamp').textContent,'US AQI '+reading.current.us_aqi,el('driver').textContent,'Hourly model estimates · Open-Meteo / CAMS',...rows.map(([t,v])=>clock(t)+' · '+v)].join('\n');
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));a.download='HawaWatch-'+day+'.txt';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
};
function renderStations(){
 const recent=stationRows.filter(r=>r.city.toLowerCase()===city[0].toLowerCase()&&Date.now()-r.time>=0&&Date.now()-r.time<86400000);
 const latest=new Map();for(const r of recent.sort((a,b)=>a.time-b.time))latest.set(r.station,r);
 const newest=Math.max(...recent.map(r=>r.time)),list=[...latest.values()].filter(r=>newest-r.time<=3600000).sort((a,b)=>a.aqi-b.aqi);
 el('station-list').replaceChildren();el('india-alert').textContent='';
 el('station-result').textContent=list.length?city[0]+' · '+tr('Lowest reported Indian AQI first. Readings within one hour of each other.','कम भारतीय AQI पहले। रीडिंग के बीच अधिकतम एक घंटे का अंतर।'):tr('No recent station report for ','इस स्थान की हाल की स्टेशन रिपोर्ट उपलब्ध नहीं है: ')+city[0];
 const alerts=[];for(const r of list){const cat=r.aqi>400?'Severe':r.aqi>300?'Very Poor':r.aqi>200?'Poor':'';const item=document.createElement('li');item.textContent=r.station+' · '+r.aqi+' · '+new Date(r.time).toLocaleString();el('station-list').append(item);if(cat)alerts.push(r.station+' · '+cat+' ('+r.aqi+')')}
 if(alerts.length)el('india-alert').textContent='Indian AQI station alert · '+alerts.join(' | ');
}
el('csv').onchange=async e=>{
 const file=e.target.files[0];if(!file)return;
 const lines=(await file.text()).trim().split(/\r?\n/);const fields=line=>(line.match(/("(?:[^"]|"")*"|[^,]*)(,|$)/g)||[]).map(s=>s.replace(/,$/,'').trim().replace(/^"|"$/g,'').replace(/""/g,'"'));const head=fields(lines.shift()).map(s=>s.toLowerCase());
 stationRows=lines.map(line=>{const cells=fields(line),v=k=>cells[head.indexOf(k)]||'';return {city:v('city'),station:v('station'),time:Date.parse(v('time')),aqi:v('aqi').length?Number(v('aqi')):NaN}}).filter(r=>r.station&&r.city&&Number.isInteger(r.aqi)&&r.aqi>=0&&r.aqi<=500&&Number.isFinite(r.time));renderStations();
};
const quiz=[
 ['Which are finer particles?','कौन से कण महीन हैं?','PM2.5','PM10',0],
 ['Which is a forecast?','पूर्वानुमान कौन सा है?','Tomorrow’s estimate','Yesterday’s observation',0],
 ['A lower AQI usually indicates…','कम AQI सामान्यतः दर्शाता है…','More pollution','Cleaner air',1]
];
function learn(){el('glossary').replaceChildren();for(const [,name,en,hi] of pollutants){const d=document.createElement('details'),s=document.createElement('summary');s.textContent=name;d.append(s,tr(en,hi));el('glossary').append(d)}
 const tips=[['Combine short errands into one trip.','छोटे काम एक यात्रा में पूरे करें।'],['Switch off an idling engine when parked.','पार्क करने पर इंजन बंद करें।'],['Share a ride or use public transport when possible.','संभव हो तो साझा वाहन या सार्वजनिक परिवहन चुनें।']];
 el('eco').textContent=tr(...tips[Math.floor(Date.now()/86400000)%tips.length]);const q=quiz[quizIndex];el('question').textContent=tr(q[0],q[1]);el('answers').replaceChildren();[q[2],q[3]].forEach((v,i)=>{const b=document.createElement('button');b.textContent=hindi?({'Tomorrow’s estimate':'कल का अनुमान','Yesterday’s observation':'बीते कल का मापन','More pollution':'अधिक प्रदूषण','Cleaner air':'स्वच्छ हवा'}[v]||v):v;b.onclick=()=>{if(i!==q[4]){el('feedback').textContent=tr('Try again.','फिर प्रयास करें।');return}el('feedback').textContent=tr('Correct!','सही जवाब!');quizIndex=(quizIndex+1)%quiz.length;learn()};el('answers').append(b)})}
const dictionary={
 'Overview':'अवलोकन','Outdoor planner':'बाहरी गतिविधि योजना','Compare places':'स्थानों की तुलना','Campus board':'कैंपस बोर्ड','Air insights':'वायु विश्लेषण','Station finder':'स्टेशन खोजें','Learn':'जानें','Air quality map':'वायु गुणवत्ता मानचित्र','Trends':'रुझान','Air quality overview':'वायु गुणवत्ता अवलोकन','ENVIRONMENT MONITOR':'पर्यावरण निगरानी','Explore local air conditions and pollution patterns.':'स्थानीय वायु गुणवत्ता और प्रदूषण के रुझान देखें।','Search':'खोजें','◎   Use my location':'◎ मेरा स्थान चुनें','Plan my outdoor time':'बाहर जाने का समय चुनें','Window starts':'आरंभ समय','Finish by':'समाप्ति समय','Duration (minutes)':'अवधि (मिनट)','Find lowest AQI':'सबसे कम AQI खोजें','Compare two places':'दो स्थानों की तुलना','Second location':'दूसरा स्थान','Find places':'स्थान खोजें','Campus activity board':'कैंपस गतिविधि बोर्ड','Activity':'गतिविधि','Start time':'आरंभ समय','Add event':'कार्यक्रम जोड़ें','24-hour AQI forecast':'अगले 24 घंटों का AQI पूर्वानुमान','Hourly predictions · Open-Meteo / CAMS · US AQI':'घंटेवार पूर्वानुमान · Open-Meteo / CAMS · अमेरिकी AQI','Best and worst hours':'सबसे कम और सबसे अधिक AQI वाले घंटे','Pollution calendar':'प्रदूषण कैलेंडर','Daily mean of available hourly US AQI estimates':'उपलब्ध घंटेवार अमेरिकी AQI अनुमानों का दैनिक औसत','Download daily report':'दैनिक रिपोर्ट डाउनलोड करें','Clean air zone finder':'स्वच्छ हवा वाले स्टेशन खोजें','Station report':'स्टेशन रिपोर्ट','CPCB station dashboard':'CPCB स्टेशन डैशबोर्ड','Pollutant explainer':'प्रदूषकों की जानकारी','Eco tip of the day':'आज का पर्यावरण सुझाव','AQI awareness quiz':'वायु गुणवत्ता प्रश्नोत्तरी','Why is my AQI high?':'मेरा AQI अधिक क्यों है?','Choose an activity':'गतिविधि चुनें','Walking':'पैदल चलना','Cycling':'साइकिल चलाना','Outdoor sports':'बाहरी खेल','Pollution trends':'प्रदूषण के रुझान','24 hours':'24 घंटे','7 days':'7 दिन','How to stay safe':'सावधानियाँ','Outdoor activities':'बाहरी गतिविधियाँ','People more sensitive to pollution':'प्रदूषण के प्रति संवेदनशील लोग','Hourly AQI for your selected location.':'आपके स्थान का घंटेवार AQI।','Compare the dashboard location with a second city over the last 24 hours.':'पिछले 24 घंटों में दो शहरों के AQI की तुलना करें।','Events for this location are saved in this browser.':'इस स्थान के कार्यक्रम इस ब्राउज़र में सहेजे जाते हैं।','Explore AQI across the selected region.':'चुने गए क्षेत्र में AQI देखें।','Compare Indian monitoring stations using a dated station report. Upload a CSV with columns city, station, aqi, time (ISO timestamp with timezone). Use published Indian National AQI values.':'भारतीय स्टेशन रिपोर्ट की CSV अपलोड करें। कॉलम city, station, aqi, time रखें। समय में टाइमज़ोन और AQI में प्रकाशित भारतीय राष्ट्रीय सूचकांक प्रयोग करें।'};
const reverse=Object.fromEntries(Object.entries(dictionary).map(([a,b])=>[b,a]));
el('language').onclick=()=>{hindi=!hindi;document.documentElement.lang=hindi?'hi':'en';el('language').textContent=hindi?'English':'हिन्दी';const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);while(walker.nextNode()){const node=walker.currentNode,key=node.nodeValue.trim(),value=(hindi?dictionary:reverse)[key];if(value)node.nodeValue=node.nodeValue.replace(key,value)}el('query').placeholder=tr('Search city or town…','शहर या कस्बा खोजें…');el('feedback').textContent='';learn();renderInsights();renderStations()};
learn();
