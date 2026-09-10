// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const siteNav = document.getElementById('siteNav');

if (navToggle && siteNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.classList.toggle('open', isOpen);
  });

  // Close menu after clicking a link (mobile)
  siteNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      siteNav.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// Smooth scroll for same-page anchor links
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const targetId = link.getAttribute('href');
    const target = document.querySelector(targetId);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

function initCarousel({ root, track, prevBtn, nextBtn, dotsContainer, visibleItems = () => 1, wrap = false, swipe = false, gap = 0 }) {
  if (!root || !track || !prevBtn || !nextBtn) return;

  const slides = Array.from(track.children);
  if (!slides.length) return;

  let current = 0;
  let visible = 1;
  let pointerStart = null;

  const dots = dotsContainer ? slides.map((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-dot';
    dot.setAttribute('aria-label', `Go to item ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsContainer.appendChild(dot);
    return dot;
  }) : [];

  function goTo(index) {
    const maxIndex = Math.max(0, slides.length - visible);
    current = wrap
      ? (index + slides.length) % slides.length
      : Math.min(Math.max(index, 0), maxIndex);
    const slideWidth = slides[0] ? slides[0].offsetWidth : 0;
    track.style.transform = `translateX(-${current * (slideWidth + gap)}px)`;
    dots.forEach((dot, i) => dot.classList.toggle('active', i === current));
    prevBtn.disabled = !wrap && current === 0;
    nextBtn.disabled = !wrap && current === maxIndex;
  }

  function updateLayout() {
    visible = Math.min(slides.length, visibleItems());
    const basis = gap
      ? `calc((100% - ${(visible - 1) * gap}px) / ${visible})`
      : `${100 / visible}%`;
    slides.forEach((slide) => { slide.style.flexBasis = basis; });
    goTo(current);
  }

  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));

  if (swipe) {
    track.addEventListener('pointerdown', (event) => {
      pointerStart = event.clientX;
      track.setPointerCapture(event.pointerId);
    });
    track.addEventListener('pointerup', (event) => {
      if (pointerStart === null) return;
      const distance = event.clientX - pointerStart;
      pointerStart = null;
      if (Math.abs(distance) > 50) goTo(current + (distance < 0 ? 1 : -1));
    });
    track.addEventListener('pointercancel', () => { pointerStart = null; });
  }

  window.addEventListener('resize', updateLayout);
  updateLayout();
}

function initGalleries() {
  const buildCarousel = document.getElementById('buildCarousel');
  if (buildCarousel) {
    initCarousel({
      root: buildCarousel,
      track: document.getElementById('carouselTrack'),
      prevBtn: buildCarousel.querySelector('.carousel-prev'),
      nextBtn: buildCarousel.querySelector('.carousel-next'),
      dotsContainer: document.getElementById('carouselDots'),
      wrap: true
    });
  }

  const pressCarousel = document.getElementById('pressCarousel');
  if (pressCarousel) {
    initCarousel({
      root: pressCarousel,
      track: document.getElementById('pressTrack'),
      prevBtn: pressCarousel.querySelector('.press-prev'),
      nextBtn: pressCarousel.querySelector('.press-next'),
      visibleItems: () => window.innerWidth <= 700 ? 1 : window.innerWidth <= 1200 ? 2 : 4,
      swipe: true,
      gap: 16
    });
  }
}

initGalleries();

// Contact form submit -> Supabase
const contactForm = document.getElementById('contactForm');
const formStatus = document.getElementById('formStatus');

if (contactForm) {
  const supabaseClient = (typeof supabase !== 'undefined' && typeof SUPABASE_URL !== 'undefined')
    ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

  function showStatus(message, isError) {
    if (!formStatus) return;
    formStatus.textContent = message;
    formStatus.className = `form-status ${isError ? 'error' : 'success'}`;
    formStatus.hidden = !message;
    if (message) {
      formStatus.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function clearStatus() {
    if (!formStatus) return;
    formStatus.textContent = '';
    formStatus.className = 'form-status';
    formStatus.hidden = true;
  }

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearStatus();

    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();

    if (!supabaseClient) {
      showStatus('Sorry, the contact form is not set up yet. Please email Thom directly.', true);
      return;
    }

    contactForm.setAttribute('aria-busy', 'true');
    submitBtn.disabled = true;

    try {
      const { error } = await supabaseClient
        .from('contact_submissions')
        .insert([{ name, email, message }]);

      if (error) {
        console.error('Contact form submission failed:', error);
        showStatus('Something went wrong sending your message. Please try again or email Thom directly.', true);
        return;
      }

      showStatus('Thanks! Thom (and the crew) will be in touch soon.', false);
      contactForm.reset();
    } catch (err) {
      console.error('Contact form network/exception error:', err);
      showStatus('A network error prevented your message from sending. Please check your connection or email Thom directly.', true);
    } finally {
      contactForm.setAttribute('aria-busy', 'false');
      submitBtn.disabled = false;
    }
  });
}
