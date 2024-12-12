async function getIndex(url) {
  let indexes = [];
  try {
    const res = await fetch(url);
    const json = await res.json();
    indexes = json.data;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err.message, err);
  }
  return indexes;
}

function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';

  card.innerHTML = `
    <div class="product-image">
      <img src="${product.image}" alt="${product.title}">
    </div>
    <div class="product-info">
      <p class="product-title">${product.title}</p>
      <p class='product-price'>$ 74.40</p>
      <div class="product-actions">
        <a href="${product.path}" class="view-details">View Details</a>
        <button class="like-button" aria-label="Add to favorites">
          <svg class="heart-icon" viewBox="0 0 24 24" width="24" height="24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>
      </div>
    </div>
  `;

  return card;
}

function updateActiveSlide(slide) {
  const block = slide.closest('.product-carousel');
  const slideIndex = parseInt(slide.dataset.slideIndex, 10);
  block.dataset.activeSlide = slideIndex;

  const slides = block.querySelectorAll('.carousel-slide');
  const indicators = block.querySelectorAll('.carousel-slide-indicator');

  slides.forEach((aSlide, idx) => {
    aSlide.setAttribute('aria-hidden', idx !== slideIndex);
  });

  indicators.forEach((indicator, idx) => {
    const button = indicator.querySelector('button');
    if (idx === slideIndex) {
      button.setAttribute('disabled', 'true');
    } else {
      button.removeAttribute('disabled');
    }
  });
}

function showSlide(block, slideIndex = 0) {
  const slides = block.querySelectorAll('.carousel-slide');
  let realSlideIndex = slideIndex < 0 ? slides.length - 1 : slideIndex;
  if (slideIndex >= slides.length) realSlideIndex = 0;

  block.querySelector('.carousel-slides').scrollTo({
    top: 0,
    left: slides[realSlideIndex].offsetLeft,
    behavior: 'smooth',
  });
}

function createSlide(products, slideIndex, carouselId) {
  const slide = document.createElement('li');
  slide.dataset.slideIndex = slideIndex;
  slide.setAttribute('id', `carousel-${carouselId}-slide-${slideIndex}`);
  slide.classList.add('carousel-slide');

  products.forEach((product) => {
    slide.append(createProductCard(product));
  });

  return slide;
}

function bindEvents(block) {
  // Like button functionality
  block.addEventListener('click', (e) => {
    if (e.target.closest('.like-button')) {
      e.target.closest('.like-button').classList.toggle('active');
    }
  });

  // Carousel navigation
  const slideIndicators = block.querySelector('.carousel-slide-indicators');
  if (!slideIndicators) return;

  slideIndicators.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', (e) => {
      const slideIndicator = e.currentTarget.parentElement;
      showSlide(block, parseInt(slideIndicator.dataset.targetSlide, 10));
    });
  });

  block.querySelector('.slide-prev').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide, 10) - 1);
  });
  block.querySelector('.slide-next').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide, 10) + 1);
  });

  const slideObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) updateActiveSlide(entry.target);
    });
  }, { threshold: 0.5 });

  block.querySelectorAll('.carousel-slide').forEach((slide) => {
    slideObserver.observe(slide);
  });
}

function chunkArray(arr, chunkSize) {
  const result = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    result.push(arr.slice(i, i + chunkSize));
  }
  return result;
}

export default async function decorate(block) {
  // Extract URL from the button container and then remove it
  const buttonContainer = block.querySelector('.button-container');
  const linkURL = buttonContainer?.querySelector('a')?.href;

  // Remove the entire div containing the button container
  const authoredContent = buttonContainer?.closest('div');
  if (authoredContent) {
    authoredContent.remove();
  }

  if (!linkURL) {
    // eslint-disable-next-line no-console
    console.error('No JSON URL found in the block');
    return;
  }

  const paths = await getIndex(linkURL);
  const products = paths.filter((item) => item.template === 'product');

  const PRODUCTS_PER_SLIDE = 5;
  const productSlides = chunkArray(products, PRODUCTS_PER_SLIDE);
  const isSingleSlide = productSlides.length < 2;

  block.classList.add('product-carousel');
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Product Carousel');

  const container = document.createElement('div');
  container.classList.add('carousel-slides-container');

  const slidesWrapper = document.createElement('ul');
  slidesWrapper.classList.add('carousel-slides');
  container.append(slidesWrapper);

  let slideIndicators;
  if (!isSingleSlide) {
    const slideIndicatorsNav = document.createElement('nav');
    slideIndicatorsNav.setAttribute('aria-label', 'Carousel Slide Controls');
    slideIndicators = document.createElement('ol');
    slideIndicators.classList.add('carousel-slide-indicators');
    slideIndicatorsNav.append(slideIndicators);
    block.append(slideIndicatorsNav);

    const slideNavButtons = document.createElement('div');
    slideNavButtons.classList.add('carousel-navigation-buttons');
    slideNavButtons.innerHTML = `
      <button type="button" class="slide-prev" aria-label="Previous Slide"></button>
      <button type="button" class="slide-next" aria-label="Next Slide"></button>
    `;
    container.append(slideNavButtons);
  }

  productSlides.forEach((slideProducts, idx) => {
    const slide = createSlide(slideProducts, idx, block.id);
    slidesWrapper.append(slide);

    if (slideIndicators) {
      const indicator = document.createElement('li');
      indicator.classList.add('carousel-slide-indicator');
      indicator.dataset.targetSlide = idx;
      indicator.innerHTML = `<button type="button" aria-label="Show Slide ${idx + 1} of ${productSlides.length}"></button>`;
      slideIndicators.append(indicator);
    }
  });

  block.prepend(container);

  if (!isSingleSlide) {
    bindEvents(block);
  }
}
