class ABCarousel {
    constructor(element) {
        this.carousel = element;
        this.wrapper = this.carousel.querySelector('.abc-carousel-wrapper');
        this.inner = this.carousel.querySelector('.abc-carousel-inner');
        this.slides = Array.from(this.carousel.querySelectorAll('.abc-slide'));
        this.prevBtn = this.carousel.querySelector('.abc-carousel-prev');
        this.nextBtn = this.carousel.querySelector('.abc-carousel-next');
        
        // Get settings from data attribute
        this.settings = JSON.parse(this.carousel.getAttribute('data-settings'));
        
        // Current state
        this.currentIndex = 0;
        this.isAnimating = false;
        this.autoPlayInterval = null;
        this.touchStartX = 0;
        this.touchEndX = 0;
      // Touch event properties
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.touchMoveX = 0;
        this.isDragging = false;
        this.dragOffset = 0;
        this.velocity = 0;
        this.lastMoveTime = 0;
        
        // Initialize
        this.init();
    }
    
    init() {
        // Set up initial styles
        this.setupSlider();
        
        // Load first image immediately
        this.loadFirstSlide();

       this.optimizeDOM(); 
        
        // Set up lazy loading for other images
        this.lazyLoadImages();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Start autoplay if enabled
        if (this.settings.autoplay) {
            this.startAutoPlay();
        }
    }

    loadFirstSlide() {
        const firstSlideImg = this.slides[0]?.querySelector('img');
        if (firstSlideImg) {
            firstSlideImg.loading = 'eager';
            firstSlideImg.fetchpriority = 'high';
            firstSlideImg.decoding = 'sync';
            firstSlideImg.src = firstSlideImg.dataset.src || firstSlideImg.src;
            firstSlideImg.classList.add('customFade-active');
        }
    }

    // carousel.js - Update lazyLoadImages
// Add this method to your ABCarousel class
lazyLoadImages() {
    const lazyImages = this.carousel.querySelectorAll('.abc-slide-image:not(.abc-first-slide)');
    
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    this.loadImage(img);
                    observer.unobserve(img);
                }
            });
        }, {
            root: this.wrapper,
            rootMargin: '200px 0px', // Load earlier when scrolling down
            threshold: 0.01
        });
        
        lazyImages.forEach(img => observer.observe(img));
    } else {
        // Fallback for older browsers
        lazyImages.forEach(img => this.loadImage(img));
    }
}

// Add this new helper method to the same class
loadImage(img) {
    if (!img.dataset.src) return;
    
    img.src = img.dataset.src;
    img.removeAttribute('data-src');
    
    // Add loaded class for fade-in effect
    img.onload = () => {
        img.classList.add('abc-image-loaded');
    };
}
    
    // carousel.js - Update setupSlider method
setupSlider() {
    const isMobile = window.innerWidth <= 991;
    const slideWidth = isMobile ? '76.92308%' : 'calc(33.333333% - 10px)';

    this.slides.forEach(slide => {
        slide.style.width = slideWidth;
        slide.style.flexShrink = 0;
    });

    // Set initial position
    this.goToSlide(0, false);
}


// Add these new methods before setupEventListeners()
optimizeDOM() {
    // Clone slides for infinite loop instead of creating new elements
    if (this.settings.infinite_loop && this.slides.length > 1) {
        const firstClone = this.slides[0].cloneNode(true);
        const lastClone = this.slides[this.slides.length - 1].cloneNode(true);
        
        this.inner.appendChild(firstClone);
        this.inner.insertBefore(lastClone, this.slides[0]);
        
        // Update slides reference
        this.slides = Array.from(this.inner.querySelectorAll('.abc-slide'));
    }
    
    // Use passive event listeners for better scrolling performance
    this.updateEventListeners();
}

updateEventListeners() {
    // Remove existing listeners first
    this.removeEventListeners();
    
    // Add passive touch listeners
    this.inner.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.inner.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.inner.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
    
    // Add wheel listener with passive
    this.carousel.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
}


Copy
// Add these methods before the final closing brace of ABCarousel class
cleanup() {
    this.pauseAutoPlay();
    this.removeEventListeners();
    window.removeEventListener('resize', this.handleResize);
    
    // Also remove hover listeners if they exist
    if (this.settings.pause_on_hover) {
        this.carousel.removeEventListener('mouseenter', this.pauseAutoPlay);
        this.carousel.removeEventListener('mouseleave', this.resumeAutoPlay);
    }
}



  
removeEventListeners() {
    // Remove all touch listeners
    this.inner.removeEventListener('touchstart', this.handleTouchStart);
    this.inner.removeEventListener('touchmove', this.handleTouchMove);
    this.inner.removeEventListener('touchend', this.handleTouchEnd);
    
    // Remove wheel listener
    this.carousel.removeEventListener('wheel', this.handleWheel);
}

