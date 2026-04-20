const scrollButtons = document.querySelectorAll("[data-scroll-target]");
const fadeTargets = document.querySelectorAll(".fade-in");
const nav = document.querySelector(".nav");
const breadcrumbBar = document.querySelector(".breadcrumb-bar");
const photoSlots = document.querySelectorAll("[data-photo-slot]");
const fullPhotos = document.querySelectorAll(".full-photo");
const storyPhotos = document.querySelectorAll(".story-photo img");
const pageSections = Array.from(document.querySelectorAll("main > section"));
const sceneNextButton = document.querySelector("#scene-next-btn");

const scrollToSectionStart = (target) => {
  if (!target) {
    return;
  }
  const navHeight = nav ? Math.ceil(nav.getBoundingClientRect().height) : 0;
  const targetTop = target.getBoundingClientRect().top + window.scrollY - navHeight;
  window.scrollTo({ top: Math.max(targetTop, 0), behavior: "smooth" });
};

scrollButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = document.querySelector(button.dataset.scrollTarget);
    if (target) {
      scrollToSectionStart(target);
    }
  });
});

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

/** 네비 + 브레드크럼 높이 → 히어로가 남은 뷰포트에 정확히 들어가도록 */
const updateLayoutAboveHero = () => {
  if (!nav) {
    return;
  }

  const navH = Math.ceil(nav.getBoundingClientRect().height);
  const crumbH = breadcrumbBar ? Math.ceil(breadcrumbBar.getBoundingClientRect().height) : 0;
  document.documentElement.style.setProperty("--layout-above-hero", `${navH + crumbH}px`);
};

window.addEventListener("scroll", updateNavOnScroll, { passive: true });
window.addEventListener("resize", updateNavHeight);
window.addEventListener("resize", updateLayoutAboveHero);
updateNavOnScroll();
updateNavHeight();
updateLayoutAboveHero();
window.addEventListener("load", updateLayoutAboveHero);

/** 현재 뷰포트에서 가장 많이 보이는 섹션 = ‘장면’ (긴 섹션·경계에서도 안정적) */
const getCurrentSectionIndex = () => {
  const vh = window.innerHeight;
  let bestIdx = 0;
  let bestVis = -1;

  pageSections.forEach((section, index) => {
    const rect = section.getBoundingClientRect();
    const visible = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
    if (visible > bestVis) {
      bestVis = visible;
      bestIdx = index;
    } else if (visible === bestVis && visible > 0 && index !== bestIdx) {
      const prevTop = pageSections[bestIdx].getBoundingClientRect().top;
      if (rect.top < prevTop) {
        bestIdx = index;
      }
    }
  });

  if (bestVis <= 0 && pageSections.length > 0) {
    const anchor = window.scrollY + vh * 0.38;
    pageSections.forEach((section, index) => {
      const rect = section.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      const bottom = top + rect.height;
      if (anchor >= top && anchor < bottom) {
        bestIdx = index;
      }
    });
  }

  return bestIdx;
};

const updateSceneNextButton = () => {
  if (!sceneNextButton || pageSections.length < 2) {
    return;
  }

  const currentIndex = getCurrentSectionIndex();

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
      scrollToSectionStart(target);
    }
  });
}

// Impact Cases Tab switching
const impactTabBtns = document.querySelectorAll(".impact-tab-btn");
const impactPanels = document.querySelectorAll(".impact-panel");

impactTabBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;

    impactTabBtns.forEach((b) => {
      b.classList.remove("active");
      b.setAttribute("aria-selected", "false");
    });
    impactPanels.forEach((p) => p.classList.remove("active"));

    btn.classList.add("active");
    btn.setAttribute("aria-selected", "true");
    const panel = document.getElementById("tab-" + tab);
    if (panel) panel.classList.add("active");
  });
});

document.querySelectorAll("details.approach-more").forEach((detailsEl) => {
  const hint = detailsEl.querySelector(".approach-more__summary-hint");
  if (!hint) {
    return;
  }
  const syncHint = () => {
    hint.textContent = detailsEl.open ? "접기" : "펼치기";
  };
  detailsEl.addEventListener("toggle", syncHint);
  syncHint();
});

/* ===================================================
   임팩트 카운터 애니메이션
   =================================================== */
const counterEls = document.querySelectorAll(".impact-full__counter-num[data-target]");

const animateCounter = (el) => {
  const target = parseInt(el.dataset.target, 10);
  const duration = target <= 2 ? 600 : 1200;
  const start = performance.now();
  el.classList.add("is-counted");
  const tick = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target);
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = target;
  };
  requestAnimationFrame(tick);
};

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.4 }
);

counterEls.forEach((el) => counterObserver.observe(el));

/* ===================================================
   나머지 사례 리스트 순차 페이드인
   =================================================== */
const restItems = document.querySelectorAll(".impact-rest__item");
const restClosing = document.querySelector(".impact-rest__closing");

const restObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        restItems.forEach((item, i) => {
          setTimeout(() => item.classList.add("is-visible"), i * 60);
        });
        if (restClosing) {
          setTimeout(() => restClosing.classList.add("is-visible"), restItems.length * 60 + 200);
        }
        restObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.05 }
);

const restSection = document.querySelector(".impact-rest");
if (restSection) restObserver.observe(restSection);
