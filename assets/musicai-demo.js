/* MusicAI in the browser: exact cosine k-NN over an exported 3,000-track sample. */
(function(){
  var el=document.getElementById('mus-demo');if(!el)return;
  var input=el.querySelector('#mus-q'),sug=el.querySelector('.demo-sug'),res=el.querySelector('.demo-res'),forEl=el.querySelector('.demo-for');
  var segBtns=[].slice.call(el.querySelectorAll('.seg button')),mode='all',F=10,data,vec,norm,cur=-1;
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  fetch('../assets/img/musicai-sample.json').then(function(r){return r.json();}).then(function(j){
    data=j;var N=j.tracks.length;vec=new Float32Array(N*F);
    for(var i=0;i<N;i++){var r=j.tracks[i],s=0;for(var f=0;f<F;f++){vec[i*F+f]=r[3+f];s+=r[3+f]*r[3+f];}s=Math.sqrt(s)||1;for(f=0;f<F;f++)vec[i*F+f]/=s;}
    pick(1);
  }).catch(function(){forEl.textContent='The sample could not load.';});
  function pick(i){
    cur=i;var t=data.tracks[i];input.value=t[0];sug.hidden=true;
    forEl.innerHTML='Because you picked <b>'+esc(t[0])+'</b> by '+esc(t[1])+' · mood: '+esc(data.moods[t[2]]||'');
    var N=data.tracks.length,sc=[];
    for(var k=0;k<N;k++){if(k===i)continue;if(mode==='mood'&&data.tracks[k][2]!==t[2])continue;
      var s=0;for(var f=0;f<F;f++)s+=vec[i*F+f]*vec[k*F+f];sc.push([s,k]);}
    sc.sort(function(a,b){return b[0]-a[0];});
    res.innerHTML=sc.slice(0,8).map(function(p,n){var r=data.tracks[p[1]];
      return '<li style="--d:'+(n*40)+'ms"><span class="n">'+(n+1)+'</span><span class="tt"><b>'+esc(r[0])+'</b><span>'+esc(r[1])+'</span></span><span class="sim"><i style="--w:'+Math.max(0,p[0]*100).toFixed(1)+'%"></i>'+p[0].toFixed(3)+'</span></li>';}).join('');
  }
  input.addEventListener('input',function(){
    var q=input.value.trim().toLowerCase();if(!q||!data){sug.hidden=true;return;}
    var out=[];for(var i=0;i<data.tracks.length&&out.length<6;i++){var t=data.tracks[i];if((t[0]+' '+t[1]).toLowerCase().indexOf(q)>-1)out.push(i);}
    sug.innerHTML=out.map(function(i){var t=data.tracks[i];return '<li><button type="button" data-i="'+i+'"><b>'+esc(t[0])+'</b> <span>'+esc(t[1])+'</span></button></li>';}).join('')||'<li class="none">No match in the sample</li>';
    sug.hidden=false;
  });
  sug.addEventListener('click',function(e){var b=e.target.closest('button');if(b)pick(+b.dataset.i);});
  input.addEventListener('keydown',function(e){if(e.key==='Enter'){var b=sug.querySelector('button');if(b){e.preventDefault();pick(+b.dataset.i);}}else if(e.key==='Escape')sug.hidden=true;});
  segBtns.forEach(function(b,i){b.addEventListener('click',function(){segBtns.forEach(function(x){x.setAttribute('aria-pressed',x===b);});b.parentNode.style.setProperty('--k',i);mode=b.dataset.mode;if(cur>-1)pick(cur);});});
})();
