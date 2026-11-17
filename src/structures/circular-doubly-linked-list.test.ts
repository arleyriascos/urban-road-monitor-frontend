import { describe, expect, it } from 'vitest';
import { CircularDoublyLinkedList, type RingNode } from './circular-doubly-linked-list';

function build<T>(...values: T[]) {
  const list = new CircularDoublyLinkedList<T>();
  const nodes = values.map((value) => list.append(value));
  return { list, nodes };
}

/** Follow next from a node, count steps. */
function forward<T>(node: RingNode<T>, steps: number): RingNode<T> {
  let current = node;
  for (let i = 0; i < steps; i++) current = current.next;
  return current;
}

function backward<T>(node: RingNode<T>, steps: number): RingNode<T> {
  let current = node;
  for (let i = 0; i < steps; i++) current = current.prev;
  return current;
}

describe('CircularDoublyLinkedList', () => {
  it('starts empty', () => {
    const list = new CircularDoublyLinkedList<number>();
    expect(list.size).toBe(0);
    expect(list.isEmpty()).toBe(true);
    expect(list.head).toBeNull();
    expect(list.tail).toBeNull();
    expect([...list]).toEqual([]);
    expect(list.isValid()).toBe(true);
  });

  it('a list of one node points to itself both ways', () => {
    const { list, nodes } = build('a');
    expect(list.size).toBe(1);
    expect(list.head).toBe(nodes[0]);
    expect(list.tail).toBe(nodes[0]);
    expect(nodes[0].next).toBe(nodes[0]);
    expect(nodes[0].prev).toBe(nodes[0]);
    expect(list.isValid()).toBe(true);
  });

  it('append returns the node with the value', () => {
    const list = new CircularDoublyLinkedList<string>();
    expect(list.append('x').value).toBe('x');
  });

  it('keeps the order of the values and counts them', () => {
    const { list } = build(1, 2, 3, 4);
    expect([...list]).toEqual([1, 2, 3, 4]);
    expect(list.size).toBe(4);
    expect(list.isEmpty()).toBe(false);
  });

  it('the head is the first value and the tail is the last', () => {
    const { list, nodes } = build('a', 'b', 'c');
    expect(list.head).toBe(nodes[0]);
    expect(list.tail).toBe(nodes[2]);
  });

  it('the last node points to the first and the first back to the last', () => {
    const { nodes } = build('a', 'b', 'c');
    expect(nodes[2].next).toBe(nodes[0]);
    expect(nodes[0].prev).toBe(nodes[2]);
  });

  it('next and prev walk the neighbours', () => {
    const { nodes } = build('a', 'b', 'c');
    expect(nodes[0].next).toBe(nodes[1]);
    expect(nodes[1].next).toBe(nodes[2]);
    expect(nodes[2].prev).toBe(nodes[1]);
    expect(nodes[1].prev).toBe(nodes[0]);
  });

  it('going forward size steps comes back to the same node', () => {
    const { nodes } = build(1, 2, 3, 4, 5);
    for (const node of nodes) {
      expect(forward(node, 5)).toBe(node);
      expect(backward(node, 5)).toBe(node);
    }
  });

  it('wraps around: after the last comes the first, before the first comes the last', () => {
    const { nodes } = build('a', 'b', 'c');
    expect(forward(nodes[2], 1).value).toBe('a');
    expect(backward(nodes[0], 1).value).toBe('c');
  });

  it('a lap yields every value once, then stops', () => {
    const { list } = build(7, 8, 9);
    expect([...list]).toEqual([7, 8, 9]);
    expect([...list]).toEqual([7, 8, 9]);
  });

  it('appending after a lap keeps working', () => {
    const { list } = build(1, 2);
    expect([...list]).toEqual([1, 2]);
    list.append(3);
    expect([...list]).toEqual([1, 2, 3]);
    expect(list.isValid()).toBe(true);
  });

  it('accepts duplicates and any type', () => {
    const { list } = build(1, 1, 1);
    expect([...list]).toEqual([1, 1, 1]);
    const objects = build({ id: 1 }, { id: 2 });
    expect([...objects.list].map((o) => o.id)).toEqual([1, 2]);
  });

  it('keeps lists independent', () => {
    const a = build(1, 2);
    const b = build(9);
    a.list.append(3);
    expect([...a.list]).toEqual([1, 2, 3]);
    expect([...b.list]).toEqual([9]);
  });

  it('is valid after every append', () => {
    const list = new CircularDoublyLinkedList<number>();
    for (let i = 0; i < 20; i++) {
      list.append(i);
      expect(list.isValid()).toBe(true);
    }
  });

  describe('isValid detects a broken ring', () => {
    it('a size that is too small', () => {
      const { list } = build(1, 2, 3);
      (list as unknown as { count: number }).count = 2;
      expect(list.isValid()).toBe(false);
    });

    it('a size that is too big', () => {
      const { list } = build(1, 2, 3);
      (list as unknown as { count: number }).count = 6;
      expect(list.isValid()).toBe(false);
    });

    it('a size on an empty list', () => {
      const list = new CircularDoublyLinkedList<number>();
      (list as unknown as { count: number }).count = 1;
      expect(list.isValid()).toBe(false);
    });

    it('a next that its prev does not undo', () => {
      const { list, nodes } = build(1, 2, 3);
      nodes[1].prev = nodes[2];
      expect(list.isValid()).toBe(false);
    });

    it('a last node that does not close to the first', () => {
      const { list, nodes } = build(1, 2, 3);
      nodes[2].next = nodes[1];
      nodes[1].prev = nodes[2];
      expect(list.isValid()).toBe(false);
    });
  });
});
