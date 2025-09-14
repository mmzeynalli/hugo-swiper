document.addEventListener('DOMContentLoaded', function () {
    // Get all clickable links in the menu
    const menuLinks = document.querySelectorAll('.section-link, .nested a');

    function setActiveMenuItem(clickedLink) {
        // Remove active class from all menu items and their parent li elements
        menuLinks.forEach(link => {
            link.classList.remove('active');
            link.closest('li').classList.remove('active');
        });

        // Add active class to clicked link and its immediate parent li
        clickedLink.classList.add('active');
        clickedLink.closest('li').classList.add('active');

        // Special handling based on link type
        if (clickedLink.classList.contains('section-link')) {
            // This is a section link - DON'T mark nested items as active
            // Only the section link itself should be active

            // Remove active from any nested items in this section
            const parentLi = clickedLink.closest('li');
            const nestedLinks = parentLi.querySelectorAll('.nested a');
            const nestedLis = parentLi.querySelectorAll('.nested');

            nestedLinks.forEach(link => link.classList.remove('active'));
            nestedLis.forEach(li => li.classList.remove('active'));

        } else if (clickedLink.closest('.nested')) {
            // This is a nested link - also mark the parent section as active
            const parentSectionLink = clickedLink.closest('ul').previousElementSibling;
            if (parentSectionLink && parentSectionLink.classList.contains('section-link')) {
                parentSectionLink.classList.add('active');
                parentSectionLink.closest('li').classList.add('active');
            }
        }
    }

    // Add click event listeners to all menu links
    menuLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            // Set this link as active
            setActiveMenuItem(this);
        });
    });

    // Set initial active state based on current URL on page load
    function setInitialActiveState() {
        const currentPath = window.location.pathname;
        const matchingLink = Array.from(menuLinks).find(link =>
            link.getAttribute('href') === currentPath
        );

        if (matchingLink) {
            setActiveMenuItem(matchingLink);
        } else {
            // Default to first item if no match found
            if (menuLinks.length > 0) {
                setActiveMenuItem(menuLinks); // Fixed: was menuLinks instead of menuLinks
            }
        }
    }

    // Set initial active state
    setInitialActiveState();

    // Handle browser back/forward buttons
    window.addEventListener('popstate', function () {
        setInitialActiveState();
    });
});
