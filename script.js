
/* =========================================
   ARVO STUDIO — AUTOMATIC GALLERY SYSTEM
   Node.js + Express API
   Smooth Gallery Scroll + Photo Reveal
   ========================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* PORTFOLIO COLLECTIONS */

    const portfolioCollections = {
        wedding: {
            title: "Wedding Stories"
        },

        portraits: {
            title: "Portraits"
        },

        prenup: {
            title: "Prenup Stories"
        },

        events: {
            title: "Events & Celebrations"
        },

        brands: {
            title: "Brands & Products"
        },

        films: {
            title: "Visual Films"
        }
    };


    /* AUTOMATIC GALLERY DATA */

    let galleryData = {};
    let currentPhotos = [];
    let currentPhotoIndex = 0;
    let galleryRequestNumber = 0;


    async function loadGalleryData() {
        try {
            const response = await fetch("/api/gallery");

            if (!response.ok) {
                throw new Error("Unable to connect to gallery API.");
            }

            const data = await response.json();

            if (!data.success || !data.gallery) {
                throw new Error("Invalid gallery response.");
            }

            galleryData = data.gallery;

            console.log("ARVO Studio gallery loaded:", galleryData);

            return true;

        } catch (error) {
            console.error("Gallery loading error:", error);
            return false;
        }
    }


    /* INTRO ANIMATION */

    const introScreen = document.getElementById("introScreen");

    if (introScreen) {
        document.body.classList.add("no-scroll");

        setTimeout(() => {
            introScreen.classList.add("hide");
            document.body.classList.remove("no-scroll");
        }, 3200);

        setTimeout(() => {
            introScreen.style.display = "none";
        }, 4300);
    }


    /* MOBILE NAVIGATION */

    const menuToggle = document.getElementById("menuToggle");
    const navigation = document.getElementById("navigation");

    if (menuToggle && navigation) {
        menuToggle.addEventListener("click", () => {
            navigation.classList.toggle("open");

            menuToggle.setAttribute(
                "aria-expanded",
                String(navigation.classList.contains("open"))
            );
        });

        navigation.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                navigation.classList.remove("open");
                menuToggle.setAttribute("aria-expanded", "false");
            });
        });
    }


    /* HEADER SCROLL EFFECT */

    const siteHeader = document.getElementById("siteHeader");

    function updateHeader() {
        if (!siteHeader) return;

        siteHeader.classList.toggle("scrolled", window.scrollY > 50);
    }

    window.addEventListener("scroll", updateHeader, { passive: true });
    updateHeader();


    /* CATEGORY GALLERY ELEMENTS */

    const categoryButtons = document.querySelectorAll(
        ".portfolio-item[data-category]"
    );

    const categoryGallery = document.getElementById("categoryGallery");
    const galleryTitle = document.getElementById("galleryTitle");
    const galleryPhotoGrid = document.getElementById("galleryPhotoGrid");
    const galleryClose = document.getElementById("galleryClose");


    /* PHOTO SCROLL REVEAL */

    function animateGalleryPhotos() {
        const photos = document.querySelectorAll(".gallery-photo");

        if (!("IntersectionObserver" in window)) {
            photos.forEach(photo => photo.classList.add("show"));
            return;
        }

        const photoObserver = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("show");
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.12,
                rootMargin: "0px 0px -30px 0px"
            }
        );

        photos.forEach((photo, index) => {
            photo.style.transitionDelay = `${(index % 6) * 100}ms`;
            photoObserver.observe(photo);
        });
    }


    /* CATEGORY GALLERY */

    async function openCategory(category) {
        const collection = portfolioCollections[category];

        if (
            !collection ||
            !categoryGallery ||
            !galleryPhotoGrid ||
            !galleryTitle
        ) {
            return;
        }

        const requestNumber = ++galleryRequestNumber;

        galleryTitle.textContent = collection.title;
        galleryPhotoGrid.innerHTML = "";

        categoryGallery.classList.add("active");
        categoryGallery.setAttribute("aria-hidden", "false");

        const loadingMessage = document.createElement("p");
        loadingMessage.textContent = "Loading photographs...";
        loadingMessage.className = "gallery-loading";

        galleryPhotoGrid.appendChild(loadingMessage);

        requestAnimationFrame(() => {
            categoryGallery.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });

        /* Refresh gallery data from the server. */

        const loaded = await loadGalleryData();

        /* Ignore an older request if another category was opened. */

        if (requestNumber !== galleryRequestNumber) return;

        if (!loaded) {
            galleryPhotoGrid.innerHTML = "";

            const errorMessage = document.createElement("p");
            errorMessage.textContent =
                "Unable to load photographs. Please check your gallery server.";
            errorMessage.className = "gallery-loading";

            galleryPhotoGrid.appendChild(errorMessage);
            return;
        }

        const photos = galleryData[category] || [];

        currentPhotos = photos.map(photo => photo.url);

        galleryPhotoGrid.innerHTML = "";

        if (photos.length === 0) {
        const emptyState = document.createElement("div");

        emptyState.className = "gallery-empty-state";

        emptyState.innerHTML = `
            <span class="empty-state-label">ARVO STUDIO</span>
            <h3>New Stories Coming Soon</h3>
            <p>
                This collection is currently being prepared.
                Stay tuned for more visual stories.
            </p>
        `;

        galleryPhotoGrid.appendChild(emptyState);
        return;
    }


        photos.forEach((photo, index) => {

            const button = document.createElement("button");

            button.className = "gallery-photo";
            button.type = "button";

            button.setAttribute(
                "aria-label",
                `Open photo ${index + 1}`
            );

            const image = document.createElement("img");

            image.src = photo.url;
            image.alt = `${collection.title} ${index + 1}`;
            image.loading = "lazy";
            image.decoding = "async";

            image.addEventListener("error", () => {
                console.error("Missing photo:", photo.url);
                image.classList.add("image-missing");
            });

            const number = document.createElement("span");

            number.textContent = String(index + 1).padStart(2, "0");

            button.appendChild(image);
            button.appendChild(number);

            button.addEventListener("click", () => {
                openLightbox(index);
            });

            galleryPhotoGrid.appendChild(button);
        });

        animateGalleryPhotos();

        console.log(
            `${collection.title}: ${photos.length} photographs loaded.`
        );
    }


    /* CATEGORY BUTTON EVENTS */

    categoryButtons.forEach(button => {
        button.addEventListener("click", () => {
            openCategory(button.dataset.category);
        });
    });


    /* CLOSE CATEGORY */

    function closeCategory() {
        if (!categoryGallery) return;

        galleryRequestNumber++;

        categoryGallery.classList.remove("active");
        categoryGallery.setAttribute("aria-hidden", "true");

        document.getElementById("portfolio")?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    if (galleryClose) {
        galleryClose.addEventListener("click", closeCategory);
    }


    /* PHOTO LIGHTBOX */

    const lightbox = document.getElementById("lightbox");
    const lightboxImage = document.getElementById("lightboxImage");
    const lightboxTitle = document.getElementById("lightboxTitle");

    const lightboxClose = document.getElementById("lightboxClose");
    const lightboxPrev = document.getElementById("lightboxPrev");
    const lightboxNext = document.getElementById("lightboxNext");


    function showPhoto(index) {
        if (!currentPhotos.length || !lightboxImage) return;

        currentPhotoIndex =
            (index + currentPhotos.length) % currentPhotos.length;

        lightboxImage.src = currentPhotos[currentPhotoIndex];

        lightboxImage.alt =
            `ARVO Studio photo ${currentPhotoIndex + 1}`;

        if (lightboxTitle) {
            lightboxTitle.textContent =
                `${currentPhotoIndex + 1} / ${currentPhotos.length}`;
        }
    }


    function openLightbox(index) {
        if (!lightbox) return;

        showPhoto(index);

        lightbox.classList.add("active");
        lightbox.setAttribute("aria-hidden", "false");

        document.body.classList.add("no-scroll");
    }


    function closeLightbox() {
        if (!lightbox) return;

        lightbox.classList.remove("active");
        lightbox.setAttribute("aria-hidden", "true");

        document.body.classList.remove("no-scroll");
    }


    if (lightboxClose) {
        lightboxClose.addEventListener("click", closeLightbox);
    }

    if (lightboxPrev) {
        lightboxPrev.addEventListener("click", () => {
            showPhoto(currentPhotoIndex - 1);
        });
    }

    if (lightboxNext) {
        lightboxNext.addEventListener("click", () => {
            showPhoto(currentPhotoIndex + 1);
        });
    }

    if (lightbox) {
        lightbox.addEventListener("click", event => {
            if (event.target === lightbox) {
                closeLightbox();
            }
        });
    }


    /* KEYBOARD CONTROLS */

    document.addEventListener("keydown", event => {

        if (lightbox?.classList.contains("active")) {

            if (event.key === "Escape") {
                closeLightbox();
            }

            if (event.key === "ArrowLeft") {
                showPhoto(currentPhotoIndex - 1);
            }

            if (event.key === "ArrowRight") {
                showPhoto(currentPhotoIndex + 1);
            }

        } else if (
            event.key === "Escape" &&
            categoryGallery?.classList.contains("active")
        ) {
            closeCategory();
        }
    });


    /* MAIN PAGE SCROLL REVEAL */

    const revealElements = document.querySelectorAll(
        ".section-heading, .about-content, .portfolio-item, " +
        ".service-item, .philosophy-grid article, " +
        ".creator-image, .creator-text, .contact-section"
    );

    if ("IntersectionObserver" in window) {

        const revealObserver = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach(entry => {

                    if (entry.isIntersecting) {
                        entry.target.classList.add("visible");
                        observer.unobserve(entry.target);
                    }

                });
            },
            {
                threshold: 0.12,
                rootMargin: "0px 0px -40px 0px"
            }
        );

        revealElements.forEach(element => {
            element.classList.add("reveal");
            revealObserver.observe(element);
        });

    } else {

        revealElements.forEach(element => {
            element.classList.add("visible");
        });

    }


    /* ACTIVE NAVIGATION */

    const sections = document.querySelectorAll(
        "#home, #about, #portfolio, #services, #contact"
    );

    const navLinks = document.querySelectorAll(".navigation a");

    if ("IntersectionObserver" in window) {

        const sectionObserver = new IntersectionObserver(
            entries => {

                entries.forEach(entry => {

                    if (!entry.isIntersecting) return;

                    navLinks.forEach(link => {

                        link.classList.toggle(
                            "active",
                            link.getAttribute("href") ===
                            `#${entry.target.id}`
                        );

                    });

                });

            },
            { threshold: 0.35 }
        );

        sections.forEach(section => {
            sectionObserver.observe(section);
        });
    }


    /* IMAGE ERROR DETECTION */

    document.querySelectorAll("img").forEach(image => {

        image.addEventListener("error", () => {

            image.classList.add("image-missing");

            console.warn("Image not found:", image.src);

        });

    });


    /* FOOTER YEAR */

    const footerYear = document.querySelector(".footer-year");

    if (footerYear) {
        footerYear.textContent = new Date().getFullYear();
    }


    /* INITIAL GALLERY CONNECTION */

    loadGalleryData();

});
