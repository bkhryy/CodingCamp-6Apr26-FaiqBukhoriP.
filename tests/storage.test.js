// Feature: local-storage-web-app
// Tests for storage module — Requirements 6.4, 6.5

import { describe, it, expect, vi } from 'vitest';

/**
 * Testable factory version of the storage module.
 * Mirrors the IIFE in js/app.js but returns a fresh instance each call,
 * allowing bannerShown state to be reset between tests.
 *
 * @param {object} deps - injectable dependencies
 * @param {Storage} deps.store - localStorage-compatible object
 * @param {Document} deps.doc - document-compatible object
 */
function makeStorage({ store, doc }) {
  let bannerShown = false;

  function showBanner(msg) {
    if (bannerShown) return;
    bannerShown = true;
    const banner = doc.getElementById('error-banner');
    const message = doc.getElementById('error-banner-message');
    if (banner && message) {
      message.textContent =
        msg || 'localStorage is unavailable — your data will not be saved.';
      banner.hidden = false;
    }
  }

  function load(key) {
    try {
      const raw = store.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }

  function save(key, value) {
    try {
      store.setItem(key, JSON.stringify(value));
    } catch (_) {
      showBanner('Unable to save data — localStorage is full or unavailable.');
    }
  }

  function isAvailable() {
    const TEST_KEY = '__storage_test__';
    try {
      store.setItem(TEST_KEY, '1');
      store.removeItem(TEST_KEY);
      return true;
    } catch (_) {
      return false;
    }
  }

  return { load, save, isAvailable };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal in-memory localStorage stand-in. */
function makeMemoryStore() {
  const data = {};
  return {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    removeItem: (k) => { delete data[k]; },
    clear: () => { Object.keys(data).forEach((k) => delete data[k]); },
  };
}

/** Build a store whose setItem always throws (simulates quota exceeded). */
function makeThrowingStore() {
  return {
    getItem: () => null,
    setItem: () => { throw new DOMException('QuotaExceededError'); },
    removeItem: () => {},
    clear: () => {},
  };
}

/** Build a minimal document stub with an error-banner element. */
function makeDoc() {
  // jsdom is available via vitest's jsdom environment, so we can use the real
  // document — but we create a fresh fragment to keep tests isolated.
  const container = document.createElement('div');
  container.innerHTML = `
    <div id="error-banner" hidden>
      <span id="error-banner-message"></span>
    </div>
  `;
  // Attach to body so getElementById works on the real document.
  document.body.appendChild(container);

  return {
    container,
    doc: {
      getElementById: (id) => container.querySelector(`#${id}`),
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('storage.load', () => {
  it('returns null when key is absent', () => {
    const store = makeMemoryStore();
    const { doc } = makeDoc();
    const s = makeStorage({ store, doc });

    expect(s.load('missing-key')).toBeNull();
  });

  it('returns the parsed value when key is present', () => {
    const store = makeMemoryStore();
    const { doc } = makeDoc();
    const s = makeStorage({ store, doc });

    const value = { name: 'Alice', score: 42 };
    store.setItem('my-key', JSON.stringify(value));

    expect(s.load('my-key')).toEqual(value);
  });
});

describe('storage.save + storage.load round-trip', () => {
  it('saves a value and loads it back correctly', () => {
    const store = makeMemoryStore();
    const { doc } = makeDoc();
    const s = makeStorage({ store, doc });

    const payload = [1, 'two', { three: true }];
    s.save('rt-key', payload);

    expect(s.load('rt-key')).toEqual(payload);
  });
});

describe('storage banner behaviour (Requirement 6.5)', () => {
  it('shows the banner when localStorage throws on save', () => {
    const store = makeThrowingStore();
    const { container, doc } = makeDoc();
    const s = makeStorage({ store, doc });

    s.save('any-key', 'any-value');

    const banner = container.querySelector('#error-banner');
    expect(banner.hidden).toBe(false);
  });

  it('shows the banner only once across multiple failing saves', () => {
    const store = makeThrowingStore();
    const { container, doc } = makeDoc();
    const s = makeStorage({ store, doc });

    // Spy on getElementById to count how many times the banner is mutated.
    const showBannerSpy = vi.spyOn(doc, 'getElementById');

    s.save('k1', 'v1');
    s.save('k2', 'v2');
    s.save('k3', 'v3');

    // The banner element should only have been revealed once (hidden → false).
    const banner = container.querySelector('#error-banner');
    expect(banner.hidden).toBe(false);

    // getElementById is called twice per showBanner invocation (banner + message).
    // After the first call sets bannerShown = true, subsequent calls return early
    // before touching the DOM. So getElementById should have been called exactly twice.
    const bannerRelatedCalls = showBannerSpy.mock.calls.filter(
      ([id]) => id === 'error-banner' || id === 'error-banner-message'
    );
    expect(bannerRelatedCalls.length).toBe(2);
  });
});
