/* ── DARK MODE ── */
const root = document.documentElement;
const savedTheme = localStorage.getItem('theme') || 'light';
root.setAttribute('data-theme', savedTheme);

function updateToggleBtn() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  const isDark = root.getAttribute('data-theme') === 'dark';
  btn.querySelector('.toggle-icon').textContent = isDark ? '☀' : '☾';
  btn.querySelector('.toggle-label').textContent = isDark ? 'Light' : 'Dark';
}

updateToggleBtn();

const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateToggleBtn();
  });
}

/* ── GLOBAL STARFIELD ── */
const Starfield = (function () {
  const cv = document.getElementById('starfield');
  if (!cv) return null;
  const ctx = cv.getContext('2d');

  const STAR_COUNT = 600;
  const FOCAL      = 320;
  const BASE_SPEED = 0.5;
  const WARP_SPEED = 28;   // speed during page transition warp
  const TRAIL      = 0.82;

  let W, H, cx, cy;
  let speed       = BASE_SPEED;
  let targetSpeed = BASE_SPEED;
  let lastScrollY = window.scrollY;
  let scrollVel   = 0;
  let warpMode    = false; // true during curtain transition

  const stars = [];

  function resize() {
    W = cv.width  = window.innerWidth;
    H = cv.height = window.innerHeight;
    cx = W / 2;
    cy = H / 2;
  }

  function makeStar(spread) {
    const s = spread || 1;
    return {
      x:  (Math.random() - 0.5) * W * 3 * s,
      y:  (Math.random() - 0.5) * H * 3 * s,
      z:  Math.random() * W,
      pz: 0,
    };
  }

  function initStars() {
    stars.length = 0;
    for (let i = 0; i < STAR_COUNT; i++) stars.push(makeStar());
  }

  window.addEventListener('scroll', () => {
    if (warpMode) return;
    const dy = Math.abs(window.scrollY - lastScrollY);
    scrollVel   = Math.min(dy * 1.4, 18);
    lastScrollY = window.scrollY;
  });

  function draw() {
    requestAnimationFrame(draw);

    // Speed logic
    if (warpMode) {
      speed += (WARP_SPEED - speed) * 0.12;
    } else {
      scrollVel   *= 0.9;
      targetSpeed  = BASE_SPEED + scrollVel;
      speed       += (targetSpeed - speed) * 0.1;
    }

    // Background — respect theme
    const isDark = root.getAttribute('data-theme') === 'dark';
    ctx.fillStyle = isDark
      ? `rgba(13,8,32,${TRAIL})`
      : `rgba(240,236,255,${TRAIL})`;
    ctx.fillRect(0, 0, W, H);

    const rgb = isDark ? '200,185,255' : '109,40,217';

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.pz = s.z;
      s.z -= speed;

      if (s.z <= 0) {
        Object.assign(s, makeStar());
        s.pz = s.z;
        continue;
      }

      const sx = (s.x / s.z)  * FOCAL + cx;
      const sy = (s.y / s.z)  * FOCAL + cy;
      const px = (s.x / s.pz) * FOCAL + cx;
      const py = (s.y / s.pz) * FOCAL + cy;

      const size  = Math.max(0.3, (1 - s.z / W) * 2.8);
      const alpha = Math.min(1,   (1 - s.z / W) * 1.5);

      ctx.beginPath();
      ctx.strokeStyle = `rgba(${rgb},${alpha})`;
      ctx.lineWidth   = size;
      ctx.moveTo(px, py);
      ctx.lineTo(sx, sy);
      ctx.stroke();
    }
  }

  resize();
  initStars();
  window.addEventListener('resize', () => { resize(); initStars(); });
  draw();

  return {
    setWarp(on) { warpMode = on; },
    getSpeed()  { return speed; },
  };
})();

