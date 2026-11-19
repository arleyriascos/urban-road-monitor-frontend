import { useEffect, useMemo, useRef, type KeyboardEvent } from 'react';
import { useLanguage } from '../i18n/useLanguage';
import { formatDecimal, formatLength, pluralize } from '../lib/format';
import type { Texts } from '../lib/translator';
import { describeStreetSummary } from '../lib/street-summary';
import type { RouteGroup } from '../lib/route-groups';
import { CircularDoublyLinkedList } from '../structures/circular-doubly-linked-list';

interface RouteStepsProps {
  groups: readonly RouteGroup[];
  /** The index of the street picked, or null when none is. */
  selected: number | null;
  onSelect: (index: number | null) => void;
}

function damageText(damageScore: number, { t, locale }: Texts): string {
  return damageScore > 0
    ? t('route.steps.damage', { value: formatDecimal(damageScore, 1, locale) })
    : t('route.steps.noDamage');
}

/**
 * The route street by street, with Previous and Next to walk through it. The street
 * picked is shown on the map and opens to list its segments. The arrow keys do the same as
 * the buttons, and Escape goes back to the whole route.
 *
 * The streets are kept in a circular doubly linked list, so Next on the last street
 * goes to the first and Previous on the first goes to the last, with no special cases at
 * the ends. With no street picked, Next starts at the first and Previous at the last.
 */
export function RouteSteps({ groups, selected, onSelect }: RouteStepsProps) {
  const language = useLanguage();
  const { t, locale } = language;
  const listRef = useRef<HTMLOListElement | null>(null);
  const total = groups.length;

  // One ring node per street, in travel order; nodes[i] is the node of street i.
  const { ring, nodes } = useMemo(() => {
    const list = new CircularDoublyLinkedList<number>();
    return { ring: list, nodes: groups.map((group) => list.append(group.index)) };
  }, [groups]);

  // Keep the street picked in view when it is chosen with the buttons or the keyboard.
  useEffect(() => {
    listRef.current?.querySelector('[aria-current="step"]')?.scrollIntoView?.({ block: 'nearest' });
  }, [selected]);

  if (total === 0) return null;

  const next = () => {
    const node = selected === null ? ring.head : nodes[selected]?.next;
    if (node) onSelect(node.value);
  };
  const previous = () => {
    const node = selected === null ? ring.tail : nodes[selected]?.prev;
    if (node) onSelect(node.value);
  };
  // With a single street there is nowhere to go: the ring points back to itself.
  const canWalk = total > 1;

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      next();
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      previous();
    } else if (event.key === 'Escape' && selected !== null) {
      event.preventDefault();
      onSelect(null);
    }
  };

  return (
    <section className="route-steps" aria-label={t('route.steps.label')} onKeyDown={onKeyDown}>
      <div className="route-steps__nav">
        <button
          type="button"
          className="route-button route-button--quiet"
          onClick={previous}
          disabled={!canWalk}
        >
          {t('route.steps.previous')}
        </button>
        <p className="route-steps__counter" aria-live="polite">
          {selected === null
            ? t('route.steps.walk')
            : t('route.steps.counter', { index: selected + 1, total })}
        </p>
        <button
          type="button"
          className="route-button route-button--quiet"
          onClick={next}
          disabled={!canWalk}
        >
          {t('route.steps.next')}
        </button>
      </div>
      {selected !== null ? (
        <button type="button" className="route-link-button" onClick={() => onSelect(null)}>
          {t('route.steps.all')}
        </button>
      ) : null}
      <ol className="route-steps__list" ref={listRef}>
        {groups.map((group) => {
          const isSelected = group.index === selected;
          return (
            <li key={group.index} className="route-steps__entry">
              <button
                type="button"
                className="route-steps__item"
                aria-current={isSelected ? 'step' : undefined}
                onClick={() => onSelect(group.index)}
              >
                <span className="route-steps__number" aria-hidden="true">
                  {group.index + 1}
                </span>
                <span className="route-steps__text">
                  <span className="route-steps__name">{group.name}</span>
                  <span className="route-steps__meta">
                    {formatLength(group.lengthM, locale)} ·{' '}
                    {pluralize(group.steps.length, t('segment.one'), t('segment.other'), locale)}
                    {group.damagedSteps > 0
                      ? ` · ${t('route.steps.withDamage', { count: group.damagedSteps })}`
                      : ''}
                  </span>
                  {group.summary ? (
                    <span className="route-steps__meta">
                      {describeStreetSummary(group.summary, language)}
                    </span>
                  ) : null}
                </span>
              </button>
              {isSelected ? (
                <ul
                  className="route-steps__segments"
                  aria-label={t('route.steps.segmentsOf', { name: group.name })}
                >
                  {group.steps.map((step) => (
                    <li key={step.id}>
                      {t('route.steps.segment', { order: step.properties.order })} ·{' '}
                      {formatLength(step.properties.lengthM, locale)} ·{' '}
                      {damageText(step.properties.damageScore, language)}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
