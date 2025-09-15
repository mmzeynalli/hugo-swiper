import { preloadAdjacentSlides, unloadDistantSlides } from './media.js';

/* Header project items */
const projectItems = document.querySelectorAll('.nested a');
const sectionLinks = document.querySelectorAll('.section-link');
const allLinks = [...projectItems, ...sectionLinks];

const excludedSelectors = [
    '.project-info-container',
    '.nested a',
    '.section-link',
    '.project-title',
    '.close-btn',
    '#menuToggle',
    '.swiper-pagination',
    '.swiper-button-next',
    '.swiper-button-prev'
];


document.addEventListener('DOMContentLoaded', function () {
    const centralProjectInfo = document.getElementById('centralProjectInfo');

    function updateProjectInfo(projectId) {
        const projectInfo = document.getElementById(projectId);
        if (!projectInfo) {
            console.error('Section not found:', projectId);
            return;
        }

        const contentClone = projectInfo.cloneNode(true);
        contentClone.querySelector('.project-details').classList.add('active');

        centralProjectInfo.innerHTML = '';
        centralProjectInfo.appendChild(contentClone);

        setupProjectInfoEvents();
    }

    function setupProjectInfoEvents() {
        const projectTitles = document.querySelectorAll('.project-title');
        const closeButtons = document.querySelectorAll('.close-btn');

        projectTitles.forEach(title => {
            title.addEventListener('click', function (event) {
                document.querySelectorAll('.project-details.active').forEach(detail => {
                    if (detail.id !== this.dataset.project) {
                        detail.classList.remove('active');
                    }
                });

                const details = document.getElementById(this.dataset.project);
                if (details) {
                    details.classList.toggle('active');
                }

                event.stopPropagation();
            });
        });

        closeButtons.forEach(button => {
            button.addEventListener('click', function (event) {
                this.parentElement.classList.remove('active');
                event.stopPropagation();
            });
        });
    }

    document.addEventListener('click', function (event) {
        const isExcluded = excludedSelectors.some(selector =>
            event.target.closest(selector)
        );

        if (!isExcluded) {
            document.querySelectorAll('.project-details.active').forEach(detail => {
                detail.classList.remove('active');
            });
        }
    });

    setupProjectInfoEvents();

    // Initialize outer swiper
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

    // Initialize inner swipers
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

    // Disable all inner swipers initially
    innerSwipers.forEach((swiper) => {
        swiper.disable();
    });

    // Initialize first swiper and load media
    if (innerSwipers.length > 0) {
        innerSwipers[0].enable();
        updateProjectInfo('project-info-0');

        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
            setTimeout(() => {
                console.log('Initial media loading for swiper 0');
                preloadAdjacentSlides(innerSwipers[0], 0);
            }, 100);
        });
    }

    function updateUrlForActiveSlide(activeIndex) {
        const matchingLink = Array.from(projectItems).find(link => {
            const slideId = link.getAttribute('data-slide-id');
            return slideId !== null && parseInt(slideId) === activeIndex;
        });

        if (matchingLink) {
            const href = matchingLink.getAttribute('href');
            if (href && href !== window.location.pathname) {
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

    // Handle outer swiper changes
    outerSwiper.on('slideChange', function () {
        const currentIndex = outerSwiper.activeIndex;

        // Disable other inner swipers
        innerSwipers.forEach((swiper) => {
            swiper.disable();
        });

        // Enable current inner swiper
        innerSwipers[currentIndex].enable();


        updateProjectInfo('project-info-' + currentIndex);
        updateUrlForActiveSlide(currentIndex);
        pauseAllVideos();

        // Load media for current outer slide
        requestAnimationFrame(() => {
            preloadAdjacentSlides(innerSwipers[currentIndex], innerSwipers[currentIndex].activeIndex);
        });

        // Clean up other swipers after delay
        setTimeout(() => {
            innerSwipers.forEach((swiper, index) => {
                if (index !== currentIndex) {
                    unloadDistantSlides(swiper, swiper.activeIndex);
                }
            });
        }, 1000);

        if (!projectItems[currentIndex].parentElement.classList.contains('active')) {
            projectItems.forEach(item => {
                item.parentElement.classList.remove('active');
                item.classList.remove('active');
            });
            projectItems[currentIndex].parentElement.classList.add('active');
            projectItems[currentIndex].classList.add('active');

        }
    });

    // Handle inner swiper changes
    innerSwipers.forEach((swiper, outerIndex) => {
        swiper.on('slideChange', function () {
            const currentInnerIndex = swiper.activeIndex;

            if (outerSwiper.activeIndex === outerIndex) {
                requestAnimationFrame(() => {
                    preloadAdjacentSlides(swiper, currentInnerIndex);
                });

                setTimeout(() => {
                    unloadDistantSlides(swiper, currentInnerIndex);
                }, 1000);
            }
        });
    });

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

    // Handle wheel events for nested navigation
    outerSwiper.on('slideNextTransitionEnd', function () {
        const currentIndex = outerSwiper.activeIndex;
        innerSwipers.forEach((swiper, index) => {
            if (index !== currentIndex) {
                swiper.disable();
            }
        });

        if (innerSwipers[currentIndex].isBeginning)
            innerSwipers[currentIndex].el.addEventListener('wheel', handleWheelPrev, { once: true });

        if (innerSwipers[currentIndex].isEnd)
            innerSwipers[currentIndex].el.addEventListener('wheel', handleWheelNext, { once: true });
    });

    outerSwiper.on('slidePrevTransitionEnd', function () {
        const currentIndex = outerSwiper.activeIndex;
        innerSwipers.forEach((swiper, index) => {
            if (index !== currentIndex) {
                swiper.disable();
            }
        });

        if (innerSwipers[currentIndex].isBeginning)
            innerSwipers[currentIndex].el.addEventListener('wheel', handleWheelPrev, { once: true });

        if (innerSwipers[currentIndex].isEnd)
            innerSwipers[currentIndex].el.addEventListener('wheel', handleWheelNext, { once: true });
    });

    innerSwipers.forEach((swiper) => {
        swiper.on('slideChange', () => {
            swiper.el.removeEventListener('wheel', handleWheelNext);
            swiper.el.removeEventListener('wheel', handleWheelPrev);

            if (swiper.isEnd)
                swiper.el.addEventListener('wheel', handleWheelNext, { once: true });

            if (swiper.isBeginning)
                swiper.el.addEventListener('wheel', handleWheelPrev, { once: true });
        });
    });

    function navigateToSlide(slideId) {
        if (slideId >= 0 && slideId < innerSwipers.length) {
            outerSwiper.slideTo(slideId);
            innerSwipers[slideId].slideTo(0, 0);
        }
    }

    projectItems.forEach(link => {
        link.addEventListener('click', function (e) {
            const slideId = this.getAttribute('data-slide-id');

            // Only prevent default for links WITH data-slide-id (Swiper navigation)
            if (slideId !== null) {
                e.preventDefault(); // Only prevent default for Swiper links

                const slideIndex = parseInt(slideId);
                if (!isNaN(slideIndex)) {
                    navigateToSlide(slideIndex);

                    const href = this.getAttribute('href');
                    history.pushState(null, '', href);
                }
            }
        });
    });

    function handleDirectUrlNavigation() {
        const currentPath = window.location.pathname;
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

    window.addEventListener('popstate', function (e) {
        handleDirectUrlNavigation();
    });
});

