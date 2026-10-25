import {firebaseConfig, ROOM, isConfigured} from './firebase-config.js';
const label=document.getElementById('syncStatus');
const status=x=>{if(label)label.textContent=x};
let last=null,uid=null,db=null,api=null,chain=Promise.resolve(),stopKeys=null;
const lesson=(new URLSearchParams(location.search).get('lesson')||'').trim().toUpperCase();const key='yanhe-adventure-v4-'+lesson;
function current(){let s={};try{s=JSON.parse(localStorage.getItem(key)||'{}')}catch{}return {...s,nickname:document.getElementById('nickname')?.value||'',group:document.getElementById('group')?.value||'1'};}
function payload(x){return {
 nickname:String(x.nickname||'').slice(0,12),group:String(x.group||'1'),
 done:Array.isArray(x.done)?x.done.slice(0,4).map(Boolean):[false,false,false,false],
 coins:Math.max(0,Math.min(170,Number(x.coins)||0)),
 emotion:String(x.emotion||'').slice(0,12),
 knowledgeCorrect:Array.isArray(x.answers)?Math.min(3,x.answers.length):0,
 knowledgeRetries:Array.isArray(x.tries)?x.tries.slice(0,3).map(v=>Math.max(0,Number(v)||0)):[0,0,0],
 role:String(x.role||'').slice(0,16),song:String(x.song||'').slice(0,1),traits:Array.isArray(x.traits)?x.traits.slice(0,6).map(v=>String(v).slice(0,16)):[],
 feeling:String(x.feeling||'').slice(0,12),groupAgreed:!!x.groupOK,
 exit:Array.isArray(x.exit)?x.exit.slice(0,3).map(a=>({answer:Number(a.answer)||0,correct:!!a.correct})):[],
 stage:Math.max(0,Math.min(3,Number(x.level)||0)),updatedAt:api.serverTimestamp()
};}
function sync(x){last=x;if(!uid||!db||!api){status('🟡 冒險紀錄暫存在本機，正在連線');return;}
 const data=payload(x);chain=chain.catch(()=>{}).then(()=>api.set(api.ref(db,`adventureSessions/${lesson}/students/${uid}`),data))
 .then(()=>status('🟢 第二～四島學習紀錄已同步教師端'))
 .catch(e=>{console.error(e);status('🔴 同步失敗：'+(e.code||e.message));});}
window.addEventListener('yanhe:save',e=>sync(e.detail));
if(!isConfigured){status('⚪ 尚未填寫 firebase-config.js；目前維持單機紀錄');}
else try {
 const [{initializeApp},{getAuth,signInAnonymously,onAuthStateChanged},{getDatabase,ref,set,get,serverTimestamp,onValue,runTransaction}]=await Promise.all([
 import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js'),
 import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js'),
 import('https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js')]);
 api={ref,set,get,serverTimestamp,onValue,runTransaction};const app=initializeApp(firebaseConfig,'yanhe-adventure-student');db=getDatabase(app);const auth=getAuth(app);
 onAuthStateChanged(auth,async u=>{if(u){uid=u.uid;window.yanheMyUID=uid;if(!lesson)return;try{const snap=await api.get(api.ref(db,`adventureSessions/${lesson}/meta`));if(!snap.exists()){status('🔴 課堂代碼不存在');document.getElementById('sessionGateMsg').textContent='找不到這堂課，請確認老師提供的代碼';return;}document.getElementById('sessionGate').style.display='none';sync(last||current());subscribeKeys();}catch(e){status('🔴 課堂驗證失敗：'+e.code);document.getElementById('sessionGateMsg').textContent='代碼驗證失敗，請確認老師已建立課堂';}}else signInAnonymously(auth).catch(e=>status('🔴 學生登入失敗：'+e.code));});
}catch(e){console.error(e);status('🔴 Firebase 模組載入失敗，可先單機試玩')}

function subscribeKeys(){if(!db||!uid||!api)return;if(stopKeys)stopKeys();const group=document.getElementById('group')?.value||'1';stopKeys=api.onValue(api.ref(db,`adventureSessions/${lesson}/groupKeys/${group}`),snapshot=>{const obj=snapshot.val()||{};const keys={};for(const role of ['tone','tempo','feeling','director'])if(obj[role])keys[role]=obj[role];const ids=Object.values(keys).map(k=>k.uid);const valid=ids.length===4&&new Set(ids).size===4;window.dispatchEvent(new CustomEvent('yanhe:castle-update',{detail:{keys,final:valid?obj.final||null:null}}));},err=>status('🔴 小組鑰匙讀取失敗：'+err.code));}
window.addEventListener('yanhe:group-change',subscribeKeys);
window.addEventListener('yanhe:castle-key',async e=>{if(!uid||!api||!db){window.dispatchEvent(new CustomEvent('yanhe:castle-feedback',{detail:'⚠️ 尚未登入Firebase，稍後再試。'}));return}const {group,role,song,trait,feeling}=e.detail;const validRoles=['tone','tempo','feeling','director'];if(!validRoles.includes(role)||!['A','B','C'].includes(song)||!trait||!feeling)return;
try{const target=api.ref(db,`adventureSessions/${lesson}/groupKeys/${group}/${role}`);const res=await api.runTransaction(target,current=>{if(current&&current.uid!==uid)return;return {uid,song,trait,feeling};},{applyLocally:false});window.dispatchEvent(new CustomEvent('yanhe:castle-feedback',{detail:res.committed?'✅ 鑰匙已放進小組寶箱！':'⚠️ 這個角色已有組員選擇，請選另一把鑰匙。'}));}catch(err){window.dispatchEvent(new CustomEvent('yanhe:castle-feedback',{detail:'⚠️ 上傳失敗：'+(err.code||err.message)}));}});
window.addEventListener('yanhe:castle-final',async e=>{if(!uid||!api||!db)return;try{await api.set(api.ref(db,`adventureSessions/${lesson}/groupKeys/${e.detail.group}/final`),{uid,song:e.detail.song});}catch(err){window.dispatchEvent(new CustomEvent('yanhe:castle-feedback',{detail:'⚠️ 提交失敗：'+(err.code||err.message)}));}});
