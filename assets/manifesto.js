document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("manifesto-content");
  const tocList = document.getElementById("manifesto-toc");

  if (!container || !tocList) return;

  fetch("../manifesto_data.json")
    .then(res => res.json())
    .then(data => {
      renderManifesto(data);
      initScrollSpy();
    })
    .catch(err => console.error("Error loading manifesto:", err));

  function renderManifesto(data) {
    data.forEach((essay, idx) => {
      // Create TOC item
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = `#essay-${essay.num}`;
      a.textContent = essay.title.trim() || `Essay ${essay.num}`;
      a.className = "toc-link";
      li.appendChild(a);
      tocList.appendChild(li);

      // Create content block
      const article = document.createElement("article");
      article.id = `essay-${essay.num}`;
      article.className = "essay-block reveal";
      
      const title = document.createElement("h2");
      title.className = "essay-title";
      title.textContent = essay.title.trim();
      
      const content = document.createElement("div");
      content.className = "essay-body";
      // Split by newline and wrap in p tags
      const paragraphs = essay.content.split("\n").filter(p => p.trim());
      paragraphs.forEach(p => {
        const pTag = document.createElement("p");
        pTag.textContent = p;
        content.appendChild(pTag);
      });

      article.appendChild(title);
      article.appendChild(content);
      container.appendChild(article);
    });
  }

  function initScrollSpy() {
    const observer = new IntersectionObserver((entries) => {
      // Quick reveal logic attached to the same observer
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          
          // TOC active state logic
          const id = entry.target.id;
          document.querySelectorAll('.toc-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${id}`) {
              link.classList.add('active');
            }
          });
        }
      });
    }, { rootMargin: '-20% 0px -60% 0px', threshold: 0.1 });

    setTimeout(() => {
      document.querySelectorAll('.essay-block').forEach(el => observer.observe(el));
    }, 100);
  }
});

// Generic reveal initialization for other elements
document.addEventListener("DOMContentLoaded", () => {
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.reveal').forEach(el => {
    if(!el.classList.contains('essay-block')) {
      revealObs.observe(el);
    }
  });
});
