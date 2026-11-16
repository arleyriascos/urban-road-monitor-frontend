/**
 * A circular queue of fixed size: when it is full, a new value takes the place of the oldest.
 * The meters use it to keep the last few measurements without the list growing forever.
 */
export class RingBuffer<T> {
  private readonly items: (T | undefined)[];
  private start = 0;
  private count = 0;

  constructor(readonly capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new RangeError('The capacity must be a whole number of at least 1');
    }
    this.items = new Array<T | undefined>(capacity).fill(undefined);
  }

  get size(): number {
    return this.count;
  }

  /** Adds a value at the end; if the buffer is full the oldest value is dropped. */
  push(value: T): void {
    const end = (this.start + this.count) % this.capacity;
    this.items[end] = value;
    if (this.count < this.capacity) {
      this.count += 1;
    } else {
      this.start = (this.start + 1) % this.capacity;
    }
  }

  /** The values from the oldest to the newest. */
  toArray(): T[] {
    const values: T[] = [];
    for (let offset = 0; offset < this.count; offset++) {
      values.push(this.items[(this.start + offset) % this.capacity] as T);
    }
    return values;
  }

  /** The newest value, or undefined when the buffer is empty. */
  newest(): T | undefined {
    return this.count === 0 ? undefined : this.items[(this.start + this.count - 1) % this.capacity];
  }

  clear(): void {
    this.items.fill(undefined);
    this.start = 0;
    this.count = 0;
  }
}
