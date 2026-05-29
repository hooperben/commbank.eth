// A trivial shared counter the workers increment on every successful real
// operation. Single-threaded JS means we don't need atomics.

export class Counter {
  private n = 0;
  inc() {
    this.n++;
  }
  value() {
    return this.n;
  }
}
