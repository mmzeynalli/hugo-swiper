/* Header project items */
const projectItems = Array.from(document.querySelectorAll('.nested a'));
const sectionLinks = Array.from(document.querySelectorAll('.section-link'));
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

function activateProject(projectId) {
    projectItems.forEach(_item => {
        _item.classList.remove('active');
    });
    projectItems[projectId].classList.add('active');
}

// Lazy loading functions
function getFileExtension(url) {
    return url.split('.').pop().toLowerCase();
}

function isVideoFile(url) {
    const videoExtensions = ['mp4', 'webm', 'ogg', 'avi', 'mov'];
    return videoExtensions.includes(getFileExtension(url));
}

function createMediaElement(mediaSrc, altText = '') {
    if (isVideoFile(mediaSrc)) {
        const video = document.createElement('video');
        video.controls = true;
        video.preload = 'metadata';
        video.src = mediaSrc; // Set src immediately
        return video;
    } else {
        const img = document.createElement('img');
        img.alt = altText;
        img.loading = 'eager'; // Changed from lazy to eager for immediate loading
        img.src = mediaSrc; // Set src immediately
        return img;
    }
}

function loadMediaInSlide(slide) {
    const mediaSrc = slide.dataset.mediaSrc;
    const placeholder = slide.querySelector('.media-placeholder');

    console.log('Loading media:', mediaSrc, 'Placeholder found:', !!placeholder, 'Already loaded:', slide.dataset.loaded);

    if (!mediaSrc || !placeholder || slide.dataset.loaded === 'true') {
        return Promise.resolve();
    }

    // Mark as loading to prevent duplicate attempts
    slide.dataset.loading = 'true';

    // Show loading state
    const loadingSpinner = placeholder.querySelector('.loading-spinner');
    if (loadingSpinner) {
        loadingSpinner.textContent = 'Loading media...';
    }

    return new Promise((resolve, reject) => {
        const mediaElement = createMediaElement(mediaSrc);

        const handleLoad = function () {
            console.log('Media loaded successfully:', mediaSrc);
            if (placeholder && placeholder.parentNode) {
                placeholder.parentNode.replaceChild(mediaElement, placeholder);
                slide.dataset.loaded = 'true';
                slide.dataset.loading = 'false';
            }
            resolve(mediaElement);
        };

        const handleError = function (error) {
            console.error('Failed to load media:', mediaSrc, error);
            if (placeholder) {
                placeholder.innerHTML = '<div class="error-message">Failed to load media</div>';
                slide.dataset.loading = 'false';
            }
            reject(new Error('Failed to load media: ' + mediaSrc));
        };

        if (isVideoFile(mediaSrc)) {
            mediaElement.addEventListener('loadeddata', handleLoad, { once: true });
            mediaElement.addEventListener('error', handleError, { once: true });
            // Video src is already set in createMediaElement
        } else {
            mediaElement.addEventListener('load', handleLoad, { once: true });
            mediaElement.addEventListener('error', handleError, { once: true });
            // Image src is already set in createMediaElement
        }

        // Timeout fallback
        setTimeout(() => {
            if (slide.dataset.loading === 'true') {
                console.warn('Media loading timeout:', mediaSrc);
                handleError(new Error('Loading timeout'));
            }
        }, 10000);
    });
}

function preloadAdjacentSlides(activeSwiper, activeIndex) {
    if (!activeSwiper || !activeSwiper.slides) {
        console.warn('Invalid swiper or slides not found');
        return;
    }

    const slides = activeSwiper.slides;
    const totalSlides = slides.length;

    console.log('Preloading slides around index:', activeIndex, 'Total slides:', totalSlides);

    if (totalSlides === 0) return;

    // Load current slide immediately
    if (slides[activeIndex]) {
        console.log('Loading current slide:', activeIndex);
        loadMediaInSlide(slides[activeIndex]).catch(console.error);
    }

    // Preload adjacent slides
    if (totalSlides > 1) {
        const prevIndex = activeIndex > 0 ? activeIndex - 1 : totalSlides - 1;
        const nextIndex = activeIndex < totalSlides - 1 ? activeIndex + 1 : 0;

        if (slides[prevIndex] && prevIndex !== activeIndex) {
            setTimeout(() => {
                console.log('Loading previous slide:', prevIndex);
                loadMediaInSlide(slides[prevIndex]).catch(console.error);
            }, 200);
        }

        if (slides[nextIndex] && nextIndex !== activeIndex) {
            setTimeout(() => {
                console.log('Loading next slide:', nextIndex);
                loadMediaInSlide(slides[nextIndex]).catch(console.error);
            }, 400);
        }
    }
}

function unloadDistantSlides(activeSwiper, activeIndex) {
    if (!activeSwiper || !activeSwiper.slides) return;

    const slides = activeSwiper.slides;
    const keepRange = 2;

    slides.forEach((slide, index) => {
        const distance = Math.min(
            Math.abs(index - activeIndex),
            slides.length - Math.abs(index - activeIndex)
        );

        if (distance > keepRange && slide.dataset.loaded === 'true') {
            const mediaElement = slide.querySelector('img, video');
            if (mediaElement) {
                const placeholder = document.createElement('div');
                placeholder.className = 'media-placeholder';
                placeholder.innerHTML = '<div class="loading-spinner">Loading...</div>';

                mediaElement.parentNode.replaceChild(placeholder, mediaElement);
                slide.dataset.loaded = 'false';
                slide.dataset.loading = 'false';
                console.log('Unloaded distant slide:', index);
            }
        }
    });
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
        const matchingLink = projectItems.find(link => {
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
        console.log('Outer swiper changed to:', currentIndex);

        // Enable current inner swiper
        innerSwipers[currentIndex].enable();

        // Disable other inner swipers
        innerSwipers.forEach((swiper, index) => {
            if (index !== currentIndex) {
                swiper.disable();
            }
        });

        updateProjectInfo('project-info-' + currentIndex);
        updateActiveProject(currentIndex);
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
    });

    // Handle inner swiper changes
    innerSwipers.forEach((swiper, outerIndex) => {
        swiper.on('slideChange', function () {
            const currentInnerIndex = swiper.activeIndex;
            console.log('Inner swiper', outerIndex, 'changed to slide:', currentInnerIndex);

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
            updateActiveProject(slideId);
        }
    }

    function updateActiveProject(activeIndex) {
        projectItems.forEach(item => {
            item.parentElement.classList.remove('active');
        });
        if (projectItems[activeIndex]) {
            projectItems[activeIndex].parentElement.classList.add('active');
        }
    }

    if (projectItems.length > 0) {
        projectItems[0].parentElement.classList.add('active');
    }

    allLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const slideId = this.getAttribute('data-slide-id');

            if (slideId !== null) {
                e.preventDefault();

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

window.addEventListener('resize', function () {
    const sideHeader = document.getElementById('sideHeader');
    const overlay = document.getElementById('overlay');

    if (sideHeader && overlay && window.innerWidth > 992) {
        sideHeader.classList.remove('active');
        overlay.classList.remove('active');
    }
});