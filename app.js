const $=id=>document.getElementById(id);
const audioFile=$("audioFile"),audio=$("audio"),lyrics=$("lyrics"),loadLyrics=$("loadLyrics"),clearAll=$("clearAll"),playPause=$("playPause"),restart=$("restart"),now=$("now"),durationEl=$("duration"),progressText=$("progressText"),prevPhrase=$("prevPhrase"),currentPhrase=$("currentPhrase"),nextPhrase=$("nextPhrase"),nextNextPhrase=$("nextNextPhrase"),livePreview=$("livePreview"),tapButton=$("tapButton"),clearCaption=$("clearCaption"),tapSound=$("tapSound"),latency=$("latency"),latencyValue=$("latencyValue"),lastMinus=$("lastMinus"),lastPlus=$("lastPlus"),exportLrc=$("exportLrc"),exportSrt=$("exportSrt"),exportCsv=$("exportCsv"),exportJson=$("exportJson"),importJson=$("importJson"),output=$("output"),list=$("list"),viewToggle=$("viewToggle"),tapView=$("tapView"),settingsView=$("settingsView"),pageHint=$("pageHint");
const speedButtons=[...document.querySelectorAll(".speedBtn")];
let state={lines:[],times:[],clearTimes:[],index:0,latencyMs:-120,rate:1};
function parseLines(t){return t.split(/\r?\n/).map(s=>s.trim()).filter(Boolean)}
function pad(n,l=2){return String(n).padStart(l,"0")}
function fmt(sec,srt=false){sec=Math.max(0,Number(sec)||0);const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=Math.floor(sec%60),ms=Math.floor((sec-Math.floor(sec))*1000);return srt?`${pad(h)}:${pad(m)}:${pad(s)},${pad(ms,3)}`:`${pad(m)}:${pad(s)}.${pad(ms,3)}`}
function lrcTime(sec){sec=Math.max(0,Number(sec)||0);const m=Math.floor(sec/60),s=sec%60;return `[${pad(m)}:${s.toFixed(2).padStart(5,"0")}]`}
function adjusted(t){return Math.max(0,t+state.latencyMs/1000)}
function normalizeState(){state.lines=Array.isArray(state.lines)?state.lines:[];state.times=Array.isArray(state.times)?state.times:[];state.clearTimes=Array.isArray(state.clearTimes)?state.clearTimes:[];state.index=Math.max(0,Number(state.index)||0);state.latencyMs=Number.isFinite(Number(state.latencyMs))?Number(state.latencyMs):-120;state.rate=Number(state.rate)||1;while(state.times.length<state.lines.length)state.times.push(null);if(state.times.length>state.lines.length)state.times.length=state.lines.length}
function setRate(rate){state.rate=rate;audio.playbackRate=rate;updateSpeedButtons();saveLocal()}
function updateSpeedButtons(){speedButtons.forEach(b=>b.classList.toggle("active",Number(b.dataset.rate)===Number(state.rate||1)))}
function storagePayload(){normalizeState();return {lyricText:lyrics.value,state}}
function saveLocal(){localStorage.setItem("lyricTapperProjectV13",JSON.stringify(storagePayload()))}
function loadLocal(){const raw=localStorage.getItem("lyricTapperProjectV13")||localStorage.getItem("lyricTapperProjectV10")||localStorage.getItem("lyricTapperProjectV9")||localStorage.getItem("lyricTapperProjectV7")||localStorage.getItem("lyricTapperProjectV6")||localStorage.getItem("lyricTapperProjectV5")||localStorage.getItem("lyricTapperProjectV3");if(!raw){setRate(1);return}try{const d=JSON.parse(raw);lyrics.value=d.lyricText||d.tapText||"";if(d.state){if(d.state.lines){state={...state,...d.state};}else if(d.state.tapLines){state={lines:d.state.displayLines?.length===d.state.tapLines?.length?d.state.displayLines:d.state.tapLines,times:d.state.times||[],clearTimes:d.state.clearTimes||[],index:d.state.index||0,latencyMs:d.state.latencyMs??-120,rate:1}}}normalizeState();latency.value=state.latencyMs??-120;setRate(state.rate||1);update()}catch{setRate(1)}}
function lyricRows(){normalizeState();return state.lines.map((line,i)=>({type:"lyric",i,line,raw:state.times[i]})).filter(r=>typeof r.raw==="number").map(r=>({...r,time:adjusted(r.raw)}))}
function clearRows(){normalizeState();return state.clearTimes.filter(t=>typeof t==="number").map((raw,i)=>({type:"clear",i,line:"",raw,time:adjusted(raw)}))}
function events(){return [...lyricRows(),...clearRows()].sort((a,b)=>a.time-b.time || (a.type==="clear"?1:-1))}
function currentCaptionAt(t){const ev=events().filter(e=>e.time<=t).at(-1);return ev?ev.line:""}
function updatePlayButton(){if(!playPause)return;playPause.textContent=audio.paused?"▶":"⏸"}
function updateLivePreview(){if(!livePreview)return;const text=currentCaptionAt(audio.currentTime||0);livePreview.textContent=text||"（消えています）";livePreview.classList.toggle("empty",!text)}
function update(){normalizeState();state.latencyMs=Number(latency.value);latencyValue.textContent=String(state.latencyMs);audio.playbackRate=state.rate||1;updateSpeedButtons();const total=state.lines.length,done=state.times.filter(t=>typeof t==="number").length,clears=state.clearTimes.length;progressText.textContent=`${done} / ${total}${clears?`　消 ${clears}`:""}`;
 if(!total){prevPhrase.textContent="---";currentPhrase.textContent="歌詞をセットしてください";nextPhrase.textContent="---";nextNextPhrase.textContent="---"}
 else if(state.index>=total){prevPhrase.textContent=state.lines[total-1]||"---";currentPhrase.textContent="打刻完了！";nextPhrase.textContent="出力できます";nextNextPhrase.textContent="---"}
 else{prevPhrase.textContent=state.index>0?state.lines[state.index-1]:"最初のフレーズです";currentPhrase.textContent=state.lines[state.index];nextPhrase.textContent=state.lines[state.index+1]||"最後のフレーズです";nextNextPhrase.textContent=state.lines[state.index+2]||"---"}
 renderList();updateLivePreview();updatePlayButton();saveLocal()}
