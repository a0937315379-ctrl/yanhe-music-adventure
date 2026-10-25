import {firebaseConfig, ROOM, isConfigured} from './firebase-config.js';
const label=document.getElementById('syncStatus');
const status=x=>{if(label)label.textContent=x};
let last=null,uid=null,db=null,api=null,chain=Promise.resolve();
const key='yanhe-adventure-v4';
function current(){let s={};try{s=JSON.parse(localStorage.getItem(key)||'{}')}catch{}return {...s,nickname:document.getElementById('nickname')?.value||'',group:document.getElementById('group')?.value||'1'};}
function payload(x){return {
 nickname:String(x.nickname||'').slice(0,12),group:String(x.group||'1'),
 done:Array.isArray(x.done)?x.done.slice(0,4).map(Boolean):[false,false,false,false],
 coins:Math.max(0,Math.min(170,Number(x.coins)||0)),
 emotion:String(x.emotion||'').slice(0,12),
 knowledgeCorrect:Array.isArray(x.answers)?Math.min(3,x.answers.length):0,
 knowledgeRetries:Array.isArray(x.tries)?x.tries.slice(0,3).map(v=>Math.max(0,Number(v)||0)):[0,0,0],
 song:String(x.song||'').slice(0,1),traits:Array.isArray(x.traits)?x.traits.slice(0,6).map(v=>String(v).slice(0,16)):[],
 feeling:String(x.feeling||'').slice(0,12),groupAgreed:!!x.groupOK,
 exit:Array.isArray(x.exit)?x.exit.slice(0,3).map(a=>({answer:Number(a.answer)||0,correct:!!a.correct})):[],
 stage:Math.max(0,Math.min(3,Number(x.level)||0)),updatedAt:api.serverTimestamp()
};}
function sync(x){last=x;if(!uid||!db||!api){status('🟡 冒險紀錄暫存在本機，正在連線');return;}
 const data=payload(x);chain=chain.catch(()=>{}).then(()=>api.set(api.ref(db,`adventure/${ROOM}/students/${uid}`),data))
 .then(()=>status('🟢 第二～四島學習紀錄已同步教師端'))
 .catch(e=>{console.error(e);status('🔴 同步失敗：'+(e.code||e.message));});}
window.addEventListener('yanhe:save',e=>sync(e.detail));
if(!isConfigured){status('⚪ 尚未填寫 firebase-config.js；目前維持單機紀錄');}
else try {
 const [{initializeApp},{getAuth,signInAnonymously,onAuthStateChanged},{getDatabase,ref,set,serverTimestamp}]=await Promise.all([
 import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js'),
 import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js'),
 import('https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js')]);
 api={ref,set,serverTimestamp};const app=initializeApp(firebaseConfig,'yanhe-adventure-student');db=getDatabase(app);const auth=getAuth(app);
 onAuthStateChanged(auth,u=>{if(u){uid=u.uid;sync(last||current());}else signInAnonymously(auth).catch(e=>status('🔴 學生登入失敗：'+e.code));});
}catch(e){console.error(e);status('🔴 Firebase 模組載入失敗，可先單機試玩')}
