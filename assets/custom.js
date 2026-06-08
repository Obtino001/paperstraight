/* ----------------------------------------------------------------------------
 * Product-card color swatches: collapse to "+N" when they overflow.
 * Extracted from snippets/product-card.liquid so it only loads once per page
 * instead of once per product (which used to install N MutationObservers and
 * lock the main thread on large collection pages).
 * -------------------------------------------------------------------------- */

(function () {
  var GAP = 4;
  var MIN_FOR_COLLAPSE = 4;

  function applySwatchVisibility(colorContainer) {
    if (!colorContainer) return;
    if (colorContainer.dataset.expanded === 'true') return;
    if (colorContainer.dataset.swatchProcessed === 'true') return;
    var moreCount = colorContainer.querySelector('.variant-more-count');
    var remainingCountEl = colorContainer.querySelector('.remaining-count');
    var swatches = Array.from(colorContainer.querySelectorAll('.swatch-wrapper'));
    var totalColors = swatches.length;

    if (totalColors <= 1) {
      if (moreCount) moreCount.style.display = 'none';
      colorContainer.dataset.swatchProcessed = 'true';
      return;
    }

    swatches.forEach(function (swatch) { swatch.classList.remove('is-hidden'); });
    if (moreCount) moreCount.style.display = 'none';

    if (totalColors <= MIN_FOR_COLLAPSE) {
      colorContainer.dataset.swatchProcessed = 'true';
      return;
    }

    var containerWidth = colorContainer.offsetWidth;
    if (containerWidth <= 0) {
      swatches.forEach(function (swatch, index) {
        if (index >= MIN_FOR_COLLAPSE) swatch.classList.add('is-hidden');
      });
      if (moreCount && remainingCountEl) {
        remainingCountEl.textContent = totalColors - MIN_FOR_COLLAPSE;
        moreCount.style.display = 'inline-flex';
      }
      colorContainer.dataset.swatchProcessed = 'true';
      return;
    }

    var SWATCH_SIZE = swatches[0] ? swatches[0].offsetWidth : 38;
    if (SWATCH_SIZE <= 0) SWATCH_SIZE = 38;

    var swatchGap = 8;
    var totalWidthNeeded = (totalColors * SWATCH_SIZE) + ((totalColors - 1) * swatchGap);

    if (totalWidthNeeded <= containerWidth) {
      colorContainer.dataset.swatchProcessed = 'true';
      return;
    }

    var BUTTON_SIZE = 36;
    if (moreCount) {
      moreCount.style.display = 'inline-flex';
      moreCount.style.visibility = 'hidden';
      BUTTON_SIZE = moreCount.offsetWidth || 36;
      moreCount.style.display = 'none';
      moreCount.style.visibility = '';
    }

    var availableForSwatches = containerWidth - BUTTON_SIZE - swatchGap;
    var maxSwatches = Math.floor((availableForSwatches + swatchGap) / (SWATCH_SIZE + swatchGap));
    maxSwatches = Math.max(1, maxSwatches);

    var hiddenCount = totalColors - maxSwatches;
    if (hiddenCount > 0) {
      swatches.forEach(function (swatch, index) {
        if (index >= maxSwatches) swatch.classList.add('is-hidden');
      });
      if (moreCount && remainingCountEl) {
        remainingCountEl.textContent = hiddenCount;
        moreCount.style.display = 'inline-flex';
      }
    }

    colorContainer.dataset.swatchProcessed = 'true';
  }

  function applyFieldsetSwatchVisibility(fieldset) {
    if (!fieldset) return;
    if (fieldset.dataset.expanded === 'true') return;
    if (fieldset.dataset.swatchProcessed === 'true') return;

    fieldset.classList.remove('swatch-input-wrapper', 'is-hidden');

    var swatchWrappers = Array.from(fieldset.querySelectorAll(':scope > .swatch-input-wrapper'));

    if (swatchWrappers.length === 0) {
      var allInputs = Array.from(fieldset.querySelectorAll('input[type="radio"]'));
      allInputs.forEach(function (input) {
        var label = fieldset.querySelector('label[for="' + input.id + '"]');
        if (label && label.classList.contains('thumbnail-swatch')) {
          var wrapper = input.parentElement;
          if (wrapper === fieldset) {
            var newWrapper = document.createElement('span');
            newWrapper.className = 'swatch-input-wrapper';
            fieldset.insertBefore(newWrapper, input);
            newWrapper.appendChild(input);
            newWrapper.appendChild(label);
            wrapper = newWrapper;
          } else if (!wrapper.classList.contains('swatch-input-wrapper')) {
            wrapper.classList.add('swatch-input-wrapper');
          }
          swatchWrappers.push(wrapper);
        }
      });
    }

    swatchWrappers.forEach(function (wrapper) { wrapper.classList.remove('is-hidden'); });

    var totalColors = swatchWrappers.length;

    if (totalColors <= MIN_FOR_COLLAPSE) {
      fieldset.dataset.swatchProcessed = 'true';
      return;
    }

    var moreCount = fieldset.querySelector(':scope > .variant-more-count');
    if (!moreCount) {
      moreCount = document.createElement('span');
      moreCount.className = 'variant-more-count';
      moreCount.innerHTML = '+<span class="remaining-count">0</span>';
      fieldset.appendChild(moreCount);
    }
    moreCount.style.display = 'none';
    var remainingCountEl = moreCount.querySelector('.remaining-count');

    var productCard = fieldset.closest('product-card') || fieldset.closest('.product-card');
    var containerWidth = productCard ? productCard.offsetWidth : fieldset.offsetWidth;
    if (containerWidth <= 0) containerWidth = 250;

    var SWATCH_SIZE = 38;
    if (swatchWrappers[0]) {
      var firstSwatchWidth = swatchWrappers[0].offsetWidth;
      if (firstSwatchWidth > 0) SWATCH_SIZE = firstSwatchWidth;
    }

    var totalWidthNeeded = (totalColors * SWATCH_SIZE) + ((totalColors - 1) * GAP);
    if (totalWidthNeeded <= containerWidth) {
      fieldset.dataset.swatchProcessed = 'true';
      return;
    }

    var BUTTON_SIZE = 36;
    var availableForSwatches = containerWidth - BUTTON_SIZE - GAP;
    var maxSwatches = Math.floor((availableForSwatches + GAP) / (SWATCH_SIZE + GAP));
    maxSwatches = Math.max(1, Math.min(maxSwatches, totalColors - 1));

    var hiddenCount = totalColors - maxSwatches;
    if (hiddenCount > 0) {
      swatchWrappers.forEach(function (wrapper, index) {
        if (index >= maxSwatches) wrapper.classList.add('is-hidden');
      });
      remainingCountEl.textContent = hiddenCount;
      moreCount.style.display = 'inline-flex';
    }

    fieldset.dataset.swatchProcessed = 'true';
  }

  /**
   * Performance-optimized Swatch Processing
   * Uses IntersectionObserver to only process swatches when visible
   * and batches measurements to prevent layout thrashing.
   */
  var swatchIntersectionObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        var el = entry.target;
        if (el.classList.contains('color-swatches-container')) {
          applySwatchVisibility(el);
        } else if (el.classList.contains('color-swatch-fieldset')) {
          applyFieldsetSwatchVisibility(el);
        }
        swatchIntersectionObserver.unobserve(el);
      }
    });
  }, { rootMargin: '100px' });

  function processAllContainers() {
    var metafieldContainers = document.querySelectorAll('.color-swatches-container:not([data-swatch-processed="true"])');
    metafieldContainers.forEach(function(el) { swatchIntersectionObserver.observe(el); });

    var fieldsets = document.querySelectorAll('.color-swatch-fieldset:not([data-swatch-processed="true"])');
    fieldsets.forEach(function(el) { swatchIntersectionObserver.observe(el); });
  }

  var _swatchProcessTimer = null;
  function debouncedProcessAllContainers() {
    if (_swatchProcessTimer) cancelAnimationFrame(_swatchProcessTimer);
    _swatchProcessTimer = requestAnimationFrame(processAllContainers);
  }

  document.addEventListener('click', function (e) {
    var moreCount = e.target.closest('.variant-more-count');
    if (!moreCount) return;

    e.preventDefault();
    e.stopPropagation();

    var colorContainer = moreCount.closest('.color-swatches-container');
    if (colorContainer) {
      colorContainer.dataset.expanded = 'true';
      colorContainer.dataset.swatchProcessed = 'true';
      colorContainer.querySelectorAll('.swatch-wrapper').forEach(function (swatch) {
        swatch.classList.remove('is-hidden');
      });
      moreCount.style.display = 'none';
      return;
    }

    var fieldset = moreCount.closest('.color-swatch-fieldset');
    if (fieldset) {
      fieldset.dataset.expanded = 'true';
      fieldset.dataset.swatchProcessed = 'true';
      fieldset.querySelectorAll('.swatch-input-wrapper').forEach(function (wrapper) {
        wrapper.classList.remove('is-hidden');
      });
      moreCount.style.display = 'none';
    }
  });

  function init() { 
    processAllContainers(); 
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  var swatchObserver = new MutationObserver(function (mutations) {
    var shouldProcess = false;
    for (var i = 0; i < mutations.length; i++) {
      var mutation = mutations[i];
      if (mutations[i].addedNodes.length > 0) {
        shouldProcess = true;
        break;
      }
    }
    if (shouldProcess) debouncedProcessAllContainers();
  });

  function attachSwatchObservers() {
    var targets = document.querySelectorAll('.collection, .predictive-search, [data-product-list], product-list, .product-list, .featured-collection');
    targets.forEach(function (target) {
      swatchObserver.observe(target, { childList: true, subtree: true });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachSwatchObservers);
  } else {
    attachSwatchObservers();
  }

  window.addEventListener('resize', function () {
    // On resize, we need to re-evaluate visible ones
    document.querySelectorAll('[data-swatch-processed="true"]').forEach(function (el) {
      if (el.dataset.expanded !== 'true') {
        el.dataset.swatchProcessed = 'false';
      }
    });
    debouncedProcessAllContainers();
  });

  document.addEventListener('shopify:section:load', debouncedProcessAllContainers);
  window.processColorSwatches = processAllContainers;
})();
