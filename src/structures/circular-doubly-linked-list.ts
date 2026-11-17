/**
 * Circular doubly linked list, written by hand, as the course presents it: every node
 * holds a value and two pointers, one to the next node and one to the previous one, and
 * the list is circular, so the last node points to the first as its next and the first
 * points to the last as its previous. A list with one node points to itself both ways.
 *
 * Going around it never ends: after the last node comes the first, and before the first
 * comes the last. The route panel uses it to walk the streets of a route with Anterior
 * and Siguiente without special cases at the two ends.
 *
 * The list remembers its first node (cabeza); the last node (cola) is its previous one,
 * so adding at the end does not have to walk the list. A node knows its neighbours, so
 * whoever keeps a node can move to the next or the previous one in O(1).
 *
 * Complexity: append, head, tail and size are O(1); walking a lap and checking the
 * invariants (isValid) are O(n).
 */
export class RingNode<T> {
  /** The next node going around; the next of the last node is the first. */
  next: RingNode<T>;
  /** The previous node going around; the previous of the first node is the last. */
  prev: RingNode<T>;

  constructor(public readonly value: T) {
    // A node on its own is a ring of one: it points to itself both ways.
    this.next = this;
    this.prev = this;
  }
}

export class CircularDoublyLinkedList<T> {
  private first: RingNode<T> | null = null;
  private count = 0;

  /** The first node (cabeza), or null if the list is empty. */
  get head(): RingNode<T> | null {
    return this.first;
  }

  /** The last node (cola), or null if the list is empty. */
  get tail(): RingNode<T> | null {
    return this.first === null ? null : this.first.prev;
  }

  get size(): number {
    return this.count;
  }

  isEmpty(): boolean {
    return this.count === 0;
  }

  /** Add a value after the last one and return its node. */
  append(value: T): RingNode<T> {
    const node = new RingNode(value);
    if (this.first === null) {
      this.first = node;
    } else {
      const last = this.first.prev;
      node.prev = last;
      node.next = this.first;
      last.next = node;
      this.first.prev = node;
    }
    this.count++;
    return node;
  }

  /** Walk one lap from the first node to the last, going forward. */
  *[Symbol.iterator](): IterableIterator<T> {
    let node = this.first;
    for (let step = 0; node !== null && step < this.count; step++) {
      yield node.value;
      node = node.next;
    }
  }

  /**
   * Check the invariants of the ring: every next is undone by its prev, one lap forward
   * visits exactly size nodes and comes back to the first, and an empty list has no nodes.
   * It never loops forever, even on a broken ring.
   */
  isValid(): boolean {
    if (this.first === null) {
      return this.count === 0;
    }
    let node = this.first;
    for (let step = 0; step < this.count; step++) {
      if (node.next.prev !== node) {
        return false;
      }
      node = node.next;
      if (node === this.first && step < this.count - 1) {
        return false; // the ring closes before size nodes: size is too big
      }
    }
    return node === this.first;
  }
}
