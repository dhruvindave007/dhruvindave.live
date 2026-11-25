(function(){
  var d=document, root=d.documentElement;
  root.classList.add('js');
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine=window.matchMedia&&matchMedia('(hover:hover) and (pointer:fine)').matches;
  var live=d.getElementById('live');
  function $(s,c){return (c||d).querySelector(s);}
  function $$(s,c){return [].slice.call((c||d).querySelectorAll(s));}

  /* ---- Copy the email address ---- */
  function select(el){try{var r=d.createRange();r.selectNodeContents(el);var s=getSelection();s.removeAllRanges();s.addRange(r);}catch(e){}}
  $$('.copy').forEach(function(btn){
    btn.addEventListener('click',function(){
      var text=btn.getAttribute('data-copy'),addr=d.getElementById(btn.getAttribute('aria-describedby'));
      function done(msg){btn.textContent=msg;btn.setAttribute('data-done','');if(live)live.textContent=msg==='Copied'?'Email address copied':'Email address selected';
        clearTimeout(btn._t);btn._t=setTimeout(function(){btn.textContent='Copy';btn.removeAttribute('data-done');},1800);}
      try{navigator.clipboard.writeText(text).then(function(){done('Copied');},function(){select(addr);done('Selected');});}catch(e){select(addr);done('Selected');}
    });
  });

  /* ---- Figures play when they come into view, and again on card hover ---- */
  function play(el){el.classList.remove('play');void el.offsetWidth;el.classList.add('play');}
  var seen=('IntersectionObserver' in window)?new IntersectionObserver(function(es){
    es.forEach(function(e){if(e.isIntersecting){play(e.target);seen.unobserve(e.target);}});
  },{threshold:.2}):null;
  if(seen&&!reduce)$$('[data-live]').forEach(function(el){seen.observe(el);});
  if(fine&&!reduce)$$('.card[data-live]').forEach(function(c){c.addEventListener('mouseenter',function(){play(c);});});

  /* ---- Office Vision Twin pipeline replay ---- */
  var pipe=d.getElementById('pipe');
  if(pipe){
    var grid=$('.grid',pipe);
    var run=function(){grid.classList.remove('run');void grid.offsetWidth;grid.classList.add('run');};
    var rb=d.getElementById('replay');if(rb)rb.addEventListener('click',run);
    if('IntersectionObserver' in window&&!reduce){var pio=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){run();pio.disconnect();}});},{threshold:.45});pio.observe(pipe);}
  }

  /* ---- AirfieldShield target tabs ---- */
  var chart=d.getElementById('afs-chart');
  if(chart){
    var tabs=$$('[role="tab"]',chart),tp=d.getElementById('afs-panel'),bars=$$('.hb',tp);
    var names={'t-s1':'Thunderstorm in the next hour.','t-s3':'Thunderstorm in the next 3 hours.','t-w1':'Wind of 25 kt or more in the next hour.','t-w3':'Wind of 25 kt or more in the next 3 hours.'};
    var pick=function(t,focus){
      tabs.forEach(function(b){var on=b===t;b.setAttribute('aria-selected',on);b.tabIndex=on?0:-1;});
      t.getAttribute('data-v').split(',').forEach(function(x,i){bars[i].querySelector('i span').style.setProperty('--w',(parseFloat(x)*100)+'%');bars[i].querySelector('.v').textContent=x;});
      t.parentNode.style.setProperty('--k',tabs.indexOf(t));
      tp.setAttribute('aria-labelledby',t.id);
      d.getElementById('afs-target').textContent=names[t.id];
      d.getElementById('afs-note').textContent=t.getAttribute('data-n');
      if(!reduce)play(chart);
      if(focus)t.focus();
    };
    tabs.forEach(function(t,i){
      t.addEventListener('click',function(){pick(t);});
      t.addEventListener('keydown',function(e){var k=e.key,n=null;
        if(k==='ArrowRight')n=tabs[(i+1)%tabs.length];else if(k==='ArrowLeft')n=tabs[(i-1+tabs.length)%tabs.length];
        else if(k==='Home')n=tabs[0];else if(k==='End')n=tabs[tabs.length-1];
        if(n){e.preventDefault();pick(n,true);}});
    });
  }

  /* ---- groundcheck log highlight ---- */
  var logFig=d.getElementById('gc-log');
  if(logFig){
    var modes=$$('[data-mode]',logFig);
    modes.forEach(function(b){b.addEventListener('click',function(){
      modes.forEach(function(x){x.setAttribute('aria-pressed',x===b);});
      b.parentNode.style.setProperty('--k',modes.indexOf(b));
      logFig.setAttribute('data-show',b.getAttribute('data-mode'));
    });});
  }

  /* ---- Table of contents follows the reading position ---- */
  var toc=$$('.toc a');
  if(toc.length&&'IntersectionObserver' in window){
    var tio=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;
      toc.forEach(function(a){a.setAttribute('aria-current',a.getAttribute('href')==='#'+e.target.id?'true':'false');});});},{rootMargin:'-20% 0px -70% 0px'});
    toc.forEach(function(a){var s=d.getElementById(a.getAttribute('href').slice(1));if(s)tio.observe(s);});
  }

  if(reduce)return;

  /* ---- Hero headline: words rise from a mask ---- */
  $$('.hero h1, .p-title h1').forEach(function(h){
    var i=0;
    (function walk(node){
      [].slice.call(node.childNodes).forEach(function(n){
        if(n.nodeType===3){
          var frag=d.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function(part){
            if(!part)return;
            if(/^\s+$/.test(part)){frag.appendChild(d.createTextNode(part));return;}
            var w=d.createElement('span');w.className='w';var s=d.createElement('span');s.textContent=part;s.style.setProperty('--i',i++);w.appendChild(s);frag.appendChild(w);
          });
          node.replaceChild(frag,n);
        }else if(n.nodeType===1)walk(n);
      });
    })(h);
    h.classList.add('split');
  });

  /* ---- Reveal blocks as they scroll in, staggered within a group ---- */
  var groups=['.under','.proof','.sec > .head','.sec > .body','.cards','.also','.rows','.contact .body','.p-meta','.p-figs','.prose > section','.toc'];
  var items=[];
  groups.forEach(function(sel){$$(sel).forEach(function(g){
    var kids=g.matches('.cards,.also,.rows,.proof,.p-figs')?[].slice.call(g.children):[g];
    kids.forEach(function(k,j){if(k.classList.contains('rv'))return;k.classList.add('rv');k.style.setProperty('--s',Math.min(j,6));items.push(k);});
  });});
  if('IntersectionObserver' in window){
    var rio=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');rio.unobserve(e.target);}});},{rootMargin:'0px 0px -8% 0px',threshold:.05});
    items.forEach(function(el){rio.observe(el);});
  }else items.forEach(function(el){el.classList.add('in');});

  /* ---- Count up the leading number in each proof figure ---- */
  $$('.proof b, .p-figs b').forEach(function(b){
    var t=b.firstChild;if(!t||t.nodeType!==3)return;
    var m=t.textContent.match(/^(\D*)(\d+)(.*)$/);if(!m)return;
    var to=parseInt(m[2],10);if(to<2)return;
    var dur=1100,start=null;t.textContent=m[1]+'0'+m[3];
    var go=function(ts){if(!start)start=ts;var k=Math.min(1,(ts-start)/dur),e=1-Math.pow(1-k,4);t.textContent=m[1]+Math.round(to*e)+m[3];if(k<1)requestAnimationFrame(go);};
    var cio=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){requestAnimationFrame(go);cio.disconnect();}});},{threshold:.6});
    cio.observe(b);
  });

  if(fine){
    /* ---- Spotlight on cards ---- */
    $$('.card').forEach(function(c){c.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px');});});
    /* ---- Magnetic primary buttons ---- */
    $$('.btn').forEach(function(b){
      b.addEventListener('pointermove',function(e){var r=b.getBoundingClientRect();var x=(e.clientX-r.left-r.width/2)*.18,y=(e.clientY-r.top-r.height/2)*.28;b.style.transform='translate('+x+'px,'+y+'px)';});
      b.addEventListener('pointerleave',function(){b.style.transition='transform 500ms cubic-bezier(.23,1,.32,1)';b.style.transform='';setTimeout(function(){b.style.transition='';},500);});
    });
  }

  /* ---- Reading progress on project pages ---- */
  if($('.prose')){
    var bar=d.createElement('div');bar.className='prog';bar.setAttribute('aria-hidden','true');d.body.appendChild(bar);
    var upd=function(){var h=d.documentElement.scrollHeight-innerHeight;bar.style.transform='scaleX('+(h>0?scrollY/h:0)+')';};
    addEventListener('scroll',upd,{passive:true});upd();
  }

  /* ---- Smooth scrolling ---- */
  if(window.Lenis){
    var lenis=new Lenis({duration:1.1,easing:function(t){return Math.min(1,1.001-Math.pow(2,-10*t));}});
    (function raf(t){lenis.raf(t);requestAnimationFrame(raf);})(0);
    $$('a[href^="#"]').forEach(function(a){a.addEventListener('click',function(e){var id=a.getAttribute('href');var el=id.length>1&&d.querySelector(id);if(el){e.preventDefault();lenis.scrollTo(el,{offset:-80});history.replaceState(null,'',id);}});});
  }
})();

