export class Settings {
  constructor(options = {
    fontSize: 100,
    wpm: 200,
    chunkSize: 9,
    contrast: 50,
  }) {
    this.fontSize = this.setItem('setting-font-size', this.getItem('setting-font-size') ?? fontSize);
    this.wpm = this.setItem('setting-wpm', this.getItem('setting-wpm') ?? wpm);
    this.chunkSize = this.setItem('setting-chunk-size', this.getItem('setting-chunk-size') ?? chunkSize);
    this.contrast = this.setItem('setting-contrast', this.getItem('setting-contrast') ?? contrast);
  }

  getItem(name) {
    return window.localStorage.getItem(name);
  }

  setItem(name, value) {
    window.localStorage.setItem(name, value);
    return value;
  }

  setFontSize(fontSize) {
    this.fontSize = fontSize;
    this.setItem('setting-font-size', fontSize);
  }

  setWpm(wpm) {
    this.wpm = wpm;
    this.setItem('setting-wpm', wpm);
  }

  setChunkSize(chunkSize) {
    this.chunkSize= chunkSize;
    this.setItem('setting-chunk-size', chunkSize);
  }

  setContrast(contrast) {
    this.contrast = contrast;
    this.setItem('setting-contrast', contrast);
  }
}


export class Reader {
  constructor(contentEl, text, settings) {
    this.contentEl = contentEl;
    this.contentEl.innerHTML = '';

    this.text = text;
    this.settings = settings;

    this.isPaused = true;
    this.curIndex = 0;

    const {ps, spans} = this.processArticle(text);
    this.spans = spans;
    this.wordCount = spans.length;
    ps.forEach(p => contentEl.appendChild(p));
    this.totalCharCount = 0;
    for (let span of spans) {
      span.span.classList.add('isUnread');
      span.setFrame(contentEl);
      this.totalCharCount += span.charCount();
    };
  }

  createSpan(text, id) {
    let span = document.createElement('span');
    span.textContent = text;
    return span;
  }

  processArticle(text) {
    const paragraphs = text.split(/\n\n+/);
    const words = paragraphs.map(p => p.split(/\s+/));
    const spans = words.map(paragraph => paragraph.map(word => this.createSpan(word)));
    const ps = spans.map(paragraph => {
      const p = document.createElement('p');
      for (let i = 0; i < paragraph.length; ++i) {
        if (i > 0) {
          p.appendChild(document.createTextNode(' '));
        }
        p.appendChild(paragraph[i]);
      }
      return p;
    });
    const flattenedSpans = spans.flatMap(s => s);
    let newSpans = [];
    for (let i = 0; i < flattenedSpans.length; ++i) {
      const s = flattenedSpans[i];
      // s.setAttribute('id', 'word_' + i);
      s.addEventListener('click', () => {
        this.pause();
        this.curIndex = i+1;
        this.markSpanRead(i);
      });
      newSpans.push(new Span(s, i, s.innerText));
    }
    return {
      ps: ps,
      spans: newSpans,
    };
  }

  calculateChunkTimeout(chunkCharCount, totalCharCount, wordCount, wpm) {
    const totalMillis = wordCount / wpm * 60 * 1000;
    const millisPerChar = totalMillis / totalCharCount;
    const charMillis = chunkCharCount * millisPerChar;
    return charMillis;
  }

  // return endIndex (endIndex is not inclusive)
  getNextChunkInfo(chunkSize) {
    let i = this.curIndex;
    let charCount = this.spans[i].charCount();
    // if the first word is longer than the chunkSize, it should still take care of this case
    let origY = this.spans[i].getY();
    for (i += 1; i < this.spans.length; ++i) {
      if (this.spans[i].getY() != origY) {
        break;
      }
      charCount += this.spans[i].charCount();
      if (charCount > chunkSize) {
        // adjust so i can return the proper size
        charCount -= this.spans[i].charCount();
        break;
      }
    }
    return {
      endIndex: i,
      charCount: charCount,
    };
  }

  timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  markSpanUnread(i) {
    this.spans[i].span.classList.remove('isRead');
    this.spans[i].span.classList.add('isUnread');
  }

  markSpanRead(i) {
    this.spans[i].span.classList.remove('isUnread');
    this.spans[i].span.classList.add('isRead');
  }

  async start() {
    this.isPaused = false;
    while (!this.isPaused && this.curIndex < this.spans.length) {
      const {endIndex, charCount} = this.getNextChunkInfo(this.settings.chunkSize);
      for (let i = this.curIndex; i < endIndex; ++i) {
        this.markSpanRead(i);
      }
      await this.timeout(this.calculateChunkTimeout(charCount, this.totalCharCount, this.wordCount, this.settings.wpm));
      this.curIndex = endIndex;
    }
  }

  pause() {
    this.isPaused = true;
  }
}


export class Span {
  constructor(span, index, text) {
    this.span = span;
    this.index = index;
    this.text = text;
  }

  getRelativePos(top, child) {
    let loc1 = top.getBoundingClientRect();
    let loc2 = child.getBoundingClientRect();
    return {
      x: loc1.top - loc2.left, 
      y: loc1.top - loc2.top,
    }
  }

  getRelativeLoc(parent) {
    return this.getRelativePos(parent, this.span);
  }

  setFrame(frame) {
    this.frame = frame;
  }

  getLoc() {
    return this.getRelativeLoc(this.frame);
  }

  getX() {
    const {x, y} = this.getLoc();
    return x;
  }

  getY() {
    const {x, y} = this.getLoc();
    return y;
  }

  charCount() {
    return this.text.length;
  }
}
