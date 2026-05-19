/* ===========================
   NAV 스크롤 효과
=========================== */
const nav = document.querySelector(".nav");

const updateNav = () => {
  if (!nav) return;
  nav.classList.toggle("is-scrolled", window.scrollY > 12);
};

window.addEventListener("scroll", updateNav, { passive: true });
updateNav();

/* ===========================
   스크롤 너지 (다운: 매 화면 하단, 업: 맨 밑에서만)
=========================== */
const nudgeDown = document.getElementById("scrollNudgeDown");
const nudgeUp = document.getElementById("scrollNudgeUp");

const sectionTargets = () => Array.from(document.querySelectorAll("main section[id]"));

const scrollToNextSection = () => {
  const navH = nav ? nav.getBoundingClientRect().height : 0;
  const buffer = 24;
  const sections = sectionTargets();
  const currentY = window.scrollY;
  for (const s of sections) {
    const top = s.getBoundingClientRect().top + window.scrollY - navH;
    if (top > currentY + buffer) {
      window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
      return;
    }
  }
  // 더 없으면 페이지 끝으로
  window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
};

const updateNudges = () => {
  const scrolled = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const isBottom = max - scrolled < 80;
  if (nudgeDown) nudgeDown.classList.toggle("is-visible", !isBottom && scrolled < max - 80);
  if (nudgeUp) nudgeUp.classList.toggle("is-visible", isBottom);
};
window.addEventListener("scroll", updateNudges, { passive: true });
window.addEventListener("resize", updateNudges);
updateNudges();
// 초기 진입 시 살짝 지연 후 한 번 더 (이미지/폰트 로드로 높이 변화)
setTimeout(updateNudges, 300);
setTimeout(updateNudges, 1200);

if (nudgeDown) nudgeDown.addEventListener("click", scrollToNextSection);
if (nudgeUp) nudgeUp.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

/* ===========================
   스크롤 버튼
=========================== */
document.querySelectorAll("[data-scroll-target]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = document.querySelector(btn.dataset.scrollTarget);
    if (!target) return;
    const navH = nav ? nav.getBoundingClientRect().height : 0;
    const top = target.getBoundingClientRect().top + window.scrollY - navH;
    window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
  });
});

/* ===========================
   페이드인 (IntersectionObserver)
=========================== */
const fadeObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        fadeObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1 }
);

document.querySelectorAll(".fade-in").forEach((el) => fadeObserver.observe(el));

/* ===========================
   임팩트 카운터 애니메이션
=========================== */
const counterEls = document.querySelectorAll(".impact-num[data-target]");

