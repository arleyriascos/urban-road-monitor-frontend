/**
 * Random operations on the circular doubly linked list, compared with a plain array that
 * keeps the same values. The seeds are fixed, so every run performs the same operations.
 * A cursor walks the ring with next and prev while values are appended, and the cursor
 * is compared with an index that wraps around the array.
 */
import { describe, expect, it } from 'vitest';
import { CircularDoublyLinkedList, type RingNode } from './circular-doubly-linked-list';

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

describe('CircularDoublyLinkedList against a reference', () => {
  it.each([1, 2, 3, 4, 5])('matches the reference after every operation (seed %i)', (seed) => {
    const random = seededRandom(seed);
    const list = new CircularDoublyLinkedList<number>();
    const reference: number[] = [];
    let cursor: RingNode<number> | null = null;
    let index = 0; // position of the cursor in the reference
    let value = 0;

    for (let step = 0; step < 2_000; step++) {
      const action = random();
      if (action < 0.3 || reference.length === 0) {
        const node = list.append(value);
        reference.push(value);
        value++;
        if (cursor === null) {
          cursor = node;
          index = 0;
        }
      } else if (action < 0.65) {
        cursor = cursor!.next;
        index = (index + 1) % reference.length;
      } else {
        cursor = cursor!.prev;
        index = (index - 1 + reference.length) % reference.length;
      }

      expect(list.size).toBe(reference.length);
      expect(list.isValid()).toBe(true);
      expect([...list]).toEqual(reference);
      expect(list.head?.value).toBe(reference[0]);
      expect(list.tail?.value).toBe(reference[reference.length - 1]);
      expect(cursor?.value).toBe(reference[index]);
    }
  });

  it.each([1, 2, 3])('a full lap in either direction comes back to the start (seed %i)', (seed) => {
    const random = seededRandom(seed);
    const list = new CircularDoublyLinkedList<number>();
    const size = 1 + Math.floor(random() * 40);
    const nodes = Array.from({ length: size }, (_, i) => list.append(i));

    for (const start of nodes) {
      let node = start;
      for (let i = 0; i < size; i++) node = node.next;
      expect(node).toBe(start);
      for (let i = 0; i < size; i++) node = node.prev;
      expect(node).toBe(start);
    }
  });
});
