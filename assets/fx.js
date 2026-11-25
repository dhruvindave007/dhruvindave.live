/* Generative graphics: monochrome canvases that react to the cursor.
   Home: a field of points that turns noisy input into ordered lines (data to decisions).
   Project pages: a floor plan with moving people (Office Vision Twin), a radar sweep over
   six airfields (AirfieldShield), and log lines with the right ones lighting up (groundcheck). */
(function(){
  var d=document;
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DPR=Math.min(2,window.devicePixelRatio||1);
  function ink(a){return 'rgba(237,237,237,'+a+')';}

  function mount(host,cls){
    var c=d.createElement('canvas');c.className='fx '+cls;c.setAttribute('aria-hidden','true');host.appendChild(c);
    var ctx=c.getContext('2d'),W=0,H=0,mx=-9999,my=-9999,vis=true;
    function size(){var r=c.getBoundingClientRect();W=r.width;H=r.height;c.width=Math.round(W*DPR);c.height=Math.round(H*DPR);ctx.setTransform(DPR,0,0,DPR,0,0);}
    size();addEventListener('resize',size);
    host.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect();mx=e.clientX-r.left;my=e.clientY-r.top;});
    host.addEventListener('pointerleave',function(){mx=my=-9999;});
    if('IntersectionObserver' in window)new IntersectionObserver(function(es){vis=es[0].isIntersecting;}).observe(c);
    return {c:c,ctx:ctx,get W(){return W;},get H(){return H;},get mx(){return mx;},get my(){return my;},get vis(){return vis;}};
  }
  function loop(s,draw){
    var t0=performance.now();
    if(reduce){draw(2.2);return;}
    (function f(now){if(s.vis)draw((now-t0)/1000);requestAnimationFrame(f);})(t0);
  }

  /* ---------- Home: signal to decision field ---------- */
  var hero=d.querySelector('.hero');
  if(hero){
    var s=mount(hero,'fx-hero');
    var pts=[];
    loop(s,function(t){
      var ctx=s.ctx,W=s.W,H=s.H;ctx.clearRect(0,0,W,H);
      var step=W<600?18:22,cols=Math.ceil(W/step),rows=Math.ceil(H/step);
      for(var i=0;i<=cols;i++){
        var x=i*step,k=x/W;                     // k: 0 = raw signal (left), 1 = decision (right)
        var order=Math.min(1,Math.max(0,(k-.25)/.6));
        for(var j=0;j<=rows;j++){
          var y0=j*step;
          var noise=Math.sin(i*12.9898+j*78.233)*43758.5453;noise=(noise-Math.floor(noise))-.5;
          var drift=Math.sin(t*.9+i*.35+j*.6)*6*(1-order);
          var y=y0+noise*step*.9*(1-order)+drift;
          var band=Math.round(y/ (step*3))*(step*3);   // points snap into ordered lines on the right
          y=y*(1-order)+band*order;
          var dx=x-s.mx,dy=y-s.my,dist=Math.sqrt(dx*dx+dy*dy);
          var push=dist<140?(140-dist)/140:0;
          var px=x+(dx/(dist||1))*push*14,py=y+(dy/(dist||1))*push*14;
          var wave=.5+.5*Math.sin(t*1.4-k*9+j*.15);
          var a=(.05+.22*order*wave+.45*push)*Math.min(1,k*2.2);
          if(a<.02)continue;
          ctx.fillStyle=ink(a);
          var r=1+order*.6+push*1.4;
          ctx.beginPath();ctx.arc(px,py,r,0,6.2832);ctx.fill();
        }
      }
    });
  }

  /* ---------- Project pages ---------- */
  var ph=d.querySelector('.p-hero');
  var slug=(location.pathname.split('/').pop()||'').replace('.html','');
  if(ph){
    var p=mount(ph,'fx-page');
    if(slug==='office-vision-twin'){
      var rooms=[[.05,.1,.42,.42],[.5,.1,.45,.3],[.5,.46,.45,.44],[.05,.58,.42,.32]];
      var people=[];for(var n=0;n<11;n++)people.push({r:n%4,u:Math.random(),v:Math.random(),su:(Math.random()-.5)*.08,sv:(Math.random()-.5)*.08});
      loop(p,function(t){
        var ctx=p.ctx,W=p.W,H=p.H;ctx.clearRect(0,0,W,H);
        var ox=W*.64,ow=W*.34,oy=H*.12,oh=H*.78;
        ctx.strokeStyle=ink(.16);ctx.lineWidth=1;
        rooms.forEach(function(r){ctx.strokeRect(ox+r[0]*ow,oy+r[1]*oh,r[2]*ow,r[3]*oh);});
        var alert=Math.floor(t/3)%4;
        people.forEach(function(q,idx){
          q.u+=q.su*.016;q.v+=q.sv*.016;
          if(q.u<.08||q.u>.92)q.su*=-1;if(q.v<.1||q.v>.9)q.sv*=-1;
          var r=rooms[q.r],x=ox+(r[0]+r[2]*q.u)*ow,y=oy+(r[1]+r[3]*q.v)*oh;
          var hot=q.r===alert&&idx%4===alert;
          ctx.fillStyle=ink(hot?.95:.5);ctx.beginPath();ctx.arc(x,y,hot?4:2.6,0,6.2832);ctx.fill();
          if(hot){var k=(t%3)/3;ctx.strokeStyle=ink(.6*(1-k));ctx.beginPath();ctx.arc(x,y,6+k*26,0,6.2832);ctx.stroke();}
        });
      });
    }else if(slug==='airfieldshield'){
      var fields=[[.62,.3],[.78,.22],[.86,.5],[.7,.62],[.58,.78],[.9,.8]];
      loop(p,function(t){
        var ctx=p.ctx,W=p.W,H=p.H;ctx.clearRect(0,0,W,H);
        var cx=W*.74,cy=H*.52,R=Math.min(W*.24,H*.48);
        ctx.strokeStyle=ink(.1);
        for(var i=1;i<=4;i++){ctx.beginPath();ctx.arc(cx,cy,R*i/4,0,6.2832);ctx.stroke();}
        ctx.beginPath();ctx.moveTo(cx-R,cy);ctx.lineTo(cx+R,cy);ctx.moveTo(cx,cy-R);ctx.lineTo(cx,cy+R);ctx.stroke();
        var ang=t*.9%6.2832;
        for(var a=0;a<40;a++){var aa=ang-a*.018;ctx.strokeStyle=ink(.22*(1-a/40));ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(aa)*R,cy+Math.sin(aa)*R);ctx.stroke();}
        fields.forEach(function(f){
          var x=cx+(f[0]-.74)*R*3.2,y=cy+(f[1]-.52)*R*2.2;
          var fa=Math.atan2(y-cy,x-cx);if(fa<0)fa+=6.2832;
          var since=(ang-fa+6.2832)%6.2832,glow=Math.max(0,1-since/2.2);
          ctx.fillStyle=ink(.3+.7*glow);ctx.beginPath();ctx.arc(x,y,2.5+glow*3,0,6.2832);ctx.fill();
        });
      });
    }else if(slug==='groundcheck'){
      loop(p,function(t){
        var ctx=p.ctx,W=p.W,H=p.H;ctx.clearRect(0,0,W,H);
        var x0=W*.56,lh=16,n=Math.floor(H/lh),off=(t*14)%lh;
        for(var i=-1;i<n+1;i++){
          var line=Math.floor(t*14/lh)+i,y=i*lh-off+8;
          var len=.25+((Math.sin(line*91.7)*1e4)%1+1)%1*.6;
          var ev=line%7===3||line%11===5;
          ctx.fillStyle=ink(ev?.55:.12);ctx.fillRect(x0,y,(W-x0-40)*len,3);
          if(ev){ctx.fillStyle=ink(.08);ctx.fillRect(x0-10,y-6,(W-x0-30),15);}
        }
      });
    }
  }
})();