const animateCounter = (el) => {
  const target = parseInt(el.dataset.target, 10);
  const duration = target <= 10 ? 800 : 1400;
  const start = performance.now();
  el.classList.add("is-counted");
  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
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

/* ===========================
   캐러셀
=========================== */
const track = document.getElementById("carouselTrack");
const dotsWrap = document.getElementById("carouselDots");
const prevBtn = document.getElementById("carouselPrev");
const nextBtn = document.getElementById("carouselNext");

if (track && dotsWrap) {
  const cards = Array.from(track.querySelectorAll(".testi-card"));
  let currentIndex = 0;

  // 닷 생성
  cards.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.className = "carousel-dot" + (i === 0 ? " is-active" : "");
    dot.setAttribute("aria-label", `${i + 1}번째 증언`);
    dot.addEventListener("click", () => scrollTo(i));
    dotsWrap.appendChild(dot);
  });

  const dots = Array.from(dotsWrap.querySelectorAll(".carousel-dot"));

  const updateDots = (index) => {
    dots.forEach((d, i) => d.classList.toggle("is-active", i === index));
  };

  const scrollTo = (index) => {
    const card = cards[index];
    if (!card) return;
    const trackLeft = track.getBoundingClientRect().left;
    const cardLeft = card.getBoundingClientRect().left;
    track.scrollBy({ left: cardLeft - trackLeft, behavior: "smooth" });
    currentIndex = index;
    updateDots(index);
  };

  prevBtn && prevBtn.addEventListener("click", () => {
    scrollTo(Math.max(currentIndex - 1, 0));
  });

  nextBtn && nextBtn.addEventListener("click", () => {
    scrollTo(Math.min(currentIndex + 1, cards.length - 1));
  });

  // 스크롤로 닷 동기화
  let scrollTimer;
  track.addEventListener("scroll", () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      const trackLeft = track.getBoundingClientRect().left;
      let closestIndex = 0;
      let minDist = Infinity;
      cards.forEach((card, i) => {
        const dist = Math.abs(card.getBoundingClientRect().left - trackLeft);
        if (dist < minDist) { minDist = dist; closestIndex = i; }
      });
      currentIndex = closestIndex;
      updateDots(currentIndex);
    }, 80);
  }, { passive: true });

  // 자동 회전 (5초마다 다음 카드로, 끝나면 처음으로)
  const AUTOPLAY_INTERVAL = 5000;
  let autoplayId = null;
  let isPaused = false;

  const tickAutoplay = () => {
    if (isPaused) return;
    const next = (currentIndex + 1) % cards.length;
    scrollTo(next);
  };

  const startAutoplay = () => {
    if (autoplayId) return;
    autoplayId = setInterval(tickAutoplay, AUTOPLAY_INTERVAL);
  };
  const stopAutoplay = () => {
    if (autoplayId) {
      clearInterval(autoplayId);
      autoplayId = null;
    }
  };

  // 사용자 인터랙션이 있으면 잠시 멈추고 곧 재개
  const pauseBriefly = (ms = 8000) => {
    isPaused = true;
    setTimeout(() => { isPaused = false; }, ms);
  };

  [prevBtn, nextBtn, ...dots].forEach((btn) => {
    if (!btn) return;
    btn.addEventListener("click", () => pauseBriefly());
  });
  const carouselWrap = track.closest(".carousel-wrap");
  if (carouselWrap) {
    carouselWrap.addEventListener("mouseenter", stopAutoplay);
    carouselWrap.addEventListener("mouseleave", startAutoplay);
  }
  // 페이지가 보이지 않으면 정지
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAutoplay(); else startAutoplay();
  });
  // 화면에 들어왔을 때만 시작
  const carouselSection = document.querySelector("#testimonials");
  if (carouselSection && "IntersectionObserver" in window) {
    const carouselObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) startAutoplay();
        else stopAutoplay();
      });
    }, { threshold: 0.25 });
    carouselObs.observe(carouselSection);
  } else {
    startAutoplay();
  }
}

/* ===========================
   금액 선택 버튼
=========================== */
document.querySelectorAll(".amount-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".amount-btn").forEach((b) => b.classList.remove("is-selected"));
    btn.classList.add("is-selected");
  });
});

/* ===========================
   혜택 아코디언 힌트 텍스트
=========================== */
document.querySelectorAll(".benefit-details").forEach((details) => {
  const hint = details.querySelector(".benefit-toggle-hint");
  if (!hint) return;
  const sync = () => { hint.textContent = details.open ? "접기" : "펼치기"; };
  details.addEventListener("toggle", sync);
  sync();
});

/* ===========================
   형광펜 밑줄 (스크롤 트리거)
=========================== */
const highlightObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        highlightObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.5 }
);
document.querySelectorAll(".highlight").forEach((el) => highlightObserver.observe(el));

/* ===========================
   스토리 아이템 enter 애니메이션
=========================== */
const storyObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        storyObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.18 }
);
document.querySelectorAll(".story-item").forEach((el) => storyObserver.observe(el));

/* ===========================
   스토리 stat 숫자 카운터
=========================== */
const statNums = document.querySelectorAll(".story-stat-num[data-target]");
const animateStatNum = (el) => {
  const target = parseInt(el.dataset.target, 10);
  const duration = 1400;
  const start = performance.now();
  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target).toLocaleString("ko-KR");
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = target.toLocaleString("ko-KR");
  };
  requestAnimationFrame(tick);
};
const statObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateStatNum(entry.target);
        statObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.5 }
);
statNums.forEach((el) => statObserver.observe(el));