/* ── PAGE TRANSITION (warp + fade) ── */
(function () {
  const curtainEl = document.getElementById('curtain');
  if (!curtainEl || !Starfield) return;

  // On load: start blacked out, fade in while stars warp, then ease to normal
  window.addEventListener('load', () => {
    Starfield.setWarp(true);
    curtainEl.style.opacity = '1';
    curtainEl.style.transition = 'none';

    // Short warp burst then fade curtain out
    setTimeout(() => {
      curtainEl.style.transition = 'opacity 0.7s ease';
      curtainEl.style.opacity    = '0';
      curtainEl.style.pointerEvents = 'none';
      // After fade, ease warp back to normal
      setTimeout(() => Starfield.setWarp(false), 400);
    }, 120);
  });

  // On link click: warp up, fade to black, navigate
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return;

    link.addEventListener('click', e => {
      e.preventDefault();
      Starfield.setWarp(true);

      // Let warp ramp for a beat, then fade to black
      setTimeout(() => {
        curtainEl.style.transition   = 'opacity 0.3s ease';
        curtainEl.style.opacity      = '1';
        curtainEl.style.pointerEvents = 'all';
        // Navigate once fully black
        setTimeout(() => { window.location.href = href; }, 320);
      }, 180);
    });
  });
})();

/* ── ACTIVE NAV ── */
const currentPage = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('nav ul a').forEach(link => {
  if (link.getAttribute('href') === currentPage) link.classList.add('active');
});

/* ── MOBILE NAV ── */
const hamburger = document.querySelector('.hamburger');
const navMenu   = document.querySelector('nav ul');
if (hamburger) {
  hamburger.addEventListener('click', () => navMenu.classList.toggle('open'));
}

/* ── CANVAS WAVE DIVIDERS ── */
function initWaveDivider(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, points = [], targets = [], t = 0;
  const NUM = 7;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    points  = Array.from({ length: NUM }, (_, i) => ({ x: (i / (NUM - 1)) * W, y: H / 2 }));
    targets = points.map(p => ({ ...p, y: H * 0.2 + Math.random() * H * 0.6 }));
  }

  function newTargets() {
    targets = points.map(p => ({ x: p.x, y: H * 0.15 + Math.random() * H * 0.7 }));
  }

  function lerp(a, b, t) { return a + (b - a) * t; }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    t += 0.008;
    if (t >= 1) { t = 0; points = targets.map(p => ({ ...p })); newTargets(); }

    points.forEach((p, i) => { p.y = lerp(p.y, targets[i].y, 0.01); });

    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const mx = (points[i].x + points[i + 1].x) / 2;
      const my = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, mx, my);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg2').trim() || '#f7f7f5';
    ctx.fill();

    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize);
  draw();
}

document.querySelectorAll('.canvas-divider').forEach(initWaveDivider);

/* ── FADE IN ON SCROLL ── */
const fadeEls = document.querySelectorAll('.fade-in');
if (fadeEls.length) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  fadeEls.forEach(el => io.observe(el));
}

/* ── SKILL CARDS FILTER + BAR ANIMATION ── */
(function () {
  const filters = document.querySelectorAll('.skill-filter');
  const cards   = document.querySelectorAll('.skill-card');
  if (!filters.length) return;

  // Animate bars when card is visible
  const barObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelector('.skill-card-fill')
          ?.style.setProperty('width', e.target.querySelector('.skill-card-fill').dataset.width);
        barObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });

  cards.forEach(c => barObserver.observe(c));

  filters.forEach(btn => {
    btn.addEventListener('click', () => {
      filters.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      const filter = btn.dataset.filter;
      cards.forEach(card => {
        const match = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('hidden', !match);
        // Re-trigger bar animation for newly shown cards
        if (match) {
          const fill = card.querySelector('.skill-card-fill');
          if (fill && fill.style.width === '0px' || fill?.style.width === '') {
            setTimeout(() => fill && (fill.style.width = fill.dataset.width), 50);
          }
        }
      });
    });
  });
})();

/* ── SKILL BARS ── */
const skillBarsContainer = document.querySelector('.skill-bars');
if (skillBarsContainer) {
  const io2 = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      document.querySelectorAll('.skill-bar-fill').forEach(bar => {
        bar.style.width = bar.dataset.width;
      });
      io2.disconnect();
    }
  }, { threshold: 0.3 });
  io2.observe(skillBarsContainer);
}

/* ── CONTACT FORM ── */
const form = document.querySelector('.contact-form');
if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    showToast("Message sent! I'll get back to you soon.");
    form.reset();
  });
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