function renderList(){list.innerHTML="";const recorded=events();recorded.forEach(ev=>{const div=document.createElement("div");div.className="item"+(ev.type==="clear"?" clearRow":"");const time=document.createElement("div");time.className="time";time.textContent=fmt(ev.time);const text=document.createElement("div");text.className="text";text.textContent=ev.type==="clear"?"（ここで歌詞を消す）":ev.line;if(ev.type==="lyric")div.onclick=()=>{state.index=ev.i;update()};div.append(time,text);list.appendChild(div)});state.lines.forEach((line,i)=>{if(typeof state.times[i]==="number")return;const div=document.createElement("div");div.className="item pending"+(i===state.index?" currentRow":"");div.onclick=()=>{state.index=i;update()};const time=document.createElement("div");time.className="time";time.textContent="--:--.---";const text=document.createElement("div");text.className="text";text.textContent=line;div.append(time,text);list.appendChild(div)})}
let audioCtx=null;
function playTapBeep(){if(!tapSound||!tapSound.checked)return;try{audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==="suspended")audioCtx.resume();const osc=audioCtx.createOscillator(),gain=audioCtx.createGain();osc.type="square";osc.frequency.setValueAtTime(1320,audioCtx.currentTime);gain.gain.setValueAtTime(0.0001,audioCtx.currentTime);gain.gain.exponentialRampToValueAtTime(0.28,audioCtx.currentTime+0.006);gain.gain.exponentialRampToValueAtTime(0.0001,audioCtx.currentTime+0.075);osc.connect(gain);gain.connect(audioCtx.destination);osc.start();osc.stop(audioCtx.currentTime+0.085)}catch{}}
audioFile.onchange=()=>{const f=audioFile.files[0];if(f)audio.src=URL.createObjectURL(f)};
audio.onloadedmetadata=()=>durationEl.textContent=fmt(audio.duration||0);
audio.ontimeupdate=()=>{now.textContent=fmt(audio.currentTime||0);updateLivePreview()};
audio.onplay=updatePlayButton;audio.onpause=updatePlayButton;audio.onended=updatePlayButton;
playPause.onclick=async()=>{if(audio.paused){try{await audio.play()}catch{}}else audio.pause();updatePlayButton()};
restart.onclick=()=>{audio.currentTime=0;updateLivePreview()};
speedButtons.forEach(btn=>btn.onclick=()=>setRate(Number(btn.dataset.rate)));
loadLyrics.onclick=()=>{state.lines=parseLines(lyrics.value);state.times=new Array(state.lines.length).fill(null);state.clearTimes=[];state.index=0;update()};
tapButton.onclick=()=>{playTapBeep();if(!state.lines.length||state.index>=state.lines.length)return;state.times[state.index]=audio.currentTime;state.index++;update()};
clearCaption.onclick=()=>{state.clearTimes.push(audio.currentTime);update()};
latency.oninput=update;
function adjustLast(d){let i=Math.min(state.index-1,state.times.length-1);while(i>=0&&typeof state.times[i]!=="number")i--;if(i<0)return;state.times[i]=Math.max(0,state.times[i]+d);update()}
lastMinus.onclick=()=>adjustLast(-.05);lastPlus.onclick=()=>adjustLast(.05);
function makeLrc(){return events().map(r=>`${lrcTime(r.time)}${r.line}`).join("\n")}
function makeSrt(){const r=lyricRows().sort((a,b)=>a.time-b.time),e=events(),dur=audio.duration||0;return r.map((x,idx)=>{const nextEvent=e.find(ev=>ev.time>x.time+.001);const fallback=r[idx+1]?.time;const end=nextEvent?Math.max(x.time+.35,nextEvent.time-.05):fallback?Math.max(x.time+.35,fallback-.05):Math.min(dur||x.time+3,x.time+3);return `${idx+1}\n${fmt(x.time,true)} --> ${fmt(end,true)}\n${x.line}\n`}).join("\n")}
function makeCsv(){return ["type,index,start_seconds,start_time,text",...events().map(r=>`${r.type},${r.type==="lyric"?r.i+1:""},${r.time.toFixed(3)},${fmt(r.time)},"${String(r.line).replaceAll('"','""')}"`)].join("\n")}
function download(name,text,type="text/plain"){output.value=text;const blob=new Blob([text],{type:type+";charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(url);a.remove()},1000)}
exportLrc.onclick=()=>download("lyrics_timing.lrc",makeLrc());
exportSrt.onclick=()=>download("lyrics_timing.srt",makeSrt(),"application/x-subrip");
exportCsv.onclick=()=>download("lyrics_timing.csv",makeCsv(),"text/csv");
exportJson.onclick=()=>download("lyrics_tapper_project.json",JSON.stringify({app:"歌詞ハイ！タイマー",version:13,lyricText:lyrics.value,state},null,2),"application/json");
importJson.onchange=async()=>{const f=importJson.files[0];if(!f)return;try{const d=JSON.parse(await f.text());lyrics.value=d.lyricText||d.tapText||"";if(d.state){if(d.state.lines){state={...state,...d.state};}else if(d.state.tapLines){state={lines:d.state.displayLines?.length===d.state.tapLines?.length?d.state.displayLines:d.state.tapLines,times:d.state.times||[],clearTimes:d.state.clearTimes||[],index:d.state.index||0,latencyMs:d.state.latencyMs??-120,rate:1}}}normalizeState();latency.value=state.latencyMs??-120;setRate(state.rate||1);update()}catch{alert("JSONを読み込めませんでした")}};
clearAll.onclick=()=>{if(!confirm("作業データを消しますか？"))return;state={lines:[],times:[],clearTimes:[],index:0,latencyMs:-120,rate:1};lyrics.value="";latency.value=-120;localStorage.removeItem("lyricTapperProjectV13");localStorage.removeItem("lyricTapperProjectV10");localStorage.removeItem("lyricTapperProjectV9");localStorage.removeItem("lyricTapperProjectV7");localStorage.removeItem("lyricTapperProjectV6");localStorage.removeItem("lyricTapperProjectV5");update()};

function showView(name){
  const settings=name==="settings";
  tapView.classList.toggle("hidden",settings);
  settingsView.classList.toggle("hidden",!settings);
  viewToggle.textContent=settings?"打刻へ":"設定";
  pageHint.textContent=settings?"音源・歌詞・補正・出力をここで設定。":"前・今・次・次の次を見ながら、曲に合わせて「ハイ！」。";
  document.body.classList.toggle("settings-mode",settings);
}
viewToggle.onclick=()=>showView(settingsView.classList.contains("hidden")?"settings":"tap");
document.onkeydown=e=>{if(["TEXTAREA","INPUT"].includes(e.target.tagName))return;if(e.code==="Space"){e.preventDefault();tapButton.click()}else if(e.code==="Enter"){e.preventDefault();playPause.click()}else if(e.key.toLowerCase()==="c"){e.preventDefault();clearCaption.click()}else if(e.key.toLowerCase()==="r"){e.preventDefault();restart.click()}else if(e.key==="1"){setRate(.5)}else if(e.key==="2"){setRate(.75)}else if(e.key==="3"){setRate(1)}};
if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(()=>{}));
loadLocal();
