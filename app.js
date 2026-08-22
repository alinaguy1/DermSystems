document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // 1. NAVBAR CLICK & SCROLL TRACKING FIX
  // ==========================================
  const navLinks = document.querySelectorAll(".nav-links a");
  // Change this selector to match your landing page HTML section class or tag
  const sections = document.querySelectorAll("section[id]");

  // Handle Navbar Clicks
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.forEach((item) => item.classList.remove("active"));
      link.classList.add("active");
    });
  });

  // Handle Scroll Syncing via Intersection Observer
  const observerOptions = {
    root: null,
    rootMargin: "-40% 0px -50% 0px", // Triggers when section hits upper middle of screen
    threshold: 0,
  };

  const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const activeId = entry.target.getAttribute("id");

        navLinks.forEach((link) => {
          // Checks if the link's href matches the visible section's ID
          if (link.getAttribute("href") === `#${activeId}`) {
            link.classList.add("active");
          } else {
            link.classList.remove("active");
          }
        });
      }
    });
  }, observerOptions);

  // Track all page sections that have an ID attribute
  sections.forEach((section) => scrollObserver.observe(section));

  // ==========================================
  // 2. CHECKLIST FEATURE
  // ==========================================
  const list = document.getElementById("checklist");
  const items = document.querySelectorAll(".question-container");
  const countEl = document.getElementById("counter-num");
  const textEl = document.getElementById("message-box");
  const total = items.length;

  function updateResult() {
    const activeChecklistItems = document.querySelectorAll(
      ".question-container.active",
    ).length;
    if (countEl) countEl.textContent = activeChecklistItems + "/" + total;
    if (!textEl) return;

    if (activeChecklistItems === 0) {
      textEl.textContent =
        "Tap any that apply. If most of them do, DermSystems was built exactly for you";
    } else if (activeChecklistItems <= 2) {
      textEl.textContent =
        "A few of these sound familiar. Let's bring some clarity to your routine.";
    } else if (activeChecklistItems <= 5) {
      textEl.textContent =
        "That's a lot to carry alongside everything else. This is exactly what the session is for.";
    } else {
      textEl.textContent =
        "You're exactly who DermSystems was created for. Let's fix this together.";
    }
  }

  if (list) {
    list.addEventListener("click", (e) => {
      const item = e.target.closest(".question-container");
      if (!item || !list.contains(item)) return;
      item.classList.toggle("active");
      item.classList.toggle("checked");
      updateResult();
    });
  }

  // Initialize checklist display state
  updateResult();

  // ==========================================
  // 3. DRAGGABLE SLIDER
  // ==========================================
  const slider = document.querySelector(".wtf-vp");
  if (slider) {
    let isDown = false;
    let startX;
    let scrollLeft;

    slider.addEventListener("mousedown", (e) => {
      isDown = true;
      slider.classList.add("is-dragging");
      startX = e.pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
    });

    slider.addEventListener("mouseleave", () => {
      isDown = false;
      slider.classList.remove("is-dragging");
    });

    slider.addEventListener("mouseup", () => {
      isDown = false;
      slider.classList.remove("is-dragging");
    });

    slider.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 1.5;
      slider.scrollLeft = scrollLeft - walk;
    });
  }

  // ==========================================
  // 4. FORM SUBMISSION BANNER
  // ==========================================
  const form = document.querySelector("form");
  const successBanner = document.querySelector(".success-banner");
  const continueBtn = document.querySelector(".continue-btn");

  if (form && successBanner) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      successBanner.classList.add("active");
    });
  }

  if (continueBtn) {
    continueBtn.addEventListener("click", function (event) {
      event.preventDefault();
      window.location.reload();
    });
  }

  // ==========================================
  // 5. DROPDOWN "OTHER" FIELD TOGGLE
  // ==========================================
  const concernSelect = document.getElementById("concernSelect");
  const otherBoxWrapper = document.querySelector(".other-box-wrapper");

  if (concernSelect && otherBoxWrapper) {
    function handleDropdownChange() {
      if (concernSelect.value === "Other") {
        otherBoxWrapper.classList.add("show");
      } else {
        otherBoxWrapper.classList.remove("show");
      }
    }

    handleDropdownChange();
    concernSelect.addEventListener("change", handleDropdownChange);
  }
});

const form = document.getElementById("consultationForm");
const successBanner = document.querySelector(".success-banner");
const formContents = document.querySelector(".form-contents");

const scriptURL =
  "https://script.google.com/macros/s/AKfycbxHc8LjILTB3NSo36SGxhsCgOw6wjLu7dx_J-IRjMZ5gh_CX52CWJpy1dW-zgrDIJac/exec";

form.addEventListener("submit", (e) => {
  e.preventDefault(); // Prevents page from reloading

  // Changes button text to show loading state
  const submitBtn = form.querySelector(".BMC");
  submitBtn.disabled = true;
  submitBtn.innerText = "Sending Request...";

  fetch(scriptURL, { method: "POST", body: new FormData(form) })
    .then((response) => {
      submitBtn.disabled = false;
      submitBtn.innerText = "Book My Consultation";

      form.reset();
    })
    .catch((error) => {
      console.error("Error!", error.message);
      alert("Something went wrong. Please try again.");
      submitBtn.disabled = false;
      submitBtn.innerText = "Book My Consultation";
    });
});

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (!toggle || !links) return;

  const closeMenu = () => {
    links.classList.remove("open");
    document.body.classList.remove("nav-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () => {
    const isOpen = links.classList.toggle("open");
    document.body.classList.toggle("nav-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  links.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });
});
