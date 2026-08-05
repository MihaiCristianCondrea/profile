function initGallery(page: HTMLElement): void {
  const track = page.querySelector<HTMLElement>('#smartCleanerGalleryTrack');
  const dotsContainer = page.querySelector<HTMLElement>('#smartCleanerGalleryDots');
  if (!track || !dotsContainer) return;

  const slides = Array.from(track.querySelectorAll<HTMLElement>('.smart-cleaner-shot'));
  if (!slides.length) return;

  const updateActive = (activeIndex: number): void => {
    slides.forEach((slide, index) => slide.classList.toggle('is-featured', index === activeIndex));
    Array.from(dotsContainer.children).forEach((dot, index) => {
      dot.classList.toggle('is-active', index === activeIndex);
      dot.toggleAttribute('aria-current', index === activeIndex);
      if (index === activeIndex) dot.setAttribute('aria-current', 'true');
    });
  };

  const dots = slides.map((slide, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `Show screenshot ${index + 1}`);
    dot.addEventListener('click', () => {
      slide.scrollIntoView({ inline: 'center', block: 'nearest' });
      updateActive(index);
    });
    return dot;
  });
  dotsContainer.replaceChildren(...dots);
  updateActive(0);

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const index = slides.indexOf(entry.target as HTMLElement);
        if (index >= 0) updateActive(index);
      });
    }, { root: track, threshold: 0.64 });
    slides.forEach((slide) => observer.observe(slide));
  }
}

export function initSmartCleanerPage(): void {
  const page = document.getElementById('smartCleanerPageContainer');
  if (!page) return;
  initGallery(page);
}
