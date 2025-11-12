// JavaScript para Landing Page Impactante - CHIFA ALI

// Animación de contadores
function animateCounters() {
  const counters = document.querySelectorAll('.stat-number');
  
  counters.forEach(counter => {
    const targetStr = counter.getAttribute('data-target');
    const target = parseFloat(targetStr);
    const isDecimal = targetStr.includes('.');
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    
    const updateCounter = () => {
      current += step;
      if (current < target) {
        if (isDecimal) {
          counter.textContent = current.toFixed(1);
        } else {
          counter.textContent = Math.floor(current).toLocaleString();
        }
        requestAnimationFrame(updateCounter);
      } else {
        if (isDecimal) {
          counter.textContent = target.toFixed(1);
        } else {
          counter.textContent = target.toLocaleString();
        }
      }
    };
    
    updateCounter();
  });
}

// Carrusel de fondo del hero (crossfade)
let heroBgInterval;
function initHeroBackgroundCarousel(){
  const slides = Array.from(document.querySelectorAll('.hero-bg'));
  if (!slides.length) return;
  let idx = slides.findIndex(s => s.classList.contains('active'));
  if (idx < 0) { idx = 0; slides[0].classList.add('active'); }
  const next = () => {
    slides[idx].classList.remove('active');
    idx = (idx + 1) % slides.length;
    slides[idx].classList.add('active');
  };
  // Rotación
  heroBgInterval = setInterval(next, 6000);
}

function pauseHeroCarousel(){ if (heroBgInterval) clearInterval(heroBgInterval); }
function resumeHeroCarousel(){ pauseHeroCarousel(); initHeroBackgroundCarousel(); }

// Slider de testimonios
let currentTestimonial = 0;
const testimonials = document.querySelectorAll('.testimonial-card');
const totalTestimonials = testimonials.length;

function showTestimonial(index) {
  testimonials.forEach((card, i) => {
    card.classList.remove('active');
    if (i === index) {
      card.classList.add('active');
    }
  });
}

function changeTestimonial(direction) {
  currentTestimonial += direction;
  
  if (currentTestimonial < 0) {
    currentTestimonial = totalTestimonials - 1;
  } else if (currentTestimonial >= totalTestimonials) {
    currentTestimonial = 0;
  }
  
  showTestimonial(currentTestimonial);
}

// Auto-rotate testimonials
let testimonialInterval;

function startTestimonialRotation() {
  testimonialInterval = setInterval(() => {
    changeTestimonial(1);
  }, 5000);
}

function stopTestimonialRotation() {
  clearInterval(testimonialInterval);
}

// Scroll reveal animations
function revealOnScroll() {
  const reveals = document.querySelectorAll('.feature-card, .dish-showcase-item, .contact-item');
  
  reveals.forEach(element => {
    const elementTop = element.getBoundingClientRect().top;
    const windowHeight = window.innerHeight;
    const revealPoint = 100;
    
    if (elementTop < windowHeight - revealPoint) {
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    }
  });
}

// Inicializar estilos para reveal
function initRevealStyles() {
  const reveals = document.querySelectorAll('.feature-card, .dish-showcase-item, .contact-item');
  reveals.forEach(element => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(30px)';
    element.style.transition = 'all 0.6s ease-out';
  });
}

// Parallax en hero
function parallaxHero() {
  const hero = document.querySelector('.hero-fullscreen');
  if (hero) {
    const scrolled = window.pageYOffset;
    hero.style.transform = `translateY(${scrolled * 0.5}px)`;
  }
}


// Scroll indicator
function updateScrollIndicator() {
  const scrollIndicator = document.querySelector('.scroll-indicator');
  if (scrollIndicator && window.pageYOffset > 100) {
    scrollIndicator.style.opacity = '0';
  } else if (scrollIndicator) {
    scrollIndicator.style.opacity = '1';
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Iniciar animaciones
  setTimeout(animateCounters, 500);
  initHeroBackgroundCarousel();
  
  // Iniciar slider de testimonios
  if (testimonials.length > 0) {
    showTestimonial(0);
    startTestimonialRotation();
    
    // Botones de navegación
    document.querySelectorAll('.testimonial-btn').forEach((btn, index) => {
      btn.addEventListener('click', () => {
        stopTestimonialRotation();
        changeTestimonial(index === 0 ? -1 : 1);
        startTestimonialRotation();
      });
    });
  }
  
  // Configurar reveal animations
  initRevealStyles();
  revealOnScroll();
});

// Scroll events
window.addEventListener('scroll', () => {
  revealOnScroll();
  parallaxHero();
  updateScrollIndicator();
});

// Pausar rotación cuando el usuario interactúa
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopTestimonialRotation();
    pauseHeroCarousel();
  } else {
    startTestimonialRotation();
    resumeHeroCarousel();
  }
});

// Exportar funciones para uso global
window.changeTestimonial = changeTestimonial;
