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

// Smooth scroll for anchor links
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

// Real Build Photos carousel
const carousel = document.getElementById('buildCarousel');
const carouselTrack = document.getElementById('carouselTrack');
const carouselDots = document.getElementById('carouselDots');

if (carousel && carouselTrack && carouselDots) {
  const slides = Array.from(carouselTrack.children);
  const prevBtn = carousel.querySelector('.carousel-prev');
  const nextBtn = carousel.querySelector('.carousel-next');
  let current = 0;

  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-dot';
    dot.setAttribute('aria-label', `Go to photo ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    carouselDots.appendChild(dot);
  });
  const dots = Array.from(carouselDots.children);

  function goTo(index) {
    current = (index + slides.length) % slides.length;
    carouselTrack.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((dot, i) => dot.classList.toggle('active', i === current));
  }

  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));

  goTo(0);
}

// Contact form submit -> Supabase
const contactForm = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');
const formError = document.getElementById('formError');

if (contactForm) {
  const supabaseClient = (typeof supabase !== 'undefined' && typeof SUPABASE_URL !== 'undefined')
    ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.hidden = true;
    formSuccess.hidden = true;

    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();

    if (!supabaseClient) {
      formError.textContent = 'Sorry, the contact form is not set up yet. Please email Thom directly.';
      formError.hidden = false;
      return;
    }

    submitBtn.disabled = true;
    const { error } = await supabaseClient
      .from('contact_submissions')
      .insert([{ name, email, message }]);
    submitBtn.disabled = false;

    if (error) {
      console.error('Contact form submission failed:', error);
      formError.textContent = "Something went wrong sending your message. Please try again or email Thom directly.";
      formError.hidden = false;
      return;
    }

    formSuccess.hidden = false;
    contactForm.reset();
    formSuccess.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
}
