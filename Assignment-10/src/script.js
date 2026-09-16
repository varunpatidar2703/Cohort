gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const nav = document.querySelector('.nav');
const menuToggle = document.querySelector('.menu-toggle');

menuToggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('mobile-open');
  menuToggle.setAttribute('aria-expanded', String(open));
});

document.querySelectorAll('.nav-links a').forEach(link => link.addEventListener('click', () => nav.classList.remove('mobile-open')));

if (!reduceMotion) {
  const intro = gsap.timeline({defaults:{ease:'power3.out'}});
  intro.from('.nav', {y:-30, opacity:0, duration:.8})
    .from('.hero-title .line>span', {yPercent:110, duration:1.15, stagger:.12}, '-=.35')
    .from('.hero-reveal', {y:25, opacity:0, duration:.75, stagger:.08}, '-=.7')
    .from('.hero-meta', {opacity:0, duration:.6}, '-=.35')
    .from('.scroll-note', {opacity:0, duration:.6}, '-=.4');

  gsap.to('.orb-a', {x:-90, y:90, duration:7, repeat:-1, yoyo:true, ease:'sine.inOut'});
  gsap.to('.orb-b', {x:70, y:-70, duration:8, repeat:-1, yoyo:true, ease:'sine.inOut'});
  gsap.to('.hero-grid', {yPercent:12, ease:'none', scrollTrigger:{trigger:'.hero', start:'top top', end:'bottom top', scrub:1}});
  gsap.to('.scroll-progress', {width:'100%', ease:'none', scrollTrigger:{start:'top top', end:'bottom bottom', scrub:.15}});

  document.querySelectorAll('.reveal').forEach((el) => {
    gsap.to(el, {opacity:1, y:0, duration:.9, ease:'power3.out', scrollTrigger:{trigger:el, start:'top 86%', once:true}});
  });

  document.querySelectorAll('.skill-card').forEach((card, i) => {
    const bar = card.querySelector('.skill-bar span');
    gsap.to(bar, {width:getComputedStyle(bar).getPropertyValue('--level').trim(), duration:1.1, ease:'power2.out', scrollTrigger:{trigger:card,start:'top 82%',once:true,delay:i*.05}});
  });

  gsap.to('.marquee-track', {xPercent:-25, ease:'none', scrollTrigger:{trigger:'.marquee',start:'top bottom',end:'bottom top',scrub:1}});
  gsap.to('.visual-one .project-ui', {y:45, ease:'none', scrollTrigger:{trigger:'.visual-one',start:'top bottom',end:'bottom top',scrub:1}});
  gsap.to('.orbit-shape', {rotation:160, ease:'none', scrollTrigger:{trigger:'.visual-two',start:'top bottom',end:'bottom top',scrub:1}});
  gsap.to('.frame-stack', {x:25, ease:'none', scrollTrigger:{trigger:'.visual-three',start:'top bottom',end:'bottom top',scrub:1}});

  document.querySelectorAll('.magnetic').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      gsap.to(el, {x:(e.clientX-r.left-r.width/2)*.18, y:(e.clientY-r.top-r.height/2)*.18, duration:.35, ease:'power2.out'});
    });
    el.addEventListener('mouseleave', () => gsap.to(el, {x:0,y:0,duration:.6,ease:'elastic.out(1,.4)'}));
  });

  const cursor = document.querySelector('.cursor');
  const ring = document.querySelector('.cursor-ring');
  window.addEventListener('mousemove', e => {
    gsap.to(cursor,{x:e.clientX,y:e.clientY,duration:.08});
    gsap.to(ring,{x:e.clientX,y:e.clientY,duration:.35,ease:'power3.out'});
  });
  document.querySelectorAll('a,button').forEach(el => {
    el.addEventListener('mouseenter', () => gsap.to(ring,{scale:1.7,duration:.25}));
    el.addEventListener('mouseleave', () => gsap.to(ring,{scale:1,duration:.25}));
  });
}
