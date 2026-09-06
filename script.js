const $=id=>document.getElementById(id);
const audio=$('audio'),intro=$('intro'),player=$('player'),thanks=$('thanks'),play=$('play'),fill=$('fill'),thumb=$('thumb'),bar=$('bar'),now=$('now'),total=$('total'),track=$('lyricsTrack'),viewport=$('lyricsViewport'),volume=$('volume'),restart=$('restart'),restart2=$('restart2'),status=$('status'),syncValue=$('syncValue'),timeline=$('timeline'),momentText=$('momentText'),momentIcon=$('momentIcon'),toast=$('toast'),ending=$('ending'),again=$('again'),bars=$('bars'),soundState=$('soundState');
const cues=[[.70,'Про меня столько дерьма в инете пишут'],[3.55,'А злые черти, им бы лишь бы ненавидеть'],[6.55,'Кого-то, кто лучше живет, чем они'],[9.55,'Ну ниче я привык, а ты?'],[13.15,'Собирайся детка, я буду твоим водителем'],[17,'Ты и без косметики выглядишь охуительно'],[21,'Наша тачка сегодня, как мы с тобою, без крыши'],[25.1,'Путь длиною в жизнь, но сначала едем в Париж'],[29.15,'И даже если весь мир против нас'],[32.75,'Я буду улыбаться им назло'],[36.35,'Я соберу с себя всю эту грязь'],[40,'И посажу в ней цветок, для тебя, ага'],[43.65,'И даже если весь мир против нас'],[47.25,'Я буду улыбаться им назло'],[50.9,'Я соберу с себя всю эту грязь'],[54.55,'И посажу в ней цветок, для тебя, ага'],[58.35,'Вся команда в зале, тягаем железо'],[61.95,'Нужно много силы, чтобы поднимать те рэксы'],[65.55,'Бля, дела уже большие, и они давно не детские'],[69.25,'Чувствую, как я расту и становлюсь ответственнее'],[72.95,'Силу обретает королевство'],[76.55,'Со мной моя союзница с татуировкой ферзя'],[80.1,'Чистые мозги, я теперь двигаю на трезвом'],[83.8,'И могу сломать тебе ебало за коменты, сука'],[87.55,'Я вспоминаю прошлое с улыбкой'],[91.15,'Было столько грязи, но я посадил цветы в ней'],[94.85,'Спасибо всем, кто ранил мое сердце'],[98.45,'Благодаря вам, я теперь тот самый Алишер'],[102.2,'И даже если весь мир против нас'],[105.8,'Я буду улыбаться им назло'],[109.4,'Я соберу с себя всю эту грязь'],[113.05,'И посажу в ней цветок, для тебя, ага'],[116.7,'И даже если весь мир против нас'],[120.3,'Я буду улыбаться им назло'],[123.9,'Я соберу с себя всю эту грязь'],[127.5,'И посажу в ней цветок, для тебя, ага'],[131.35,'И посажу в ней цветок, для тебя'],[136.1,'И посажу в ней цветок, для тебя, ага']].map(([t,text])=>({t,text}));
const moments=[{t:0,icon:'✦',text:'первая нота — и пространство становится немного другим'},{t:29,icon:'♡',text:'если весь мир против — иногда достаточно улыбнуться ему назло'},{t:58,icon:'☽',text:'новая глава начинается там, где заканчивается старая'},{t:87,icon:'✧',text:'прошлое можно вспоминать с улыбкой'},{t:102,icon:'♡',text:'самый тёплый момент припева'},{t:136,icon:'✦',text:'последние слова — оставь их здесь ненадолго'}];
let sync=parseFloat(localStorage.getItem('lyricsSyncV3')??'-0.3'),active=-1,lineHeight=82,chorus=false,endedShown=false,timelineBuilt=false,analyser=null,source=null,audioCtx=null,data=null;
function makeLines(){track.innerHTML='';cues.forEach((cue,i)=>{const el=document.createElement('div');el.className='lyric-line';el.dataset.index=i;el.textContent=cue.text;track.appendChild(el)})}
function syncLineHeight(){const f=document.querySelector('.lyric-line');if(f)lineHeight=f.getBoundingClientRect().height}
function currentIndex(){let idx=-1;const t=audio.currentTime-sync;for(let i=0;i<cues.length;i++){if(t>=cues[i].t)idx=i;else break}return idx}
function updateLyrics(force=false){const idx=currentIndex();if(idx===active&&!force)return;active=idx;const lines=[...document.querySelectorAll('.lyric-line')];lines.forEach((el,i)=>{const d=Math.abs(i-idx);el.classList.toggle('active',i===idx);el.classList.toggle('near',d===1)});const center=viewport.clientHeight/2-lineHeight/2;track.style.transform=idx<0?`translateY(${center}px)`:`translateY(${center-idx*lineHeight}px)`;const inChorus=(idx>=8&&idx<=15)||(idx>=28&&idx<=35);if(inChorus!==chorus){chorus=inChorus;player.classList.toggle('chorus',chorus)}}
function fmt(s){s=Math.max(0,Math.floor(s||0));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}
function render(){const p=audio.duration?audio.currentTime/audio.duration:0;fill.style.width=p*100+'%';thumb.style.left=p*100+'%';now.textContent=fmt(audio.currentTime);updateLyrics();updateMoment()}
function updateMoment(){let m=moments[0];for(const x of moments)if(audio.currentTime>=x.t)m=x;momentIcon.textContent=m.icon;momentText.textContent=m.text;document.querySelectorAll('.point').forEach(p=>p.classList.toggle('active',Math.abs(+p.dataset.time-m.t)<.1))}
function setSync(v){sync=Math.max(-1,Math.min(1,+(sync+v).toFixed(1)));localStorage.setItem('lyricsSyncV3',sync);syncValue.textContent=(sync>0?'+':'')+sync.toFixed(1)+'s';updateLyrics(true)}
function buildTimeline(){if(timelineBuilt)return;timelineBuilt=true;moments.forEach(m=>{const p=document.createElement('button');p.className='point';p.dataset.time=m.t;p.style.left=((m.t/(audio.duration||155.85))*100)+'%';p.title=m.text;p.innerHTML='<span>'+fmt(m.t)+'</span>';p.addEventListener('click',async()=>{audio.currentTime=m.t;render();await safePlay()});timeline.appendChild(p)})}
function initAudio(){
  // Playback stays native: this avoids browsers dropping the user gesture
  // while Web Audio is being initialized. The visualizer is decorative.
  soundState.textContent='native audio';
  return true;
}
async function safePlay(){
  audio.muted=false;
  audio.volume=Number(volume.value);
  const promise=audio.play();
  if(promise && typeof promise.then==='function') await promise;
  soundState.textContent='playing';
  return true;
}
thanks.addEventListener('click',async()=>{intro.classList.add('hidden');player.classList.remove('hidden');syncLineHeight();updateLyrics(true);audio.volume=Number(volume.value);buildTimeline();initAudio();await safePlay()});
play.addEventListener('click',async()=>{if(audio.paused){initAudio();await safePlay()}else audio.pause()});
audio.addEventListener('play',()=>{play.querySelector('.play-icon').textContent='❚❚';status.textContent='играет';player.classList.add('playing');soundState.textContent='playing'});
audio.addEventListener('pause',()=>{play.querySelector('.play-icon').textContent='▶';status.textContent='пауза';player.classList.remove('playing');if(!audio.ended)soundState.textContent='paused'});
audio.addEventListener('loadedmetadata',()=>{total.textContent=fmt(audio.duration);syncLineHeight();updateLyrics(true);buildTimeline()});
audio.addEventListener('canplay',()=>{if(status.textContent==='готово')status.textContent='готово к старту'});
audio.addEventListener('error',()=>{status.textContent='ошибка аудио';soundState.textContent='audio error';console.error('Audio error',audio.error)});
audio.addEventListener('timeupdate',render);
audio.addEventListener('ended',()=>{play.querySelector('.play-icon').textContent='▶';status.textContent='конец';player.classList.remove('playing');soundState.textContent='finished';if(!endedShown){endedShown=true;setTimeout(()=>{ending.classList.remove('hidden');ending.setAttribute('aria-hidden','false')},700)}});
bar.addEventListener('click',e=>{if(!audio.duration)return;const r=bar.getBoundingClientRect();audio.currentTime=Math.min(1,Math.max(0,(e.clientX-r.left)/r.width))*audio.duration;render()});
volume.addEventListener('input',()=>{audio.volume=Number(volume.value)});
[restart,restart2].forEach(btn=>btn.addEventListener('click',async()=>{audio.currentTime=0;endedShown=false;ending.classList.add('hidden');ending.setAttribute('aria-hidden','true');active=-1;updateLyrics(true);render();await safePlay()}));
document.querySelectorAll('[data-sync]').forEach(b=>b.addEventListener('click',()=>setSync(Number(b.dataset.sync))));
$('syncReset').addEventListener('click',()=>{sync=-.3;localStorage.setItem('lyricsSyncV3',sync);syncValue.textContent='-0.3s';updateLyrics(true)});
syncValue.textContent=(sync>0?'+':'')+sync.toFixed(1)+'s';
again.addEventListener('click',async()=>{ending.classList.add('hidden');ending.setAttribute('aria-hidden','true');audio.currentTime=0;endedShown=false;await safePlay()});
$('theme').addEventListener('click',()=>document.body.classList.toggle('light'));
window.addEventListener('keydown',e=>{if(e.target.matches('input'))return;if(e.code==='Space'){e.preventDefault();play.click()}if(e.key==='ArrowLeft')audio.currentTime=Math.max(0,audio.currentTime-5);if(e.key==='ArrowRight')audio.currentTime=Math.min(audio.duration||audio.currentTime+5,audio.currentTime+5);if(e.key.toLowerCase()==='m'){audio.muted=!audio.muted;soundState.textContent=audio.muted?'muted':'audio on'}});
for(let i=0;i<56;i++){const b=document.createElement('i');bars.appendChild(b)}
const vcanvas=$('visualizer'),vctx=vcanvas.getContext('2d');
function drawViz(){
  requestAnimationFrame(drawViz);
  const t=performance.now()/1000;
  const amp=audio.paused?0.15:(0.35+0.25*Math.sin(t*4.7)+0.12*Math.sin(t*9.1));
  [...bars.children].forEach((b,i)=>{
    const wave=(Math.sin(t*(3.2+i*.07)+i*.9)+1)/2;
    b.style.height=Math.max(3,3+(wave*amp*28))+'px';
    b.style.opacity=.28+wave*.35;
  });
  vctx.clearRect(0,0,innerWidth,innerHeight);
}
drawViz();
const canvas=$('stars'),ctx=canvas.getContext('2d');let stars=[];function resizeCanvases(){const d=Math.min(devicePixelRatio||1,2);[canvas,vcanvas].forEach(c=>{c.width=innerWidth*d;c.height=innerHeight*d;c.style.width=innerWidth+'px';c.style.height=innerHeight+'px'});ctx.setTransform(d,0,0,d,0,0);vctx.setTransform(d,0,0,d,0,0);stars=Array.from({length:Math.floor(innerWidth*innerHeight/8500)},()=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,r:.18+Math.random()*1.1,a:.12+Math.random()*.58,p:Math.random()*6.28,s:.002+Math.random()*.008}))}function drawStars(){ctx.clearRect(0,0,innerWidth,innerHeight);for(const s of stars){s.p+=s.s;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,'+Math.max(.025,s.a+Math.sin(s.p)*.12)+')';ctx.fill()}requestAnimationFrame(drawStars)}resizeCanvases();drawStars();window.addEventListener('resize',()=>{resizeCanvases();syncLineHeight();updateLyrics(true)});
const secretTexts=['ты нашла маленькую звезду ✦','иногда важное прячется совсем рядом','это место только для тех, кто заметил','ещё одна маленькая причина улыбнуться','ты дошла сюда — значит, всё не зря'];function spawnSecret(){const s=document.createElement('button');s.className='secret-star';s.style.left=(8+Math.random()*84)+'vw';s.style.top=(10+Math.random()*76)+'vh';s.setAttribute('aria-label','секретная звезда');s.addEventListener('click',()=>{toast.textContent=secretTexts[Math.floor(Math.random()*secretTexts.length)];toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2400);s.remove()});document.body.appendChild(s);setTimeout(()=>s.remove(),18000)}setInterval(spawnSecret,9000);setTimeout(spawnSecret,2200);
function meteor(){const m=document.createElement('div');m.className='meteor';m.style.left=Math.random()*70+'vw';m.style.top=Math.random()*55+'vh';$('meteorLayer').appendChild(m);setTimeout(()=>m.remove(),1200)}setInterval(()=>{if(Math.random()>.25)meteor()},7600);
makeLines();syncLineHeight();
