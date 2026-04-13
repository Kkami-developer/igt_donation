const scrollButtons = document.querySelectorAll("[data-scroll-target]");
const tabButtons = document.querySelectorAll(".tab-btn");
const tabPanels = document.querySelectorAll(".tab-panel");
const fadeTargets = document.querySelectorAll(".fade-in");
const counters = document.querySelectorAll(".count-up");
const nav = document.querySelector(".nav");
const photoSlots = document.querySelectorAll("[data-photo-slot]");
const fullPhotos = document.querySelectorAll(".full-photo");
const storyPhotos = document.querySelectorAll(".story-photo img");

scrollButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = document.querySelector(button.dataset.scrollTarget);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const targetTab = button.dataset.tab;

    tabButtons.forEach((btn) => {
      btn.classList.remove("is-active");
      btn.setAttribute("aria-selected", "false");
    });

    tabPanels.forEach((panel) => {
      panel.classList.remove("is-active");
    });

    button.classList.add("is-active");
    button.setAttribute("aria-selected", "true");

    const panel = document.querySelector(`[data-panel="${targetTab}"]`);
    if (panel) {
      panel.classList.add("is-active");
    }
  });
});

const animateCounter = (element) => {
  const target = Number(element.dataset.target || 0);
  const duration = 1400;
  const start = performance.now();
  let hasAnimated = false;

  if (!target || element.dataset.counted === "true") {
    return;
  }

  const step = (timestamp) => {
    const progress = Math.min((timestamp - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(target * eased);
    element.textContent = String(current);

    if (progress < 1) {
      requestAnimationFrame(step);
    } else if (!hasAnimated) {
      element.textContent = String(target);
      element.dataset.counted = "true";
      hasAnimated = true;
    }
  };

  requestAnimationFrame(step);
};

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

fadeTargets.forEach((target) => observer.observe(target));

const countObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        countObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.55 }
);

counters.forEach((counter) => countObserver.observe(counter));

const updateNavOnScroll = () => {
  if (!nav) {
    return;
  }

  nav.classList.toggle("is-scrolled", window.scrollY > 12);
};

window.addEventListener("scroll", updateNavOnScroll, { passive: true });
updateNavOnScroll();

const photoNameCandidates = (slot) => [
  `photo-${slot}`,
  `photo${slot}`,
  `sample-${slot}`,
  `sample${slot}`,
  `img-${slot}`,
  `img${slot}`,
  `${slot}`,
];

const photoExtensions = ["jpg", "jpeg", "png", "webp"];

const loadImage = (img, srcList, index = 0) => {
  if (index >= srcList.length) {
    img.closest(".photo-card, .story-photo")?.classList.add("is-missing");
    img.style.display = "none";
    return;
  }

  const probe = new Image();
  probe.onload = () => {
    img.src = srcList[index];
  };
  probe.onerror = () => {
    loadImage(img, srcList, index + 1);
  };
  probe.src = srcList[index];
};

photoSlots.forEach((img) => {
  const slot = img.dataset.photoSlot;
  if (!slot) {
    return;
  }

  const srcList = [];
  photoNameCandidates(slot).forEach((name) => {
    photoExtensions.forEach((ext) => {
      srcList.push(`./assets/images/${name}.${ext}`);
      srcList.push(`./assets/imgages/${name}.${ext}`);
    });
  });
  loadImage(img, srcList);
});

const fullPhotoObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle("is-active", entry.isIntersecting);
    });
  },
  { threshold: 0.45 }
);

fullPhotos.forEach((section) => fullPhotoObserver.observe(section));

const parallaxStoryPhotos = () => {
  const viewportMid = window.innerHeight / 2;
  storyPhotos.forEach((img) => {
    const rect = img.getBoundingClientRect();
    const distance = rect.top + rect.height / 2 - viewportMid;
    const ratio = Math.max(-1, Math.min(1, distance / viewportMid));
    const offset = ratio * -28;
    img.style.setProperty("--parallax-y", `${offset}px`);
  });
};

window.addEventListener("scroll", parallaxStoryPhotos, { passive: true });
window.addEventListener("resize", parallaxStoryPhotos);
parallaxStoryPhotos();
