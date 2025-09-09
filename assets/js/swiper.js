/* Header project items */
/* Header navigation with ID-based hrefs */
const projectItems = Array.from(document.querySelectorAll('.nested a'));
const sectionLinks = Array.from(document.querySelectorAll('.section-link'));
const allLinks = [...projectItems, ...sectionLinks];

const excludedSelectors = [
    '.project-info-container',  // Original exclusion
    '.nested a',               // Header project links
    '.section-link',           // Section navigation links
    '.project-title',          // Project titles within info
    '.close-btn',              // Close buttons (handled separately)
    '#menuToggle',             // Menu toggle button
    '.swiper-pagination',      // Swiper pagination
    '.swiper-button-next',     // Swiper navigation
    '.swiper-button-prev'      // Swiper navigation
];

function activateProject(projectId) {
    projectItems.forEach(_item => {
        _item.classList.remove('active');
    });
    projectItems[projectId].classList.add('active');
}

document.addEventListener('DOMContentLoaded', function () {

    const menuToggle = document.getElementById('menuToggle');
    const sideHeader = document.getElementById('sideHeader');
    const overlay = document.getElementById('overlay');

    if (menuToggle && sideHeader && overlay) {
        menuToggle.addEventListener('click', function () {
            sideHeader.classList.toggle('active');
            overlay.classList.toggle('active');
        });

        overlay.addEventListener('click', function () {
            sideHeader.classList.remove('active');
            overlay.classList.remove('active');
        });
    }

    const centralProjectInfo = document.getElementById('centralProjectInfo');

    // Function to update project info based on current section
    function updateProjectInfo(projectId) {
        // Get the relevant section info
        const projectInfo = document.getElementById(projectId);
        if (!projectInfo) {
            console.error('Section not found:', projectId);
            return;
        };

        const contentClone = projectInfo.cloneNode(true);
        contentClone.querySelector('.project-details').classList.add('active');

        centralProjectInfo.innerHTML = '';
        centralProjectInfo.appendChild(contentClone);

        // Log the element in the DOM
        const inDom = centralProjectInfo.querySelector('.project-details');

        // Reattach event listeners
        setupProjectInfoEvents();
    }

    // Setup event listeners for project info
    function setupProjectInfoEvents() {
        const projectTitles = document.querySelectorAll('.project-title');
        const closeButtons = document.querySelectorAll('.close-btn');

        // Open project info when title is clicked
        projectTitles.forEach(title => {
            title.addEventListener('click', function (event) {
                // Close all other open project details
                document.querySelectorAll('.project-details.active').forEach(detail => {
                    if (detail.id !== this.dataset.project) {
                        detail.classList.remove('active');
                    }
                });

                // Toggle current project details
                const details = document.getElementById(this.dataset.project);
                if (details) {
                    details.classList.toggle('active');
                }

                // Prevent click from affecting swiper
                event.stopPropagation();
            });
        });

        // Close project info when close button is clicked
        closeButtons.forEach(button => {
            button.addEventListener('click', function (event) {
                this.parentElement.classList.remove('active');
                event.stopPropagation();
            });
        });
    }

    // Close project info when clicking anywhere else
    document.addEventListener('click', function (event) {
        const isExcluded = excludedSelectors.some(selector =>
            event.target.closest(selector)
        );

        // Only close project info if the click is not on an excluded element
        if (!isExcluded) {
            document.querySelectorAll('.project-details.active').forEach(detail => {
                detail.classList.remove('active');
            });
        }
    });

    // Initial setup
    setupProjectInfoEvents();

    // Initialize swipers after DOM is fully loaded
    // Swiper initialization
    var outerSwiper = new Swiper(".outerSwiper", {
        direction: "vertical",
        spaceBetween: 50,
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
        },
        observer: true,
        observeParents: true,
        resizeObserver: true,
    });

    outerSwiper.on('slideNextTransitionEnd', function () {
        innerSwipers[outerSwiper.activeIndex - 1].disable();

        if (innerSwipers[outerSwiper.activeIndex].isBeginning)
            innerSwipers[outerSwiper.activeIndex].el.addEventListener('wheel', handleWheelPrev, { once: true });

        if (innerSwipers[outerSwiper.activeIndex].isEnd)
            innerSwipers[outerSwiper.activeIndex].el.addEventListener('wheel', handleWheelNext, { once: true });
    });

    outerSwiper.on('slidePrevTransitionEnd', function () {
        innerSwipers[outerSwiper.activeIndex + 1].disable();

        if (innerSwipers[outerSwiper.activeIndex].isBeginning)
            innerSwipers[outerSwiper.activeIndex].el.addEventListener('wheel', handleWheelPrev, { once: true });

        if (innerSwipers[outerSwiper.activeIndex].isEnd)
            innerSwipers[outerSwiper.activeIndex].el.addEventListener('wheel', handleWheelNext, { once: true });

    });



    // Add this new function after your other functions:
    function updateUrlForActiveSlide(activeIndex) {
        // Find the link that matches this slide index
        const matchingLink = projectItems.find(link => {
            const slideId = link.getAttribute('data-slide-id');
            return slideId !== null && parseInt(slideId) === activeIndex;
        });

        if (matchingLink) {
            const href = matchingLink.getAttribute('href');
            if (href && href !== window.location.pathname) {
                // Update URL without triggering a page reload
                history.pushState(null, '', href);
            }
        }
    }

    function pauseAllVideos() {
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
            video.pause();
        });
    }

    // Update project info when outer swiper changes
    outerSwiper.on('slideChange', function () {
        innerSwipers[outerSwiper.activeIndex].enable();
        updateProjectInfo('project-info-' + outerSwiper.activeIndex);

        // Update active project in header
        updateActiveProject(outerSwiper.activeIndex);

        updateUrlForActiveSlide(outerSwiper.activeIndex);
        pauseAllVideos();

    });

    var innerSwipersElements = Array.from(document.querySelectorAll(".innerSwiper"));
    var innerSwipers = innerSwipersElements.map(el =>
        new Swiper(el, {
            spaceBetween: 50,
            mousewheel: true,
            keyboard: {
                enabled: true,
            },
            pagination: {
                el: ".swiper-pagination",
                clickable: true,
            },
            observer: true,
            observeParents: true,
            resizeObserver: true,
        }));

    innerSwipers.forEach((swiper) => {
        swiper.disable()
    });

    if (innerSwipers.length > 0) {
        innerSwipers[0].enable();
        // Set initial project info
        updateProjectInfo('project-info-0');
    }


    function handleWheelNext(event) {
        if (event.wheelDelta < 0 || event.deltaY > 0) {
            outerSwiper.slideNext();
        }
    }

    function handleWheelPrev(event) {
        if (event.wheelDelta > 0 || event.deltaY < 0) {
            outerSwiper.slidePrev();
        }
    }

    innerSwipers.forEach((swiper) => {
        // Add event listener to detect when innerSwiper reaches the last slide
        swiper.on('slideChange', () => {
            swiper.el.removeEventListener('wheel', handleWheelNext);
            swiper.el.removeEventListener('wheel', handleWheelPrev);

            if (swiper.isEnd)
                swiper.el.addEventListener('wheel', handleWheelNext, { once: true });

            if (swiper.isBeginning)
                swiper.el.addEventListener('wheel', handleWheelPrev, { once: true });
        });
    });

    // Function to navigate to slide by ID
    function navigateToSlide(slideId) {
        if (slideId >= 0 && slideId < innerSwipers.length) {
            outerSwiper.slideTo(slideId);
            innerSwipers[slideId].slideTo(0, 0); // Reset inner swiper to first slide
            updateActiveProject(slideId);
        }
    }

    // Function to update active project in header
    function updateActiveProject(activeIndex) {
        projectItems.forEach(item => {
            item.parentElement.classList.remove('active');
        });
        if (projectItems[activeIndex]) {
            projectItems[activeIndex].parentElement.classList.add('active');
        }
    }

    // Set initial active state
    if (projectItems.length > 0) {
        projectItems[0].parentElement.classList.add('active');
    }

    // Handle all navigation links (both section and project links)
    allLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const slideId = this.getAttribute('data-slide-id');

            // Only handle links that have slide-id data attribute
            if (slideId !== null) {
                e.preventDefault(); // Prevent default navigation

                const slideIndex = parseInt(slideId);
                if (!isNaN(slideIndex)) {
                    navigateToSlide(slideIndex);

                    // Update URL without page reload
                    const href = this.getAttribute('href');
                    history.pushState(null, '', href);
                }
            }
            // If no data-slide-id, let it navigate normally (like about page)
        });
    });

    function handleDirectUrlNavigation() {
        const currentPath = window.location.pathname;

        // Find matching link by href
        const matchingLink = allLinks.find(link => {
            const linkHref = link.getAttribute('href');
            return linkHref === currentPath;
        });

        if (matchingLink && matchingLink.hasAttribute('data-slide-id')) {
            const slideId = parseInt(matchingLink.getAttribute('data-slide-id'));
            if (!isNaN(slideId)) {
                setTimeout(() => {
                    navigateToSlide(slideId);
                }, 100);
            }
        }
    }

    handleDirectUrlNavigation();

    // Handle browser back/forward buttons
    window.addEventListener('popstate', function (e) {
        handleDirectUrlNavigation();
    });

});

// Handle resize for responsive menu
window.addEventListener('resize', function () {
    const sideHeader = document.getElementById('sideHeader');
    const overlay = document.getElementById('overlay');

    if (sideHeader && overlay && window.innerWidth > 992) {
        sideHeader.classList.remove('active');
        overlay.classList.remove('active');
    }
});