/* Headline parallax and section rules for grouped blocks */
(function(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var h=document.querySelector('.hero h1');
  if(h)addEventListener('scroll',function(){var y=Math.min(scrollY,600);h.style.transform='translateY('+(y*.18)+'px)';h.style.opacity=String(1-y/700);},{passive:true});
  var lined=[].slice.call(document.querySelectorAll('.proof,.p-figs'));
  if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('lined');io.unobserve(e.target);}});},{threshold:.2});lined.forEach(function(el){io.observe(el);});}
})();

/* Local time in Ahmedabad, in the footer */
(function(){var el=document.querySelector('[data-ist]');if(!el)return;
  function t(){try{el.textContent=new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Kolkata'}).format(new Date())+' in Ahmedabad';}catch(e){}}
  t();setInterval(t,30000);})();
/* Shots reveal with a clip as they scroll in */
(function(){if(!('IntersectionObserver' in window))return;var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.15});
  document.querySelectorAll('.shot').forEach(function(s){io.observe(s);});})();

/* ---------- Phone tab bar: app-style navigation within thumb reach ---------- */
(function(){
  var d=document,P=location.pathname,inWork=/^\/work\//.test(P),root='/';
  var onHome=(P==='/'||P==='/index.html'),isGal=/^\/gallery/.test(P);
  var I={
    home:'<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    work:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 14h8"/>',
    gal:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="1.6"/><path d="M21 16l-5-5-9 10"/>',
    cv:'<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
    mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>'
  };
  var items=[
    ['Home','/#top','home',onHome],
    ['Work','/#work','work',inWork],
    ['Gallery','/gallery/','gal',isGal],
    ['CV','https://dhruvindave.live/Dhruvin_Dave_AI_Engineer_CV.pdf','cv',false],
    ['Contact','/#contact','mail',false]
  ];
  var nav=d.createElement('nav');nav.className='tabbar';nav.setAttribute('aria-label','Primary');
  nav.innerHTML=items.map(function(t){
    var ext=/^https?:/.test(t[1]);
    return '<a href="'+t[1]+'"'+(ext?' target="_blank" rel="noopener"':'')+(t[3]?' aria-current="page"':'')+'><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+I[t[2]]+'</svg><span>'+t[0]+'</span></a>';
  }).join('');
  d.body.appendChild(nav);
  if(onHome&&'IntersectionObserver' in window){
    var links=nav.querySelectorAll('a'),map={work:1,contact:4,top:0};
    var set=function(i){links.forEach(function(a,k){if(k===i)a.setAttribute('aria-current','page');else if(!a.matches('[target]'))a.removeAttribute('aria-current');});};
    set(0);
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){var id=e.target.id;set(id==='contact'?4:id==='top'?0:1);}});},{rootMargin:'-45% 0px -50% 0px'});
    ['top','work','open-source','achievements','experience','education','contact'].forEach(function(id){var el=d.getElementById(id);if(el)io.observe(el);});
  }
  /* hide while typing so the keyboard never covers a bar */
  d.addEventListener('focusin',function(e){if(/INPUT|TEXTAREA/.test(e.target.tagName))nav.classList.add('away');});
  d.addEventListener('focusout',function(){nav.classList.remove('away');});
})();