/* ===========================
   재정 구조 도넛 애니메이션
=========================== */
const financeObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const arcs = entry.target.querySelectorAll(".finance-arc");
        arcs.forEach((arc, idx) => {
          const target = arc.getAttribute("data-target-dasharray");
          if (target) {
            setTimeout(() => {
              arc.style.strokeDasharray = target;
            }, idx * 250 + 150);
          }
        });
        entry.target.classList.add("is-animated");
        financeObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.4 }
);
document.querySelectorAll(".finance-donut").forEach((el) => financeObserver.observe(el));

/* ===========================
   공유 동선 - 시스템 공유 우선, 클립보드 폴백 (모바일 대응)
=========================== */
(() => {
  const shareBlock = document.querySelector(".share-block");
  if (!shareBlock) return;

  const url = window.location.href;
  const title = document.title || "녹색전환연구소 · 첫 번째 후원 캠페인";
  const text = "녹색전환연구소의 첫 후원 캠페인에 함께해주세요.";

  const copyBtn = shareBlock.querySelector('[data-share="copy"]');
  const toast = shareBlock.querySelector(".share-toast");

  const showToast = (msg) => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("is-show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      toast.classList.remove("is-show");
    }, 2400);
  };

  const fallbackCopy = (value) => {
    const ta = document.createElement("textarea");
    ta.value = value;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "0";
    ta.style.left = "0";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch (_) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  };

  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      // 모바일은 navigator.share가 더 자연스러움
      const isMobile = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
      if (isMobile && typeof navigator !== "undefined" && navigator.share) {
        try {
          await navigator.share({ title, text, url });
          return;
        } catch (_) {
          // 사용자 취소면 그냥 종료, 그 외엔 복사로 폴백
        }
      }
      // 데스크톱 또는 모바일 폴백: 클립보드 복사
      let copied = false;
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(url);
          copied = true;
        } catch (_) { copied = false; }
      }
      if (!copied) copied = fallbackCopy(url);

      if (copied) {
        showToast("링크가 복사되었습니다");
      } else {
        showToast("복사에 실패했어요. 주소창의 URL을 직접 복사해주세요.");
      }
    });
  }
})();

/* ===========================
   커스텀 커서 - 잉크 점 + 잔상 링 (포인터 디바이스 전용)
=========================== */
const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
if (supportsHover) {
  const dot = document.createElement("div");
  dot.className = "cursor-dot";
  dot.setAttribute("aria-hidden", "true");

  const ring = document.createElement("div");
  ring.className = "cursor-ring";
  ring.setAttribute("aria-hidden", "true");

  document.body.append(dot, ring);

  let mouseX = -100, mouseY = -100;
  let ringX = -100, ringY = -100;

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
  }, { passive: true });

  const animateRing = () => {
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
    requestAnimationFrame(animateRing);
  };
  animateRing();

  const hoverSelectors = "a, button, summary, [data-scroll-target], .amount-btn, .story-item, .impact-card, .policy-card, .future-card, .benefit-item, .floating-donate, .testi-card, .faq-item";

  document.querySelectorAll(hoverSelectors).forEach((el) => {
    el.addEventListener("mouseenter", () => {
      dot.classList.add("is-hover");
      ring.classList.add("is-hover");
    });
    el.addEventListener("mouseleave", () => {
      dot.classList.remove("is-hover");
      ring.classList.remove("is-hover");
    });
  });

  // 클릭 시 잉크 자국
  document.addEventListener("mousedown", (e) => {
    const drop = document.createElement("div");
    drop.className = "ink-drop";
    drop.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    document.body.appendChild(drop);
    setTimeout(() => drop.remove(), 750);
  });

  document.addEventListener("mouseleave", () => {
    dot.classList.add("is-hidden");
    ring.classList.add("is-hidden");
  });
  document.addEventListener("mouseenter", () => {
    dot.classList.remove("is-hidden");
    ring.classList.remove("is-hidden");
  });
}
