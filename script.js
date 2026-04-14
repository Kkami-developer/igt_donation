const scrollButtons = document.querySelectorAll("[data-scroll-target]");
const tabButtons = document.querySelectorAll(".tab-btn");
const tabPanels = document.querySelectorAll(".tab-panel");
const fadeTargets = document.querySelectorAll(".fade-in");
const counters = document.querySelectorAll(".count-up");
const nav = document.querySelector(".nav");
const photoSlots = document.querySelectorAll("[data-photo-slot]");
const fullPhotos = document.querySelectorAll(".full-photo");
const storyPhotos = document.querySelectorAll(".story-photo img");
const pageSections = Array.from(document.querySelectorAll("main > section"));
const sceneNextButton = document.querySelector("#scene-next-btn");

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

const updateNavHeight = () => {
  if (!nav) {
    return;
  }

  const navHeight = Math.ceil(nav.getBoundingClientRect().height);
  document.documentElement.style.setProperty("--nav-height", `${navHeight}px`);
};

window.addEventListener("scroll", updateNavOnScroll, { passive: true });
window.addEventListener("resize", updateNavHeight);
updateNavOnScroll();
updateNavHeight();

const updateSceneNextButton = () => {
  if (!sceneNextButton || pageSections.length < 2) {
    return;
  }

  let currentIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  pageSections.forEach((section, index) => {
    const distance = Math.abs(section.getBoundingClientRect().top);
    if (distance < bestDistance) {
      bestDistance = distance;
      currentIndex = index;
    }
  });

  const nextSection = pageSections[currentIndex + 1];

  if (!nextSection) {
    const isNearBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 8;
    if (isNearBottom) {
      sceneNextButton.dataset.scrollTarget = "#top";
      sceneNextButton.classList.add("is-to-top");
      sceneNextButton.classList.remove("is-hidden");
      sceneNextButton.setAttribute("aria-label", "맨 위로 이동");
    } else {
      sceneNextButton.classList.add("is-hidden");
      sceneNextButton.classList.remove("is-to-top");
      sceneNextButton.removeAttribute("data-scroll-target");
    }
    return;
  }

  if (!nextSection.id) {
    nextSection.id = `snap-section-${currentIndex + 1}`;
  }

  sceneNextButton.dataset.scrollTarget = `#${nextSection.id}`;
  sceneNextButton.classList.remove("is-hidden", "is-to-top");
  sceneNextButton.setAttribute("aria-label", "다음 장면으로 이동");
};

const photoNameCandidates = (slot) => [
  `photo-${slot}`,
  `photo${slot}`,
  `sample-${slot}`,
  `sample${slot}`,
  `img-${slot}`,
  `img${slot}`,
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

  const defaultSrc = img.getAttribute("src");
  if (defaultSrc) {
    img.loading = "eager";
    return;
  }

  const srcList = [];
  photoNameCandidates(slot).forEach((name) => {
    photoExtensions.forEach((ext) => {
      const candidate = `./assets/images/${name}.${ext}`;
      if (!srcList.includes(candidate)) {
        srcList.push(candidate);
      }
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
    const offset = ratio * -48;
    img.style.setProperty("--parallax-y", `${offset}px`);
  });
};

window.addEventListener("scroll", parallaxStoryPhotos, { passive: true });
window.addEventListener("scroll", updateSceneNextButton, { passive: true });
window.addEventListener("resize", parallaxStoryPhotos);
window.addEventListener("resize", updateSceneNextButton);
parallaxStoryPhotos();
updateSceneNextButton();

if (sceneNextButton) {
  sceneNextButton.addEventListener("click", () => {
    if (sceneNextButton.classList.contains("is-to-top")) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const targetSelector = sceneNextButton.dataset.scrollTarget;
    if (!targetSelector) {
      return;
    }

    const target = document.querySelector(targetSelector);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}