handleWheel(e) {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        this.inner.scrollLeft += e.deltaX;
    }
}


  
    
    setupEventListeners() {
    if (this.prevBtn) {
        this.prevBtn.addEventListener('click', () => this.prevSlide());
    }
    
    if (this.nextBtn) {
        this.nextBtn.addEventListener('click', () => this.nextSlide());
    }
    
    // These are now handled by optimizeDOM/updateEventListeners
    // this.inner.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    // this.inner.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    // this.inner.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
    
    // Pause on hover
    if (this.settings.pause_on_hover) {
        this.carousel.addEventListener('mouseenter', () => this.pauseAutoPlay());
        this.carousel.addEventListener('mouseleave', () => {
            if (this.settings.autoplay) {
                this.resumeAutoPlay();
            }
        });
    }
    
    // Handle resize
    window.addEventListener('resize', () => this.handleResize());
}


handleTouchStart(e) {
        if (this.isAnimating) return;
        
        this.touchStartX = e.touches[0].clientX;
        this.touchMoveX = this.touchStartX;
        this.isDragging = true;
        this.dragOffset = 0;
        this.velocity = 0;
        this.lastMoveTime = Date.now();
        
        // Pause autoplay during interaction
        this.pauseAutoPlay();
        
        // Disable transition while dragging
        this.inner.style.transition = 'none';
    }


handleTouchMove(e) {
        if (!this.isDragging) return;
        
        e.preventDefault(); // Prevent page scroll
        
        const touchX = e.touches[0].clientX;
        const deltaX = touchX - this.touchMoveX;
        
        // Calculate velocity for momentum scrolling
        const now = Date.now();
        const timeDelta = now - this.lastMoveTime;
        if (timeDelta > 0) {
            this.velocity = deltaX / timeDelta;
        }
        this.lastMoveTime = now;
        
        this.touchMoveX = touchX;
        this.dragOffset += deltaX;
        
        // Apply the drag offset to the carousel
        const currentPosition = this.getCurrentTranslateX();
        this.inner.style.transform = `translateX(${currentPosition + deltaX}px)`;
    }

 handleTouchEnd(e) {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        this.touchEndX = e.changedTouches[0].clientX;
        
        // Determine if it was a swipe or tap
        const swipeDistance = this.touchEndX - this.touchStartX;
        const swipeThreshold = 50; // Minimum distance to consider it a swipe
        
        // Re-enable transitions
        this.inner.style.transition = '';
        
        // Handle swipe based on velocity and distance
        if (Math.abs(swipeDistance) > swipeThreshold || Math.abs(this.velocity) > 0.3) {
            if (swipeDistance > 0 || this.velocity > 0) {
                this.prevSlide();
            } else {
                this.nextSlide();
            }
        } else {
            // If not a significant swipe, return to current position
            this.goToSlide(this.currentIndex);
        }
        
        // Resume autoplay if enabled
        if (this.settings.autoplay) {
            this.resumeAutoPlay();
        }
    }
    
    getCurrentTranslateX() {
        const style = window.getComputedStyle(this.inner);
        const matrix = new DOMMatrix(style.transform);
        return matrix.m41; // Returns the X translation
    }
  
  









  
    
   handleResize() {
    this.setupSlider();
    this.goToSlide(this.currentIndex, false);
    
    // Re-optimize DOM on resize
    this.optimizeDOM();
    
    // Reset autoplay
    if (this.settings.autoplay) {
        this.pauseAutoPlay();
        this.startAutoPlay();
    }
}
    
    goToSlide(index, animate = true) {
    if (this.isAnimating) return;
    
    const totalSlides = this.slides.length;
    
    // Handle infinite loop
    if (this.settings.infinite_loop) {
        if (index < 0) index = totalSlides - 1;
        if (index >= totalSlides) index = 0;
    } else {
        if (index < 0) index = 0;
        if (index >= totalSlides) index = totalSlides - 1;
    }
    
    this.currentIndex = index;
    
    // Calculate translation with peek effect
    const slide = this.slides[index];
    const slideWidth = slide.offsetWidth;
    const wrapperWidth = this.wrapper.offsetWidth;
    const peekAmount = 15; // Amount of next slide to show (matches padding)
    const translation = -(index * (slideWidth + 8)) + peekAmount;
    
    // Apply transition
    this.inner.style.transform = `translateX(${translation}px)`;
        
    // Reset transition after animation
    if (animate) {
        this.isAnimating = true;
        setTimeout(() => {
            this.isAnimating = false;
            this.inner.style.transition = '';
        }, 200);
    }
}
    
    nextSlide() {
        this.goToSlide(this.currentIndex + 1);
    }
    
    prevSlide() {
        this.goToSlide(this.currentIndex - 1);
    }
    
    startAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
        }
        
        this.autoPlayInterval = setInterval(() => {
            this.nextSlide();
        }, this.settings.autoplay_speed);
    }
    
    pauseAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }
    
    resumeAutoPlay() {
        if (!this.autoPlayInterval && this.settings.autoplay) {
            this.startAutoPlay();
        }
    }
}

// Update initialization
document.addEventListener('DOMContentLoaded', () => {
    const carousels = document.querySelectorAll('.abc-banner-carousel');
    window.abcCarousels = []; // Store instances for cleanup
    
    carousels.forEach(carousel => {
        window.abcCarousels.push(new ABCarousel(carousel));
    });
    
    // Cleanup when navigating away (for SPAs)
    document.addEventListener('turbolinks:before-cache', () => {
        window.abcCarousels.forEach(carousel => carousel.cleanup());
    });
});