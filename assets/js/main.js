window.addEventListener('load', () => {
  gsap.registerPlugin(ScrollTrigger);

  // Custom cursor
  const cursor = document.querySelector('.cursor');
  const follow = document.querySelector('.cursor-follow');
  let mx = 0, my = 0, fx = 0, fy = 0;
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cursor.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
  });
  function tick() {
    fx += (mx - fx) * 0.15;
    fy += (my - fy) * 0.15;
    follow.style.transform = `translate(${fx}px, ${fy}px) translate(-50%, -50%)`;
    requestAnimationFrame(tick);
  }
  tick();
  document.querySelectorAll('a, button, .marquee-item, .service-card').forEach(el => {
    el.addEventListener('mouseenter', () => follow.classList.add('is-hover'));
    el.addEventListener('mouseleave', () => follow.classList.remove('is-hover'));
  });

  // Hero headline reveal — line by line
  gsap.set('.hero-headline .line > span', { yPercent: 110 });
  gsap.to('.hero-headline .line > span', {
    yPercent: 0, duration: 1.2,
    ease: 'expo.out', stagger: 0.12, delay: 0.2
  });

  // Hero globe fade-in on load
  gsap.fromTo('.hero-globe',
    { opacity: 0 },
    { opacity: 1, duration: 1.6, ease: 'power2.out', delay: 0.3 }
  );

  // Hero side fades
  gsap.fromTo('.hero-multilingual',
    { opacity: 0, y: 16 },
    { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.9 }
  );
  gsap.fromTo('.hero-bottom .reveal',
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.15, delay: 1.0 }
  );

  // Multilingual greeting cycle
  const greetings = [
    { text: 'Welcome.', lang: 'English' },
    { text: 'ជំរាបសួរ។', lang: 'Khmer' },
    { text: '你好。', lang: 'Mandarin' },
    { text: 'Bienvenue.', lang: 'French' },
    { text: 'こんにちは。', lang: 'Japanese' },
    { text: 'Привет.', lang: 'Russian' }
  ];
  const greetEl = document.getElementById('greeting');
  const greetLabel = document.getElementById('greeting-label');
  let gi = 0;
  function cycleGreeting() {
    gi = (gi + 1) % greetings.length;
    gsap.to(greetEl, {
      opacity: 0, y: -8, duration: 0.35, ease: 'power2.in',
      onComplete: () => {
        greetEl.textContent = greetings[gi].text;
        greetLabel.textContent = 'A welcome in ' + greetings[gi].lang;
        gsap.fromTo(greetEl,
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }
        );
      }
    });
  }
  setInterval(cycleGreeting, 2400);

  // Reveals across about + services
  gsap.utils.toArray('.about .reveal, .services .reveal').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, y: 40 },
      {
        opacity: 1, y: 0, duration: 1.1, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 85%' }
      }
    );
  });

  // Word flip animation: "Cambodia is [Exciting > Growing > Open > Hiring]"
  const flipWords = ['Exciting', 'Growing', 'Open', 'Hiring'];
  const flipEl = document.getElementById('word-flip');
  function flipTo(idx) {
    if (idx >= flipWords.length) return;
    gsap.to(flipEl, {
      y: -16, opacity: 0, duration: 0.18, ease: 'power2.in',
      onComplete: () => {
        flipEl.textContent = flipWords[idx];
        if (flipWords[idx] === 'Hiring') flipEl.classList.add('is-final');
        gsap.fromTo(flipEl,
          { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.22, ease: 'power2.out',
            onComplete: () => {
              if (flipWords[idx] !== 'Hiring') {
                gsap.delayedCall(0.1, () => flipTo(idx + 1));
              }
            }
          }
        );
      }
    });
  }
  // Start flip after the hero headline reveal completes
  gsap.delayedCall(2.0, () => flipTo(1));

  // Globe parallax
  gsap.to('.globe', {
    yPercent: -10, ease: 'none',
    scrollTrigger: {
      trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: true
    }
  });

  // Service cards stagger
  gsap.fromTo('.service-card',
    { opacity: 0, y: 60 },
    {
      opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.08,
      scrollTrigger: { trigger: '.services-grid', start: 'top 80%' }
    }
  );

  // Marquee header eyebrow reveal
  gsap.fromTo('.jobs-marquee .marquee-header > div, .jobs-marquee .marquee-link',
    { opacity: 0, y: 30 },
    {
      opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.1,
      scrollTrigger: { trigger: '.jobs-marquee', start: 'top 80%' }
    }
  );
});
