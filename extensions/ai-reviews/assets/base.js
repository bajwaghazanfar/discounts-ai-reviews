const initializeModal = () => {
  const openModalBtns = document.querySelectorAll("[data-modal-target]");
  const closeBtns = document.querySelectorAll(
    ".modal-content-header .close_button",
  );

  openModalBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetSelector = btn.getAttribute("data-modal-target");
      const modal = document.querySelector(`#${targetSelector}`);
      if (modal) {
        // Add the class to body to prevent scrolling
        document.body.classList.add("modal-open");

        // Open Modal
        gsap.to(modal, {
          opacity: 1,
          display: "flex",
          duration: 0.3,
          ease: "power1.inOut",
        });
      }
    });
  });

  closeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetSelector = btn.getAttribute("data-modal-target");
      const modal = document.querySelector(`#${targetSelector}`);
      if (modal) {
        // Close Modal and remove body class
        gsap.to(modal, {
          opacity: 0,
          duration: 0.3,
          ease: "power1.inOut",
          onComplete: () => {
            // Set display to 'none' after animation is complete
            modal.style.display = "none";
            // Remove the class from body to re-enable scrolling
            document.body.classList.remove("modal-open");
          },
        });
      }
    });
  });
};

const initScrollElements = () => {
  const scrollToElements = document.querySelectorAll("[data-scroll-target]");
  console.log(scrollToElements, "SCROLLTO");
  scrollToElements.forEach((x) => {
    const attribute = x.getAttribute("data-scroll-target");
    if (attribute != "") {
      const container = document.querySelector(`.${attribute}`);
      if (container) {
        x.addEventListener("click", () => {
          container.scrollIntoView({
            behavior: "smooth",
          });
        });
      }
    }
  });
};
document.addEventListener("DOMContentLoaded", (event) => {
  initializeModal();
  initScrollElements();
});
document.addEventListener("initalizeModal", (event) => {
  console.log("listeninnggg");
  initializeModal();
});
document.addEventListener("initScrollElements", (event) => {
  console.log("Listening on document");
  initScrollElements();
});
