
// Lazy loading functions
function getFileExtension(url) {
    return url.split('.').pop().toLowerCase();
}

export function isIOSSafari() {
    const ua = navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua);
    const webkit = /WebKit/.test(ua);
    const chrome = /CriOS/.test(ua);
    return iOS && webkit && !chrome;
}

export function isOpera() {
    const ua = navigator.userAgent;
    return ua.indexOf('OPR') > -1 || ua.indexOf('Opera') > -1;
}

export function isOperaGX() {
    const ua = navigator.userAgent;
    return ua.indexOf('OPRGX') > -1;
}


export function isVideoFile(url) {
    const videoExtensions = ['mp4', 'webm', 'ogg', 'avi', 'mov'];
    return videoExtensions.includes(getFileExtension(url));
}
