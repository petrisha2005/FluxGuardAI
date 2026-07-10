import '@testing-library/jest-dom/vitest';

class TestResizeObserver implements ResizeObserver {
  constructor(private readonly callback: ResizeObserverCallback) {}

  observe(target: Element) {
    this.callback(
      [
        {
          target,
          contentRect: {
            x: 0,
            y: 0,
            width: 1024,
            height: 320,
            top: 0,
            right: 1024,
            bottom: 320,
            left: 0,
            toJSON: () => '',
          },
          borderBoxSize: [],
          contentBoxSize: [],
          devicePixelContentBoxSize: [],
        },
      ],
      this,
    );
  }

  unobserve() {}

  disconnect() {}
}

globalThis.ResizeObserver = TestResizeObserver;
