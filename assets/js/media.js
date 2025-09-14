import { isIOSSafari, isOpera, isOperaGX, isVideoFile } from './helper.js';

export function createMediaElement(mediaSrc, altText = '') {
    if (isVideoFile(mediaSrc)) {
        const video = document.createElement('video');
        video.controls = true;
        video.muted = true;
        video.playsinline = true;
        video.preload = 'metadata';
        video.crossOrigin = 'anonymous';
        video.src = mediaSrc;

        // Opera-specific attributes
        if (isOpera() || isOperaGX()) {
            // Opera works better with explicit width/height
            video.style.width = '100%';
            video.style.height = 'auto';
            // Opera prefers 'none' preload for dynamic elements
            video.preload = 'none';
            // Add poster frame for Opera compatibility
            video.poster = '';
        }

        // iOS Safari-specific
        if (isIOSSafari()) {
            video.src += '#t=0.001';
        }

        return video;
    } else {
        const img = document.createElement('img');
        img.alt = altText;
        img.loading = 'eager';
        img.src = mediaSrc;
        return img;
    }
}


export function unloadDistantSlides(activeSwiper, activeIndex) {
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


function loadMediaInSlide(slide) {
    const mediaSrc = slide.dataset.mediaSrc;
    const placeholder = slide.querySelector('.media-placeholder');

    if (!mediaSrc || !placeholder || slide.dataset.loaded === 'true') {
        return Promise.resolve();
    }

    slide.dataset.loading = 'true';

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
            // Different event handling for Opera
            if (isOpera() || isOperaGX()) {
                // Opera needs explicit load() call and canplay event
                mediaElement.addEventListener('canplay', handleLoad, { once: true });
                mediaElement.addEventListener('error', handleError, { once: true });

                // Force load for Opera
                setTimeout(() => {
                    try {
                        mediaElement.load();
                    } catch (e) {
                        console.warn('Opera load() failed:', e);
                        handleError(e);
                    }
                }, 100);
            } else if (isIOSSafari()) {
                mediaElement.addEventListener('loadedmetadata', handleLoad, { once: true });
                mediaElement.addEventListener('error', handleError, { once: true });
                mediaElement.load();
            } else {
                mediaElement.addEventListener('loadeddata', handleLoad, { once: true });
                mediaElement.addEventListener('error', handleError, { once: true });
            }
        } else {
            mediaElement.addEventListener('load', handleLoad, { once: true });
            mediaElement.addEventListener('error', handleError, { once: true });
        }

        // Longer timeout for Opera
        const timeout = isOpera() || isOperaGX() ? 20000 : (isIOSSafari() ? 15000 : 10000);
        setTimeout(() => {
            if (slide.dataset.loading === 'true') {
                console.warn('Media loading timeout:', mediaSrc);
                handleError(new Error('Loading timeout'));
            }
        }, timeout);
    });
}


export function preloadAdjacentSlides(activeSwiper, activeIndex) {
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
