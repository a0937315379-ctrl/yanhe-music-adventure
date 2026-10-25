import {firebaseConfig, ROOM, isConfigured} from './firebase-config.js';
const status=document.getElementById('syncStatus');
const setStatus=t=>{if(status)status.textContent=t};
if(!isConfigured){setStatus('⚪ 尚未填 Firebase 設定，目前單機模式');}
else{
  try {
    const [{initializeApp},{getAuth,signInAnonymously,onAuthStateChanged},{getDatabase,ref,set,serverTimestamp}] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js')]);
    const app=initializeApp(firebaseConfig,'yanhe-adventure-student');
    const auth=getAuth(app),db=getDatabase(app);
    let uid=null, last=null, sending=Promise.resolve();
    const send=(d)=>{
      last=d;
      if(!uid){setStatus('🟡 登入中，紀錄暫存在本機');return}
      const payload={
        nickname:String(d.nickname||'').slice(0,12),
        group:String(d.group||'1').slice(0,2),
        done:Array.isArray(d.done)?d.done.slice(0,4).map(Boolean):[false,false,false,false],
        emotion:String(d.emotion||'').slice(0,12),
        knowledgeCorrect:Array.isArray(d.answers)?Math.min(3,d.answers.length):0,
        coins:Math.min(1000,Math.max(0,Number(d.coins)||0)),
        knowledgeRetries:Array.isArray(d.tries)?d.tries.slice(0,3).map(x=>Number(x)||0):[0,0,0],
        song:String(d.song||'').slice(0,1),
        traits:Array.isArray(d.traits)?d.traits.slice(0,6).map(x=>String(x).slice(0,12)):[],
        feeling:String(d.feeling||'').slice(0,12),
        groupAgreed:!!d.groupOK,
        exit:Array.isArray(d.exit)?d.exit.slice(0,3).map(a=>({answer:Number(a.answer)||0,correct:!!a.correct})):[],
        stage:Number(d.level)||0,
        updatedAt:serverTimestamp()
      };
      sending=sending.catch(()=>{}).then(()=>set(ref(db,`musicAdventureV2/${ROOM}/students/${uid}`),payload))
        .then(()=>setStatus('🟢 學習紀錄已同步到教師端'))
        .catch(e=>{console.error(e);setStatus('🔴 同步失敗：請檢查Rules／網路')});
    };
    window.addEventListener('yanhe:save',e=>send(e.detail));
    onAuthStateChanged(auth,user=>{
      if(user){uid=user.uid;setStatus('🟡 已登入，正在同步');if(last)send(last);else send({...JSON.parse(localStorage.getItem('yanhe-adventure-v1')||'{}'),nickname:document.getElementById('nickname').value,group:document.getElementById('group').value})}
      else signInAnonymously(auth).catch(e=>{console.error(e);setStatus('🔴 匿名登入失敗，請啟用Anonymous')});
    });
  }catch(e){console.error(e);setStatus('🔴 載入Firebase失敗；可離線試玩')}
}
