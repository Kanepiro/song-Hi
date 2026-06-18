const $=id=>document.getElementById(id);
const audioFile=$("audioFile"),audio=$("audio"),lyrics=$("lyrics"),loadLyrics=$("loadLyrics"),clearAll=$("clearAll"),playPause=$("playPause"),back3=$("back3"),forward3=$("forward3"),now=$("now"),durationEl=$("duration"),progressText=$("progressText"),prevPhrase=$("prevPhrase"),currentPhrase=$("currentPhrase"),nextPhrase=$("nextPhrase"),nextNextPhrase=$("nextNextPhrase"),tapButton=$("tapButton"),tapSound=$("tapSound"),undo=$("undo"),redoLast=$("redoLast"),skip=$("skip"),latency=$("latency"),latencyValue=$("latencyValue"),lastMinus=$("lastMinus"),lastPlus=$("lastPlus"),exportLrc=$("exportLrc"),exportSrt=$("exportSrt"),exportCsv=$("exportCsv"),exportJson=$("exportJson"),importJson=$("importJson"),output=$("output"),list=$("list");
const speedButtons=[...document.querySelectorAll(".speedBtn")];
let state={lines:[],times:[],index:0,latencyMs:-120,rate:1};
function parseLines(t){return t.split(/\r?\n/).map(s=>s.trim()).filter(Boolean)}
function pad(n,l=2){return String(n).padStart(l,"0")}
function fmt(sec,srt=false){sec=Math.max(0,Number(sec)||0);const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=Math.floor(sec%60),ms=Math.floor((sec-Math.floor(sec))*1000);return srt?`${pad(h)}:${pad(m)}:${pad(s)},${pad(ms,3)}`:`${pad(m)}:${pad(s)}.${pad(ms,3)}`}
function lrcTime(sec){sec=Math.max(0,Number(sec)||0);const m=Math.floor(sec/60),s=sec%60;return `[${pad(m)}:${s.toFixed(2).padStart(5,"0")}]`}
function adjusted(t){return Math.max(0,t+state.latencyMs/1000)}
function setRate(rate){state.rate=rate;audio.playbackRate=rate;updateSpeedButtons();saveLocal()}
function updateSpeedButtons(){speedButtons.forEach(b=>b.classList.toggle("active",Number(b.dataset.rate)===Number(state.rate||1)))}
function saveLocal(){localStorage.setItem("lyricTapperProjectV5",JSON.stringify({lyricText:lyrics.value,state}))}
function loadLocal(){const raw=localStorage.getItem("lyricTapperProjectV5")||localStorage.getItem("lyricTapperProjectV3");if(!raw){setRate(1);return}try{const d=JSON.parse(raw);lyrics.value=d.lyricText||d.tapText||"";if(d.state){if(d.state.lines)state={...state,...d.state};else if(d.state.tapLines)state={lines:d.state.displayLines?.length===d.state.tapLines?.length?d.state.displayLines:d.state.tapLines,times:d.state.times||[],index:d.state.index||0,latencyMs:d.state.latencyMs??-120,rate:1}}latency.value=state.latencyMs??-120;setRate(state.rate||1);update()}catch{setRate(1)}}
function update(){state.latencyMs=Number(latency.value);latencyValue.textContent=String(state.latencyMs);audio.playbackRate=state.rate||1;updateSpeedButtons();const total=state.lines.length,done=state.times.filter(t=>typeof t==="number").length;progressText.textContent=`${done} / ${total}`;
 if(!total){prevPhrase.textContent="---";currentPhrase.textContent="歌詞をセットしてください";nextPhrase.textContent="---";nextNextPhrase.textContent="---"}
 else if(state.index>=total){prevPhrase.textContent=state.lines[total-1]||"---";currentPhrase.textContent="打刻完了！";nextPhrase.textContent="出力できます";nextNextPhrase.textContent="---"}
 else{prevPhrase.textContent=state.index>0?state.lines[state.index-1]:"最初のフレーズです";currentPhrase.textContent=state.lines[state.index];nextPhrase.textContent=state.lines[state.index+1]||"最後のフレーズです";nextNextPhrase.textContent=state.lines[state.index+2]||"---"}
 renderList();saveLocal()}
