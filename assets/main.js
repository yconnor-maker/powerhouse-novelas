// Powerhouse Novelas - Main JS

document.addEventListener('DOMContentLoaded', () => {

  // --- Mobile Navigation ---
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('nav__links--open');
    });
  }

  // --- Scroll Effects (Nav Background & Progress) ---
  const nav = document.getElementById('nav');
  const progressBar = document.getElementById('progressBar');
  
  if (nav || progressBar) {
    window.addEventListener('scroll', () => {
      const h = document.documentElement;
      const scrollTop = h.scrollTop || document.body.scrollTop;
      
      // Nav blur
      if (nav) {
        if (scrollTop > 50) {
          nav.classList.add('nav--scrolled');
        } else {
          // Keep it scrolled if we're not on home
          if (window.location.pathname.includes('index') || window.location.pathname === '/' || window.location.pathname === '') {
            nav.classList.remove('nav--scrolled');
          }
        }
      }

      // Progress bar
      if (progressBar) {
        const scrollHeight = h.scrollHeight - h.clientHeight;
        const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
        progressBar.style.width = progress + '%';
      }
    });
  }

  // --- Reveal Animations ---
  const reveals = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal--visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -100px 0px' });

  reveals.forEach(el => revealObserver.observe(el));

  // --- Manifesto Dynamic Loading ---
  const essaysContainer = document.getElementById('essaysContainer');
  const tocContainer = document.getElementById('tocContainer');

  if (essaysContainer && tocContainer) {
    loadManifesto();
  }

  async function loadManifesto() {
    try {
      const response = await fetch('manifesto_data.json');
      if (!response.ok) throw new Error('Failed to load manifesto data');
      
      const data = await response.json();
      
      // Filter out '99' or undefined numbers, keep only 1-13
      const essaysNum = data.filter(e => {
        const n = parseInt(e.num);
        return !isNaN(n) && n >= 1 && n <= 13;
      });
      
      // Sort by num
      essaysNum.sort((a,b) => parseInt(a.num) - parseInt(b.num));
      
      let essaysHTML = '';
      let tocHTML = '';
      
      essaysNum.forEach(essay => {
        const num = parseInt(essay.num);
        const title = essay.title.replace(`Essay ${num}:`, '').replace('Title:', '').trim();
        const shortTitle = title.length > 40 ? title.substring(0, 37) + '...' : title;
        
        const paddedNum = num.toString().padStart(2, '0');
        
        // Process paragraphs
        const paragraphs = essay.content.split('\n')
          .map(p => p.trim())
          .filter(p => p.length > 0)
          .map(p => `<p>${p}</p>`)
          .join('\n            ');
          
        essaysHTML += `
          <article class="essay" id="essay-${num}">
            <div class="essay__number">${paddedNum}</div>
            <h2 class="essay__title">${title}</h2>
            <div class="essay__body">
              ${paragraphs}
            </div>
          </article>
        `;
        
        tocHTML += `
          <a href="#essay-${num}" class="toc__link" data-essay="${num}">${paddedNum}. ${shortTitle}</a>
        `;
      });
      
      essaysContainer.innerHTML = essaysHTML;
      tocContainer.innerHTML = tocHTML;
      
      // Re-initialize intersection observer for TOC
      initTocObserver();
      
    } catch (e) {
      console.error(e);
      essaysContainer.innerHTML = `
        <div class="essay">
          <p style="color:var(--text-muted)">The manifesto is currently unavailable. Please check back later.</p>
        </div>
      `;
      tocContainer.innerHTML = '';
    }
  }

  function initTocObserver() {
    const essayElements = document.querySelectorAll('.essay');
    const tocLinks = document.querySelectorAll('.toc__link');
    
    if (essayElements.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          tocLinks.forEach(link => {
            link.classList.toggle('toc__link--active', link.getAttribute('href') === '#' + id);
          });
        }
      });
    }, { rootMargin: '-20% 0px -60% 0px' });

    essayElements.forEach(essay => observer.observe(essay));
  }
});
