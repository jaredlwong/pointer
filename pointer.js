import * as objects from "./objects.js";

let reader;
const settings = new objects.Settings();

async function init() {
  const textEl = document.querySelector('#original');
  reader = new objects.Reader(document.querySelector('#content'), textEl.value, settings);
}

function setupSpacebar() {
  // event = keyup or keydown
  document.addEventListener('keydown', event => {
    // space
    if (event.which === 32 && event.target == document.body) {
      event.preventDefault();
      if (reader && !reader.isPaused) {
        reader.pause();
      }
    }
  });
  document.addEventListener('keyup', async event => {
    // space
    if (event.which === 32 && event.target == document.body) {
      event.preventDefault();
      if (reader && reader.isPaused) {
        await reader.start();
      }
    }
  });
}

function renderFontSize() {
  const baseSize = 16;
  const pixelSize = baseSize * settings.fontSize / 100;
  document.documentElement.style.setProperty('--setting-font-size', pixelSize + 'px');
}

function setupFontSize() {
  renderFontSize();
  const el = document.querySelector("#setting-font-size");
  el.value = settings.fontSize;
  el.dispatchEvent(new Event('input'));
  el.addEventListener('input', () => {
    settings.setFontSize(el.value);
    renderFontSize();
  });
}

function setupWpm() {
  const el = document.querySelector("#setting-wpm");
  el.value = settings.wpm;
  el.dispatchEvent(new Event('input'));
  el.addEventListener('input', () => settings.setWpm(el.value));
}

function setupChunkSize() {
  const el = document.querySelector("#setting-chunk-size");
  el.value = settings.chunkSize;
  el.dispatchEvent(new Event('input'));
  el.addEventListener('input', () => settings.setChunkSize(el.value));
}

function setupContrast() {
  const el = document.querySelector("#setting-contrast");
  el.value = settings.contrast;
  el.dispatchEvent(new Event('input'));
  el.addEventListener('input', () => settings.setContrast(el.value));
}

function rangeSlider() {
  const sliders = document.querySelectorAll('.range-slider');
  const ranges = document.querySelectorAll('.range-slider__range');
  const values = document.querySelectorAll('.range-slider__value');

  for (const slider of sliders) {
    const value = slider.querySelector('.range-slider__value');
    const range = slider.querySelector('.range-slider__range');
    value.innerHTML = range.value;
    range.addEventListener('input', function(e) {
      value.innerHTML = range.value;  // e.target.value;
    });
  }
}

window.addEventListener('load', function() {
  rangeSlider();
  setupFontSize();
  setupWpm();
  setupChunkSize();
  setupContrast();
  setupSpacebar();

  document.querySelector("#init").addEventListener('click', async function() {
    init();
  });
  document.querySelector("#start").addEventListener('click', async function() {
    await reader.start();
  });
  document.querySelector("#pause").addEventListener('click', () => reader.pause());
});
