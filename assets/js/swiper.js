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

        // Clone the content to display
        const contentClone = projectInfo.cloneNode(true);

        // Update the central project info
        centralProjectInfo.innerHTML = '';
        centralProjectInfo.appendChild(contentClone);

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
        if (!event.target.closest('.project-info-container')) {
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

    // Update project info when outer swiper changes
    outerSwiper.on('slideChange', function () {
        innerSwipers[outerSwiper.activeIndex].enable();
        updateProjectInfo('project-info-' + outerSwiper.activeIndex);
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
    innerSwipers[0].enable();

    // Set initial project info
    updateProjectInfo('project-info-0');
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


    /* Header project items */
    const projectItems = document.querySelectorAll('.nested');
    projectItems[0].classList.add('active');

    for (const [i, item] of projectItems.entries()) {
        item.addEventListener('click', function () {
            outerSwiper.slideTo(0);

            for (let j = 0; j < i; j++) {
                outerSwiper.slideNext();
            }

            innerSwipers[i].slideTo(0, 0);

            projectItems.forEach(_item => {
                _item.classList.remove('active');
            });
            item.classList.add('active');
        })
    }

});

// Handle resize for responsive menu
window.addEventListener('resize', function () {
    if (window.innerWidth > 992) {
        sideHeader.classList.remove('active');
        overlay.classList.remove('active');
    }
});