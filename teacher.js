import {firebaseConfig, ROOM, TEACHER_UID, isConfigured} from './firebase-config.js';
const $=id=>document.getElementById(id), say=s=>$('msg').textContent=s;
const roles={tone:'音色偵探',tempo:'速度偵探',feeling:'情緒偵探',director:'廣告導演'};
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
if(!isConfigured){say('尚未填寫 firebase-config.js，請先完成Firebase設定。');$('login').disabled=true;}
else {
try{
const [{initializeApp},{getAuth,GoogleAuthProvider,signInWithPopup,signInWithRedirect,onAuthStateChanged},{getDatabase,ref,onValue}] = await Promise.all([
import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js'),import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js'),import('https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js')]);
const app=initializeApp(firebaseConfig,'yanhe-adventure-teacher'),auth=getAuth(app),db=getDatabase(app);
let unsub=null,records={};
$('login').onclick=async()=>{try{await signInWithPopup(auth,new GoogleAuthProvider())}catch(e){if(e.code==='auth/popup-blocked')await signInWithRedirect(auth,new GoogleAuthProvider());else say('登入失敗：'+e.code)}};
onAuthStateChanged(auth,user=>{if(unsub){unsub();unsub=null}if(!user){$('dashboard').hidden=true;say('請用原本V4.2使用的教師Google帳號登入。');return}if(user.uid!==TEACHER_UID){$('dashboard').hidden=true;say('這個帳號不是設定的教師UID，不能查看學生資料。請確認 firebase-config.js 的 TEACHER_UID。');return}say('🟢 已通過教師身分驗證，正在即時監看 '+ROOM+' 教室');$('dashboard').hidden=false;unsub=onValue(ref(db,`adventure/${ROOM}/students`),snap=>{records=snap.val()||{};render()},e=>{say('🔴 資料庫拒絕讀取：請檢查Rules及UID。'+e.code)})});
$('filter').onchange=render;
function render(){const all=Object.values(records).filter(v=>v&&typeof v==='object'),n=all.length;$('n').textContent=n;[0,2,3].forEach((stage,i)=>$( ['l1','l3','l4'][i]).textContent=all.filter(v=>Array.isArray(v.done)&&v.done[stage]).length+' / '+n);
$('stats').innerHTML=['💗 情緒森林','🎼 節奏山谷','🏰 配樂城堡','🏆 離場挑戰'].map((name,i)=>{let count=all.filter(v=>Array.isArray(v.done)&&v.done[i]).length;return `<p><b>${name}</b>：${count} / ${n}　<span class="pill">${n?Math.round(count/n*100):0}%</span></p>`}).join('');
const exits=[0,1,2].map(i=>({count:all.filter(v=>v.exit?.[i]).length,correct:all.filter(v=>v.exit?.[i]?.correct).length}));
$('learning').innerHTML=`<p>第二關完成全部3題：<b>${all.filter(v=>v.knowledgeCorrect===3).length}/${n}</b></p><p>第二關累計答錯重試：<b>${all.reduce((s,v)=>s+(v.knowledgeRetries||[]).reduce((a,b)=>a+(Number(b)||0),0),0)}</b>次</p>`+exits.map((x,i)=>`<p>離場券第${i+1}題：已答 ${x.count} 人，答對 ${x.correct} 人，正確率 ${x.count?Math.round(x.correct/x.count*100):0}%</p>`).join('');
let groupLines=[];for(let i=1;i<=8;i++){let members=all.filter(v=>v.group===String(i)),votes={};members.forEach(m=>{if(m.song)votes[m.song]=(votes[m.song]||0)+1});let sample=members.filter(m=>m.groupAgreed&&m.song).map(m=>`${esc(m.nickname||'未填代號')}（${esc(roles[m.role]||'未選角色')}）：${esc(m.song)}版 / ${esc((m.traits||[]).join('、'))} / ${esc(m.feeling)}`).slice(0,5);groupLines.push(`<tr><td>第${i}組</td><td>${members.length}人</td><td>${esc(Object.entries(votes).map(([k,v])=>k+':'+v).join('、')||'—')}</td><td>${sample.join('<div style="margin:6px 0"></div>')||'未提交共識'}</td></tr>`)}
$('groups').innerHTML='<p class="mini muted">目前為「每位組員各自確認小組提案」，不等於已具備組長統一鎖定的跨裝置共識機制。</p><table><tr><th>組別</th><th>人數</th><th>BGM選擇</th><th>已勾選共識的提案</th></tr>'+groupLines.join('')+'</table>';
const filter=$('filter').value,visible=all.filter(v=>filter==='all'||v.group===filter);$('studentRows').innerHTML=visible.map(v=>`<tr><td>${esc(v.nickname||'未填')}</td><td>${esc(v.group||'—')}</td><td>${(v.done||[]).filter(Boolean).length}/4</td><td>${Number(v.knowledgeCorrect)||0}/3</td><td>${(v.knowledgeRetries||[]).reduce((a,b)=>a+(Number(b)||0),0)}</td><td>${esc(v.song||'—')}</td><td>${(v.exit||[]).filter(q=>q?.correct).length}/${(v.exit||[]).length}</td><td>${v.updatedAt?'已同步':'待同步'}</td></tr>`).join('')||'<tr><td colspan="8">尚無學生紀錄</td></tr>';
}
}catch(e){console.error(e);say('程式載入失敗，請檢查網路或Firebase設定。')}
}
