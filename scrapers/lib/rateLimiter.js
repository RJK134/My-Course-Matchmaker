class RateLimiter {
  constructor(minDelayMs = 2000) {
    this.minDelay = minDelayMs;
    this.lastRequest = 0;
  }

  async wait() {
    const now = Date.now();
    const elapsed = now - this.lastRequest;
    if (elapsed < this.minDelay) {
      await new Promise((r) => setTimeout(r, this.minDelay - elapsed));
    }
    this.lastRequest = Date.now();
  }
}

module.exports = RateLimiter;
