const express=require('express');
const http=require('http');
const {Server}=require('socket.io');
const crypto=require('crypto');
const app=express(),server=http.createServer(app),io=new Server(server);
app.use(express.static('public'));
const rooms=new Map();
const randomCode=()=>crypto.randomBytes(4).toString('hex').slice(0,6).toUpperCase();
const draw=()=>{const n=crypto.randomInt(1,14);return {rank:n,label:n===1?'A':n===11?'J':n===12?'Q':n===13?'K':String(n),value:n>=10?0:n};};
const score=a=>a.reduce((s,c)=>s+c.value,0)%10;
function deal(){let p=[draw(),draw()],b=[draw(),draw()];let ps=score(p),bs=score(b);if(ps<8&&bs<8){let third=null;if(ps<=5){third=draw();p.push(third);}if(third===null){if(bs<=5)b.push(draw());}else{let t=third.value;let hit=bs<=2||(bs===3&&t!==8)||(bs===4&&t>=2&&t<=7)||(bs===5&&t>=4&&t<=7)||(bs===6&&(t===6||t===7));if(hit)b.push(draw());}}ps=score(p);bs=score(b);return {player:p,banker:b,playerScore:ps,bankerScore:bs,winner:ps===bs?'tie':ps>bs?'player':'banker'};}
function view(r){return {code:r.code,capacity:r.capacity,host:r.host,phase:r.phase,round:r.round,players:[...r.players.values()].map(p=>({id:p.id,name:p.name,ready:p.ready,choice:r.phase==='result'?p.choice:null,balance:p.balance})),result:r.phase==='result'?r.result:null};}
function emit(r){io.to(r.code).emit('state',view(r));}
function reset(r){clearTimeout(r.timer);r.timer=null;r.phase='lobby';r.result=null;for(const p of r.players.values()){p.ready=false;p.choice=null;}emit(r);}
function leave(socket){const code=socket.data.room;if(!code)return;socket.data.room=null;const r=rooms.get(code);socket.leave(code);if(!r)return;r.players.delete(socket.id);if(!r.players.size){clearTimeout(r.timer);rooms.delete(code);return;}if(r.host===socket.id)r.host=r.players.keys().next().value;if(r.phase==='betting'&&[...r.players.values()].every(p=>p.choice))resolve(r);else if(r.phase!=='lobby'&&r.phase!=='result')reset(r);else emit(r);}
function resolve(r){if(r.phase!=='betting')return;clearTimeout(r.timer);r.timer=null;r.result=deal();r.phase='result';for(const p of r.players.values())if(p.choice===r.result.winner)p.balance+=500;emit(r);}
function join(socket,code,name){const r=rooms.get(code);if(!r)return 'Phòng không tồn tại hoặc đã đóng';if(r.players.size>=r.capacity)return 'Phòng đã đủ người';if(r.phase!=='lobby')return 'Ván đang diễn ra, hãy thử lại sau';leave(socket);socket.join(code);socket.data.room=code;r.players.set(socket.id,{id:socket.id,name:name.slice(0,24),ready:false,choice:null,balance:0});emit(r);return null;}
io.on('connection',socket=>{
 socket.on('create',({name,capacity},cb)=>{if(typeof name!=='string'||!name.trim()||![2,3,4].includes(capacity))return cb({error:'Thông tin không hợp lệ'});let code;do{code=randomCode()}while(rooms.has(code));const r={code,capacity,host:socket.id,phase:'lobby',round:0,players:new Map(),result:null,timer:null};rooms.set(code,r);const error=join(socket,code,name.trim());cb(error?{error}:{code});});
 socket.on('join',({code,name},cb)=>{if(typeof code!=='string'||typeof name!=='string'||!name.trim())return cb({error:'Nhập tên và mã phòng'});const error=join(socket,code.trim().toUpperCase(),name.trim());cb(error?{error}:{code:code.trim().toUpperCase()});});
 socket.on('ready',()=>{const r=rooms.get(socket.data.room);if(!r||r.phase!=='lobby')return;const p=r.players.get(socket.id);if(!p)return;p.ready=!p.ready;emit(r);if(r.players.size===r.capacity&&[...r.players.values()].every(x=>x.ready)){r.phase='betting';r.round++;emit(r);r.timer=setTimeout(()=>resolve(r),30000);}});
 socket.on('bet',choice=>{const r=rooms.get(socket.data.room);if(!r||r.phase!=='betting'||!['banker','player','tie'].includes(choice))return;const p=r.players.get(socket.id);if(!p||p.choice)return;p.choice=choice;emit(r);if([...r.players.values()].every(x=>x.choice))resolve(r);});
 socket.on('next',()=>{const r=rooms.get(socket.data.room);if(!r||r.phase!=='result'||r.host!==socket.id)return;reset(r);});
 socket.on('leave',()=>leave(socket));socket.on('disconnect',()=>leave(socket));
});
server.listen(process.env.PORT||3000,()=>console.log('Baccarat online ready'));
