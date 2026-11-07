'use strict';
const socket = typeof window.io === 'function' ? window.io() : null;
if (!socket) {
  window.addEventListener('DOMContentLoaded', () => {
    const alert = document.createElement('div');
    alert.className = 'server-alert';
    alert.textContent = 'Không kết nối được máy chủ Socket.IO. Hãy chạy npm start và mở http://localhost:3000, hoặc triển khai trên Render bằng Web Service (không dùng Static Site).';
    document.body.prepend(alert);
  });
}

const $=id=>document.getElementById(id);
let game='baccarat',state=null,selected=new Set(),language='vi';
const dict={vi:{welcome:'CHƠI BÀI CÙNG BẠN BÈ',heading:'Chọn trò chơi của bạn',virtual:'Chỉ dùng điểm VND ảo, không có nạp hoặc rút tiền thật.',name:'Tên của bạn',capacity:'Số người trong phòng',create:'Tạo phòng mới',join:'Vào phòng',room:'Phòng',leave:'Thoát phòng',copy:'Sao chép link mời'},zh:{welcome:'和朋友一起玩纸牌',heading:'选择游戏',virtual:'仅使用虚拟越南盾积分，不支持真实充值或提现。',name:'你的昵称',capacity:'房间人数',create:'创建房间',join:'加入房间',room:'房间',leave:'退出房间',copy:'复制邀请链接'}};
const tr={
vi:{you:'Bạn',round:'Ván',cards:'lá',ready:'Sẵn sàng',waiting:'Đang chờ',chosen:'Đã chọn',choosing:'Đang chọn',cancel:'Hủy sẵn sàng',again:'✓ Sẵn sàng / Chơi tiếp',chooseSide:'Chọn bên bạn dự đoán thắng. Khi tất cả đã chọn, bài sẽ được chia.',chosenWait:'Đã chọn. Chờ các người chơi khác.',score:'điểm',win:'thắng',draw:'Hòa',result:'Kết quả',correct:'Người dự đoán đúng (+500)',none:'Không có',threeResult:'Ba Cây — Kết quả',newTrick:'Vòng mới — chọn bài để đánh',played:'đã đánh',play:'Đánh bài đã chọn',pass:'Bỏ lượt',announce:'📣 Báo Sâm',decline:'Không báo Sâm',announceWait:'Đang chờ người chơi quyết định báo Sâm',announcePrompt:'Chỉ được báo Sâm ngay sau khi chia bài, trước khi đánh.',announceActive:'đang báo Sâm.',otherTurn:'Chờ người khác đánh bài...',winner:'thắng!',noDeduction:'Không có người bị trừ điểm.',enterName:'Hãy nhập tên.',enterCode:'Hãy nhập mã phòng.',noServer:'Chưa kết nối máy chủ. Hãy mở game từ Web Service.',copied:'Đã sao chép link mời.',copyPrompt:'Sao chép link:',lost:'Mất kết nối máy chủ. Tải lại trang để vào phòng mới.',invite:'Đã điền mã phòng. Nhập tên rồi bấm Vào phòng.',capacityUnit:'người',namePlaceholder:'Nhập tên người chơi',codePlaceholder:'Mã phòng 6 ký tự',notice:'Thông báo',virtualSuffix:'ảo'},
zh:{you:'你',round:'第',cards:'张',ready:'已准备',waiting:'等待中',chosen:'已选择',choosing:'选择中',cancel:'取消准备',again:'✓ 准备 / 再来一局',chooseSide:'请选择庄、闲或和。所有人选择后自动发牌。',chosenWait:'已选择，等待其他玩家。',score:'点',win:'获胜',draw:'平局',result:'结果',correct:'猜对的玩家（+500）',none:'无',threeResult:'三张牌 — 结果',newTrick:'新一轮 — 请选择要出的牌',played:'出了',play:'出选中的牌',pass:'过牌',announce:'📣 报参',decline:'不报参',announceWait:'等待其他玩家决定是否报参',announcePrompt:'只能在发牌后、首次出牌前报参。',announceActive:'正在报参。',otherTurn:'等待其他玩家出牌...',winner:'获胜！',noDeduction:'没有扣分记录。',enterName:'请输入昵称。',enterCode:'请输入房间码。',noServer:'无法连接服务器，请通过 Web Service 打开游戏。',copied:'邀请链接已复制。',copyPrompt:'复制链接：',lost:'与服务器断开连接，请刷新页面。',invite:'已填写房间码，请输入昵称并点击加入房间。',capacityUnit:'人',namePlaceholder:'输入玩家昵称',codePlaceholder:'6位房间码',notice:'通知',virtualSuffix:'虚拟积分'}};
const t=k=>tr[language][k]||k;
const errorTranslations={
'Bộ bài không hợp lệ':'牌型无效','Không chặn được':'无法压过','Chọn lá bài hợp lệ':'请选择有效的牌','Không được về bằng lá 2':'不能以2作为最后一张牌','Bạn không còn trong phòng':'你已不在房间内','Phòng đã đủ người':'房间已满','Đang chơi, vui lòng chờ ván sau':'游戏进行中，请等待下一局','Mã phòng hoặc tên không hợp lệ':'房间码或昵称无效','Thông tin phòng không hợp lệ':'房间信息无效'};
function translateServer(str){
 if(language==='vi')return str||'';
 let out=str||'';
 const fixed={
 'Có người rời phòng, ván Sâm bị hủy để đảm bảo công bằng.':'有玩家离开房间，本局跑牌已取消。',
 'Có người rời phòng, ván bị hủy.':'有玩家离开房间，本局已取消。',
 'Giai đoạn báo Sâm: mỗi người chọn Báo Sâm hoặc Không báo. Chưa được đánh bài.':'报参阶段：每位玩家选择报参或不报参，暂时不能出牌。',
 'Không ai báo Sâm. Bắt đầu đánh bài.':'无人报参，开始出牌。',
 'Mỗi người chọn 庄 / 闲 / 和.':'每位玩家请选择庄、闲或和。',
 'Đã công bố kết quả Baccarat.':'百家乐结果已公布。',
 'Mọi người bỏ lượt, người đánh cuối mở vòng mới.':'其他玩家均已过牌，最后出牌者开始新一轮。',
 'Người cao điểm nhất nhận 500 điểm ảo':'点数最高者获得500虚拟积分',
 'Đồng điểm: cùng thắng 500 điểm ảo':'最高分并列，各得500虚拟积分'
 };
 if(fixed[out])return fixed[out];
 for(const [vi,zh] of Object.entries(errorTranslations))out=out.replaceAll(vi,zh);
 out=out.replace('Bộ bài không hợp lệ: chỉ được đánh lẻ, đôi, bộ ba, tứ quý hoặc sảnh liên tiếp.','牌型无效：只能出单张、对子、三张、四张或顺子。')
 .replace('Nếu bị chặn sẽ thua 20.000 điểm ảo.','若被压过将扣除20,000虚拟积分。')
 .replace(' báo Sâm!',' 报参！').replace(' thắng ván!',' 赢得本局！')
 .replace('Không chặn được: bài bạn chọn','无法压过：你选择的牌型')
 .replace('và bài trên bàn','，桌上的牌型为')
 .replace(' — BÁO 1!',' — 剩1张！')
 .replace(' đánh ',' 出牌 ');
 return out;
}
function applyLanguage(){document.documentElement.lang=language==='vi'?'vi':'zh';document.querySelectorAll('[data-i]').forEach(el=>{const v=dict[language][el.dataset.i];if(v)el.textContent=v;});$('name').placeholder=t('namePlaceholder');$('joinCode').placeholder=t('codePlaceholder');[...$('capacity').options].forEach(o=>o.textContent=o.value+' '+t('capacityUnit'));document.querySelector('[data-game="three"] small').textContent=language==='vi'?'3 lá · 500 điểm':'3张 · 500积分';document.querySelector('[data-game="sam"] small').textContent=language==='vi'?'10 lá · 1.000/lá':'10张 · 每张1,000积分';document.querySelector('footer').textContent=language==='vi'?'Card Room · Demo game · VND ảo · Phòng lưu tạm trên máy chủ':'Card Room · 演示游戏 · 虚拟越南盾积分 · 房间暂存在服务器';if(state)render();}
function toast(msg){$('toast').textContent=msg;$('toast').style.display='block';setTimeout(()=>$('toast').style.display='none',3000);}
const money=n=>Number(n||0).toLocaleString('vi-VN')+' VND';
const card=c=>`<span class="card ${'♥♦'.includes(c.s)?'red':''}">${c.n===1?'A':c.n===11?'J':c.n===12?'Q':c.n===13?'K':c.n}${c.s}</span>`;
const cards=arr=>`<div class="cards">${(arr||[]).map(card).join('')}</div>`;
const names={baccarat:'Baccarat · 乐彩',three:'Ba Cây · 三张牌',sam:'Sâm Lốc · 越南跑牌'};
function button(label,fn,secondary=false){const b=document.createElement('button');b.textContent=label;if(secondary)b.className='secondary';b.onclick=fn;$('controls').appendChild(b);return b;}
function showRoom(on){$('home').classList.toggle('hidden',on);$('room').classList.toggle('hidden',!on);}
function render(){if(!state)return;showRoom(true);$('gameName').textContent=names[state.game];$('roomCode').textContent=state.code;$('round').textContent=`${t('round')} ${state.round} · ${state.players.length}/${state.capacity}`;
 $('players').innerHTML=state.players.map(p=>`<div class="player ${state.turn===p.id?'active':''}"><b>${escapeHtml(p.name)} ${p.id===state.host?'👑':''} ${p.id===state.you?`(${t('you')})`:''}</b><small>${money(p.balance)} ${t('virtualSuffix')}</small><small>${state.phase==='lobby'||state.phase==='result'?(p.ready?`✓ ${t('ready')}`:t('waiting')):state.game==='sam'?`${p.count} ${t('cards')}`:p.choice?`✓ ${t('chosen')}`:t('choosing')}</small></div>`).join('');
 $('notice').textContent=translateServer(state.notice);$('controls').replaceChildren();$('table').innerHTML='';$('myhand').innerHTML='';$('results').innerHTML='';
 if(state.phase==='lobby'||state.phase==='result'){const me=state.players.find(p=>p.id===state.you);button(me?.ready?t('cancel'):t('again'),()=>socket.emit('ready'),!!me?.ready);}
 if(state.phase==='betting'){const me=state.players.find(p=>p.id===state.you);$('table').textContent=t('chooseSide');for(const [key,text] of [['banker','庄 · Banker'],['player','闲 · Player'],['tie','和 · Tie']]){const b=button(text,()=>socket.emit('choose',key));b.disabled=!!me?.choice;}if(me?.choice)$('table').textContent=t('chosenWait');}
 if(state.game==='baccarat'&&state.result?.game==='baccarat'){$('table').innerHTML=`<b>闲 · Player — ${state.result.playerScore} ${t('score')}</b>${cards(state.result.player)}<b>庄 · Banker — ${state.result.bankerScore} ${t('score')}</b>${cards(state.result.banker)}<h3 class="win">${t('result')}: ${{player:'闲',banker:'庄',tie:''}[state.result.winner]} ${state.result.winner==='tie'?t('draw'):t('win')}</h3>`;$('results').innerHTML=`${t('correct')}: ${state.players.filter(p=>state.result.winners.includes(p.id)).map(p=>escapeHtml(p.name)).join(', ')||t('none')}`;}
 if(state.game==='three'&&state.result?.game==='three'){$('table').innerHTML=`<h3>${t('threeResult')}</h3>`;$('results').innerHTML=state.result.scores.map(x=>`<div class="result-row"><b>${escapeHtml(x.name)}</b> · ${x.score} ${t('score')} ${state.result.winners.includes(x.id)?'<span class="win">🏆 +500</span>':''}${cards(x.hand)}</div>`).join('');}
 if(state.game==='sam'){if(state.phase==='announce'){$('myhand').innerHTML=cards(state.hand);$('table').textContent=t('announcePrompt');const decided=(state.announceDecisions||[]).some(d=>d.id===state.you);if(!decided){button(t('announce'),()=>socket.emit('samAnnounce'));button(t('decline'),()=>socket.emit('samDecline'),true);}else $('results').textContent=t('announceWait');}else if(state.phase==='playing'){$('table').innerHTML=state.table?`<b>${escapeHtml(state.players.find(p=>p.id===state.table.by)?.name||'')} ${t('played')}</b>${cards(state.table.cards)}`:`<b>${t('newTrick')}</b>`;
 $('myhand').innerHTML=state.hand.map((c,i)=>`<button class="card ${'♥♦'.includes(c.s)?'red':''} ${selected.has(i)?'pick':''}" data-index="${i}">${c.n===1?'A':c.n===11?'J':c.n===12?'Q':c.n===13?'K':c.n}${c.s}</button>`).join('');$('myhand').querySelectorAll('button').forEach(el=>el.onclick=()=>{const i=Number(el.dataset.index);selected.has(i)?selected.delete(i):selected.add(i);el.classList.toggle('pick');});
 if(state.turn===state.you){button(t('play'),()=>{socket.emit('samPlay',[...selected].sort((a,b)=>a-b));selected.clear();});if(state.table)button(t('pass'),()=>socket.emit('samPass'),true);}else $('results').textContent=t('otherTurn');
 if(state.announced)$('results').textContent=`${escapeHtml(state.players.find(p=>p.id===state.announced)?.name||'')} ${t('announceActive')}`;
 }else if(state.result?.game==='sam'){$('table').innerHTML=`<h3 class="win">🏆 ${escapeHtml(state.players.find(p=>p.id===state.result.winner)?.name||'')} ${t('winner')}</h3>`;$('results').innerHTML=state.result.transfers.map(t=>`<div class="result-row">${escapeHtml(t.from)} → ${escapeHtml(t.to)}: ${money(t.amount)} ${tr[language].virtualSuffix}</div>`).join('')||t('noDeduction');}}
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function enter(code){history.replaceState(null,'',`?room=${encodeURIComponent(code)}`);selected.clear();}
function name(){const n=$('name').value.trim();if(n)localStorage.setItem('cardroom-name',n);return n;}
function callback(res){if(res?.error)return toast(translateServer(res.error));if(res?.code)enter(res.code);}
$('create').onclick=()=>{if(!name())return toast(t('enterName'));if(!socket)return toast(t('noServer'));socket.emit('create',{name:name(),capacity:Number($('capacity').value),game},callback);};
$('join').onclick=()=>{if(!name())return toast(t('enterName'));const code=$('joinCode').value.trim().toUpperCase();if(!code)return toast(t('enterCode'));if(!socket)return toast(t('noServer'));socket.emit('join',{name:name(),code},callback);};
$('leave').onclick=()=>{socket.emit('leave');state=null;selected.clear();history.replaceState(null,'',location.pathname);showRoom(false);};
$('copy').onclick=async()=>{const url=location.origin+location.pathname+'?room='+state.code;try{await navigator.clipboard.writeText(url);toast(t('copied'));}catch{prompt(t('copyPrompt'),url);}};
$('lang').onclick=()=>{language=language==='vi'?'zh':'vi';applyLanguage();};
document.querySelectorAll('.game').forEach(el=>el.onclick=()=>{game=el.dataset.game;document.querySelectorAll('.game').forEach(e=>e.classList.toggle('selected',e===el));});
socket?.on('state',s=>{if(!state||state.round!==s.round||state.phase!==s.phase||state.turn!==s.turn)selected.clear();state=s;render();});socket?.on('errorMessage',msg=>toast(translateServer(msg)));socket?.on('disconnect',()=>toast(t('lost')));
$('name').value=localStorage.getItem('cardroom-name')||'';const invite=new URLSearchParams(location.search).get('room');if(invite){$('joinCode').value=invite.toUpperCase();toast(t('invite'));}

applyLanguage();
