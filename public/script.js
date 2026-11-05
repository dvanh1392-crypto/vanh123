'use strict';
const socket=io();
const $=id=>document.getElementById(id);
let game='baccarat',state=null,selected=new Set(),language='vi';
const dict={vi:{welcome:'CHƠI BÀI CÙNG BẠN BÈ',heading:'Chọn trò chơi của bạn',virtual:'Chỉ dùng điểm VND ảo, không có nạp hoặc rút tiền thật.',name:'Tên của bạn',capacity:'Số người trong phòng',create:'Tạo phòng mới',join:'Vào phòng',room:'Phòng',leave:'Thoát phòng',copy:'Sao chép link mời'},zh:{welcome:'和朋友一起玩纸牌',heading:'选择游戏',virtual:'仅使用虚拟越南盾积分，不支持真实充值或提现。',name:'你的昵称',capacity:'房间人数',create:'创建房间',join:'加入房间',room:'房间',leave:'退出房间',copy:'复制邀请链接'}};
function toast(msg){$('toast').textContent=msg;$('toast').style.display='block';setTimeout(()=>$('toast').style.display='none',3000);}
const money=n=>Number(n||0).toLocaleString('vi-VN')+' VND';
const card=c=>`<span class="card ${'♥♦'.includes(c.s)?'red':''}">${c.n===1?'A':c.n===11?'J':c.n===12?'Q':c.n===13?'K':c.n}${c.s}</span>`;
const cards=arr=>`<div class="cards">${(arr||[]).map(card).join('')}</div>`;
const names={baccarat:'Baccarat · 乐彩',three:'Ba Cây · 三张牌',sam:'Sâm Lốc · 越南跑牌'};
function button(label,fn,secondary=false){const b=document.createElement('button');b.textContent=label;if(secondary)b.className='secondary';b.onclick=fn;$('controls').appendChild(b);return b;}
function showRoom(on){$('home').classList.toggle('hidden',on);$('room').classList.toggle('hidden',!on);}
function render(){if(!state)return;showRoom(true);$('gameName').textContent=names[state.game];$('roomCode').textContent=state.code;$('round').textContent=`Ván ${state.round} · ${state.players.length}/${state.capacity}`;
 $('players').innerHTML=state.players.map(p=>`<div class="player ${state.turn===p.id?'active':''}"><b>${escapeHtml(p.name)} ${p.id===state.host?'👑':''} ${p.id===state.you?'(Bạn)':''}</b><small>${money(p.balance)} ảo</small><small>${state.phase==='lobby'||state.phase==='result'?(p.ready?'✓ Sẵn sàng':'Đang chờ'):state.game==='sam'?`${p.count} lá`:p.choice?'✓ Đã chọn':'Đang chọn'}</small></div>`).join('');
 $('notice').textContent=state.notice||'';$('controls').replaceChildren();$('table').innerHTML='';$('myhand').innerHTML='';$('results').innerHTML='';
 if(state.phase==='lobby'||state.phase==='result'){const me=state.players.find(p=>p.id===state.you);button(me?.ready?'Hủy sẵn sàng':'✓ Sẵn sàng / Chơi tiếp',()=>socket.emit('ready'),!!me?.ready);}
 if(state.phase==='betting'){const me=state.players.find(p=>p.id===state.you);$('table').textContent='Chọn bên bạn dự đoán thắng. Khi tất cả đã chọn, bài sẽ được chia.';for(const [key,text] of [['banker','庄 · Banker'],['player','闲 · Player'],['tie','和 · Tie']]){const b=button(text,()=>socket.emit('choose',key));b.disabled=!!me?.choice;}if(me?.choice)$('table').textContent='Đã chọn. Chờ các người chơi khác.';}
 if(state.game==='baccarat'&&state.result?.game==='baccarat'){$('table').innerHTML=`<b>闲 · Player — ${state.result.playerScore} điểm</b>${cards(state.result.player)}<b>庄 · Banker — ${state.result.bankerScore} điểm</b>${cards(state.result.banker)}<h3 class="win">Kết quả: ${{player:'闲 thắng',banker:'庄 thắng',tie:'Hòa'}[state.result.winner]}</h3>`;$('results').innerHTML=`Người dự đoán đúng (+500): ${state.players.filter(p=>state.result.winners.includes(p.id)).map(p=>escapeHtml(p.name)).join(', ')||'Không có'}`;}
 if(state.game==='three'&&state.result?.game==='three'){$('table').innerHTML='<h3>Ba Cây — Kết quả</h3>';$('results').innerHTML=state.result.scores.map(x=>`<div class="result-row"><b>${escapeHtml(x.name)}</b> · ${x.score} điểm ${state.result.winners.includes(x.id)?'<span class="win">🏆 +500</span>':''}${cards(x.hand)}</div>`).join('');}
 if(state.game==='sam'){if(state.phase==='playing'){$('table').innerHTML=state.table?`<b>${escapeHtml(state.players.find(p=>p.id===state.table.by)?.name||'')} đã đánh</b>${cards(state.table.cards)}`:'<b>Vòng mới — chọn bài để đánh</b>';
 $('myhand').innerHTML=state.hand.map((c,i)=>`<button class="card ${'♥♦'.includes(c.s)?'red':''} ${selected.has(i)?'pick':''}" data-index="${i}">${c.n===1?'A':c.n===11?'J':c.n===12?'Q':c.n===13?'K':c.n}${c.s}</button>`).join('');$('myhand').querySelectorAll('button').forEach(el=>el.onclick=()=>{const i=Number(el.dataset.index);selected.has(i)?selected.delete(i):selected.add(i);el.classList.toggle('pick');});
 if(state.turn===state.you){button('Đánh bài đã chọn',()=>{socket.emit('samPlay',[...selected].sort((a,b)=>a-b));selected.clear();});if(state.table)button('Bỏ lượt',()=>socket.emit('samPass'),true);if(!state.table&&!state.announced)button('📣 Báo Sâm',()=>socket.emit('samAnnounce'),true);}else $('results').textContent='Chờ người khác đánh bài...';
 if(state.announced)$('results').textContent=`${escapeHtml(state.players.find(p=>p.id===state.announced)?.name||'')} đang báo Sâm.`;
 }else if(state.result?.game==='sam'){$('table').innerHTML=`<h3 class="win">🏆 ${escapeHtml(state.players.find(p=>p.id===state.result.winner)?.name||'')} thắng!</h3>`;$('results').innerHTML=state.result.transfers.map(t=>`<div class="result-row">${escapeHtml(t.from)} → ${escapeHtml(t.to)}: ${money(t.amount)} ảo</div>`).join('')||'Không có người bị trừ điểm.';}}
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function enter(code){history.replaceState(null,'',`?room=${encodeURIComponent(code)}`);selected.clear();}
function name(){const n=$('name').value.trim();if(n)localStorage.setItem('cardroom-name',n);return n;}
function callback(res){if(res?.error)return toast(res.error);if(res?.code)enter(res.code);}
$('create').onclick=()=>{if(!name())return toast('Hãy nhập tên.');socket.emit('create',{name:name(),capacity:Number($('capacity').value),game},callback);};
$('join').onclick=()=>{if(!name())return toast('Hãy nhập tên.');const code=$('joinCode').value.trim().toUpperCase();if(!code)return toast('Hãy nhập mã phòng.');socket.emit('join',{name:name(),code},callback);};
$('leave').onclick=()=>{socket.emit('leave');state=null;selected.clear();history.replaceState(null,'',location.pathname);showRoom(false);};
$('copy').onclick=async()=>{const url=location.origin+location.pathname+'?room='+state.code;try{await navigator.clipboard.writeText(url);toast('Đã sao chép link mời.');}catch{prompt('Sao chép link:',url);}};
$('lang').onclick=()=>{language=language==='vi'?'zh':'vi';document.querySelectorAll('[data-i]').forEach(el=>el.textContent=dict[language][el.dataset.i]);};
document.querySelectorAll('.game').forEach(el=>el.onclick=()=>{game=el.dataset.game;document.querySelectorAll('.game').forEach(e=>e.classList.toggle('selected',e===el));});
socket.on('state',s=>{if(!state||state.round!==s.round||state.phase!==s.phase||state.turn!==s.turn)selected.clear();state=s;render();});socket.on('errorMessage',toast);socket.on('disconnect',()=>toast('Mất kết nối máy chủ. Tải lại trang để vào phòng mới.'));
$('name').value=localStorage.getItem('cardroom-name')||'';const invite=new URLSearchParams(location.search).get('room');if(invite){$('joinCode').value=invite.toUpperCase();toast('Đã điền mã phòng. Nhập tên rồi bấm Vào phòng.');}