function renderList(){list.innerHTML="";state.lines.forEach((line,i)=>{const div=document.createElement("div");div.className="item"+(typeof state.times[i]!=="number"?" pending":"")+(i===state.index?" currentRow":"");div.onclick=()=>{state.index=i;update()};const time=document.createElement("div");time.className="time";time.textContent=typeof state.times[i]==="number"?fmt(adjusted(state.times[i])):"--:--.---";const text=document.createElement("div");text.className="text";text.textContent=line;div.append(time,text);list.appendChild(div)})}
let audioCtx=null;
function playTapBeep(){if(!tapSound||!tapSound.checked)return;try{audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==="suspended")audioCtx.resume();const osc=audioCtx.createOscillator(),gain=audioCtx.createGain();osc.type="square";osc.frequency.setValueAtTime(1320,audioCtx.currentTime);gain.gain.setValueAtTime(0.0001,audioCtx.currentTime);gain.gain.exponentialRampToValueAtTime(0.28,audioCtx.currentTime+0.006);gain.gain.exponentialRampToValueAtTime(0.0001,audioCtx.currentTime+0.075);osc.connect(gain);gain.connect(audioCtx.destination);osc.start();osc.stop(audioCtx.currentTime+0.085)}catch{}}
audioFile.onchange=()=>{const f=audioFile.files[0];if(f)audio.src=URL.createObjectURL(f)};
audio.onloadedmetadata=()=>durationEl.textContent=fmt(audio.duration||0);
audio.ontimeupdate=()=>now.textContent=fmt(audio.currentTime||0);
playPause.onclick=async()=>{if(audio.paused){try{await audio.play()}catch{}}else audio.pause()};
back3.onclick=()=>audio.currentTime=Math.max(0,audio.currentTime-3);
forward3.onclick=()=>audio.currentTime=Math.min(audio.duration||Infinity,audio.currentTime+3);
speedButtons.forEach(btn=>btn.onclick=()=>setRate(Number(btn.dataset.rate)));
loadLyrics.onclick=()=>{state.lines=parseLines(lyrics.value);state.times=new Array(state.lines.length).fill(null);state.index=0;update()};
tapButton.onclick=()=>{playTapBeep();if(!state.lines.length||state.index>=state.lines.length)return;state.times[state.index]=audio.currentTime;state.index++;update()};
undo.onclick=()=>{if(!state.lines.length)return;state.index=Math.max(0,state.index-1);state.times[state.index]=null;update()};
redoLast.onclick=()=>{let i=Math.min(state.index-1,state.times.length-1);while(i>=0&&typeof state.times[i]!=="number")i--;if(i<0)return;const t=state.times[i];state.times[i]=null;state.index=i;audio.currentTime=Math.max(0,t-1.5);update()};
skip.onclick=()=>{if(!state.lines.length||state.index>=state.lines.length)return;state.times[state.index]=null;state.index++;update()};
latency.oninput=update;
function adjustLast(d){let i=Math.min(state.index-1,state.times.length-1);while(i>=0&&typeof state.times[i]!=="number")i--;if(i<0)return;state.times[i]=Math.max(0,state.times[i]+d);update()}
lastMinus.onclick=()=>adjustLast(-.05);lastPlus.onclick=()=>adjustLast(.05);
function rows(){return state.lines.map((line,i)=>({i,line,raw:state.times[i]})).filter(r=>typeof r.raw==="number").map(r=>({...r,time:adjusted(r.raw)})).sort((a,b)=>a.time-b.time)}
function makeLrc(){return rows().map(r=>`${lrcTime(r.time)}${r.line}`).join("\n")}
function makeSrt(){const r=rows(),dur=audio.duration||0;return r.map((x,idx)=>{const next=r[idx+1]?.time,end=next?Math.max(x.time+.35,next-.05):Math.min(dur||x.time+3,x.time+3);return `${idx+1}\n${fmt(x.time,true)} --> ${fmt(end,true)}\n${x.line}\n`}).join("\n")}
function makeCsv(){return ["index,start_seconds,start_time,text",...rows().map(r=>`${r.i+1},${r.time.toFixed(3)},${fmt(r.time)},"${String(r.line).replaceAll('"','""')}"`)].join("\n")}
function download(name,text,type="text/plain"){output.value=text;const blob=new Blob([text],{type:type+";charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(url);a.remove()},1000)}
exportLrc.onclick=()=>download("lyrics_timing.lrc",makeLrc());
exportSrt.onclick=()=>download("lyrics_timing.srt",makeSrt(),"application/x-subrip");
exportCsv.onclick=()=>download("lyrics_timing.csv",makeCsv(),"text/csv");
exportJson.onclick=()=>download("lyrics_tapper_project.json",JSON.stringify({app:"歌詞ハイ！タイマー",version:5,lyricText:lyrics.value,state},null,2),"application/json");
importJson.onchange=async()=>{const f=importJson.files[0];if(!f)return;try{const d=JSON.parse(await f.text());lyrics.value=d.lyricText||d.tapText||"";if(d.state){if(d.state.lines)state={...state,...d.state};else if(d.state.tapLines)state={lines:d.state.displayLines?.length===d.state.tapLines?.length?d.state.displayLines:d.state.tapLines,times:d.state.times||[],index:d.state.index||0,latencyMs:d.state.latencyMs??-120,rate:1}}latency.value=state.latencyMs??-120;setRate(state.rate||1);update()}catch{alert("JSONを読み込めませんでした")}};
clearAll.onclick=()=>{if(!confirm("作業データを消しますか？"))return;state={lines:[],times:[],index:0,latencyMs:-120,rate:1};lyrics.value="";latency.value=-120;localStorage.removeItem("lyricTapperProjectV5");update()};
document.onkeydown=e=>{if(["TEXTAREA","INPUT"].includes(e.target.tagName))return;if(e.code==="Space"){e.preventDefault();tapButton.click()}else if(e.code==="Backspace"){e.preventDefault();undo.click()}else if(e.code==="ArrowLeft"){audio.currentTime=Math.max(0,audio.currentTime-3)}else if(e.code==="ArrowRight"){audio.currentTime=Math.min(audio.duration||Infinity,audio.currentTime+3)}else if(e.key==="1"){setRate(.5)}else if(e.key==="2"){setRate(.75)}else if(e.key==="3"){setRate(1)}};
if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(()=>{}));
loadLocal();