/* ── CONTACT DIALOG FUNCTIONS ── */
function openContactDialog() {
  const dialog = document.getElementById('contactDialog');
  const overlay = document.getElementById('contactOverlay');
  
  if (dialog && overlay) {
    overlay.classList.add('show');
    dialog.classList.add('show');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }
}

function closeContactDialog() {
  const dialog = document.getElementById('contactDialog');
  const overlay = document.getElementById('contactOverlay');
  
  if (dialog && overlay) {
    overlay.classList.remove('show');
    dialog.classList.remove('show');
    document.body.style.overflow = ''; // Restore scrolling
  }
}

// Close dialog when clicking on overlay
document.addEventListener('click', function(e) {
  const overlay = document.getElementById('contactOverlay');
  const dialog = document.getElementById('contactDialog');
  
  if (overlay && overlay.classList.contains('show') && 
      e.target === overlay) {
    closeContactDialog();
  }
});

// Close dialog on Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeContactDialog();
  }
});

/* ── AI CHATBOT WIDGET ── */
(function () {
  const aiChatFloat = document.getElementById('aiChatFloat');
  const aiChatDialog = document.getElementById('aiChatDialog');
  const aiChatClose = document.getElementById('aiChatClose');
  const aiChatInput = document.getElementById('aiChatInput');
  const aiChatSend = document.getElementById('aiChatSend');
  const aiChatBody = document.getElementById('aiChatBody');
  
  if (!aiChatFloat || !aiChatDialog) return;

  // AI Knowledge base about Aayush
  const aiKnowledge = {
    name: "Aayush",
    role: "Full-Stack Developer",
    location: "Jalandhar, India",
    skills: ["React", "Node.js", "MongoDB", "JavaScript", "TypeScript", "HTML", "CSS", "Express", "Firebase", "Python", "C++", "Java"],
    projects: [
      {
        name: "Fone Factory",
        tech: "MERN Stack",
        description: "Mobile store with filters, Google authentication, and payment gateway integration"
      },
      {
        name: "FarmFresh", 
        tech: "HTML, CSS, JavaScript, PHP",
        description: "Local farmers marketplace"
      },
      {
        name: "AI Chatbot (Poem Refiner)",
        tech: "AI, Gemini 2.0 Flash",
        description: "Chatbot to refine poems with tone, rhyme, and style suggestions"
      },
      {
        name: "Bulletin Board",
        tech: "MERN Stack", 
        description: "Community board app with real-time posts and user authentication"
      },
      {
        name: "To-do List Application",
        tech: "React, TypeScript, Firebase",
        description: "Productivity app with drag-and-drop task management"
      },
      {
        name: "AI Mental Health Assistant",
        tech: "JavaScript, REST API, CSS",
        description: "Empathetic AI chatbot for mental wellness support"
      }
    ],
    certifications: [
      "Full-Stack Web Development (Coursera)",
      "Google AI Essentials (Google)",
      "The Complete JavaScript Course (Udemy)",
      "Data Structures & Algorithms (NPTEL)",
      "Meta Front-End Developer (Meta)",
      "Problem Solving (HackerRank)"
    ],
    about: "I'm a passionate full-stack developer with a love for building elegant solutions to complex problems. I enjoy working across the entire stack — from crafting pixel-perfect UIs to designing robust backend systems. When I'm not coding, you'll find me exploring new technologies, contributing to open source, or enjoying a good cup of coffee. I'm currently open to new opportunities and collaborations."
  };

  // Generate AI response based on user input
  function generateAIResponse(userMessage) {
    const message = userMessage.toLowerCase();
    
    // Greetings
    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      return "Hello! 👋 It's great to connect with you. I'm here to tell you all about Aayush's skills, projects, and experience. What would you like to know?";
    }
    
    // Skills related questions
    if (message.includes('skills') || message.includes('technologies') || message.includes('tech stack')) {
      return `Aayush is proficient in: ${aiKnowledge.skills.slice(0, 5).join(', ')}, ${aiKnowledge.skills.slice(5).join(', ')}. He works across the full stack, from frontend React applications to backend Node.js services and databases.`;
    }
    
    // Projects related questions
    if (message.includes('projects') || message.includes('project') || message.includes('built') || message.includes('created')) {
      const projectList = aiKnowledge.projects.map(p => `• **${p.name}**: ${p.description} (${p.tech})`).join('\n');
      return `Aayush has worked on several impressive projects:\n${projectList}\n\nWhich project would you like to know more about?`;
    }
    
    // Experience/About questions
    if (message.includes('experience') || message.includes('about') || message.includes('who') || message.includes('background')) {
      return aiKnowledge.about;
    }
    
    // Location questions
    if (message.includes('where') || message.includes('location') || message.includes('based') || message.includes('city')) {
      return `Aayush is based in ${aiKnowledge.location}. He's available for remote opportunities and collaborations worldwide!`;
    }
    
    // Role questions
    if (message.includes('role') || message.includes('job') || message.includes('position') || message.includes('what do you do')) {
      return `Aayush is a ${aiKnowledge.role}. He builds scalable, data-driven applications and web platforms, working across the entire technology stack.`;
    }
    
    // Certifications questions
    if (message.includes('certification') || message.includes('certified') || message.includes('courses') || message.includes('learning')) {
      const certList = aiKnowledge.certifications.map(c => `• ${c}`).join('\n');
      return `Aayush has completed several valuable certifications:\n${certList}\n\nHe's committed to continuous learning and staying updated with the latest technologies.`;
    }
    
    // Contact/Availability questions
    if (message.includes('contact') || message.includes('hire') || message.includes('available') || message.includes('opportunity')) {
      return `Aayush is currently open to new opportunities and collaborations! You can reach out through the contact page on this portfolio. He's particularly interested in full-stack development roles where he can work on challenging projects.`;
    }
    
    // Default response
    return `I can tell you about Aayush's skills (${aiKnowledge.skills.length}+ technologies), projects (${aiKnowledge.projects.length} completed), certifications, and experience. Feel free to ask about his technical skills, specific projects, or how to get in touch!`;
  }

  // Open/close dialog
  aiChatFloat.addEventListener('click', () => {
    aiChatDialog.classList.toggle('show');
    if (aiChatDialog.classList.contains('show')) {
      aiChatInput.focus();
    }
  });

  aiChatClose.addEventListener('click', () => {
    aiChatDialog.classList.remove('show');
  });

  // Close dialog when clicking outside
  document.addEventListener('click', (e) => {
    if (aiChatDialog.classList.contains('show') && 
        !aiChatDialog.contains(e.target) && 
        !aiChatFloat.contains(e.target)) {
      aiChatDialog.classList.remove('show');
    }
  });

  // Send message
  function sendAIMessage() {
    const message = aiChatInput.value.trim();
    if (!message) {
      showToast('Please type a message first');
      return;
    }

    // Add user message
    const userMsgDiv = document.createElement('div');
    userMsgDiv.className = 'ai-message user';
    userMsgDiv.textContent = message;
    aiChatBody.appendChild(userMsgDiv);

    // Clear input
    aiChatInput.value = '';
    
    // Show typing indicator
    const typingDiv = document.createElement('div');
    typingDiv.className = 'ai-typing';
    typingDiv.innerHTML = '<div class="ai-typing-dot"></div><div class="ai-typing-dot"></div><div class="ai-typing-dot"></div>';
    aiChatBody.appendChild(typingDiv);
    
    // Scroll to bottom
    aiChatBody.scrollTop = aiChatBody.scrollHeight;

    // Generate and show AI response after delay
    setTimeout(() => {
      typingDiv.remove();
      
      const aiResponse = generateAIResponse(message);
      const aiMsgDiv = document.createElement('div');
      aiMsgDiv.className = 'ai-message bot';
      aiMsgDiv.textContent = aiResponse;
      aiChatBody.appendChild(aiMsgDiv);
      
      // Scroll to bottom
      aiChatBody.scrollTop = aiChatBody.scrollHeight;
    }, 1500);
  }

  aiChatSend.addEventListener('click', sendAIMessage);

  // Send message on Enter key
  aiChatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendAIMessage();
    }
  });

  // Auto-resize textarea
  aiChatInput.addEventListener('input', () => {
    aiChatInput.style.height = 'auto';
    aiChatInput.style.height = Math.min(aiChatInput.scrollHeight, 80) + 'px';
  });
})();
