import { useEffect, useRef, type KeyboardEvent } from 'react';
import { formatDecimal, formatLength, pluralize } from '../lib/format';
import type { RouteGroup } from '../lib/route-groups';

interface RouteStepsProps {
  groups: readonly RouteGroup[];
  /** The index of the street picked, or null when none is. */
  selected: number | null;
  onSelect: (index: number | null) => void;
}

function damageText(damageScore: number): string {
  return damageScore > 0 ? `Daño ${formatDecimal(damageScore, 1)}` : 'Sin daño';
}

/**
 * The route street by street, with Anterior and Siguiente to walk through it. The street
 * picked is shown on the map and opens to list its segments. The arrow keys do the same as
 * the buttons, and Escape goes back to the whole route.
 */
export function RouteSteps({ groups, selected, onSelect }: RouteStepsProps) {
  const listRef = useRef<HTMLOListElement | null>(null);
  const total = groups.length;

  // Keep the street picked in view when it is chosen with the buttons or the keyboard.
  useEffect(() => {
    listRef.current?.querySelector('[aria-current="step"]')?.scrollIntoView?.({ block: 'nearest' });
  }, [selected]);

  if (total === 0) return null;

  const go = (index: number) => onSelect(Math.min(Math.max(index, 0), total - 1));
  const next = () => go(selected === null ? 0 : selected + 1);
  const previous = () => go(selected === null ? 0 : selected - 1);

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
    <section className="route-steps" aria-label="Recorrido de la ruta" onKeyDown={onKeyDown}>
      <div className="route-steps__nav">
        <button
          type="button"
          className="route-button route-button--quiet"
          onClick={previous}
          disabled={selected === null || selected === 0}
        >
          Anterior
        </button>
        <p className="route-steps__counter" aria-live="polite">
          {selected === null ? 'Recorre la ruta' : `Calle ${selected + 1} de ${total}`}
        </p>
        <button
          type="button"
          className="route-button route-button--quiet"
          onClick={next}
          disabled={selected === total - 1}
        >
          Siguiente
        </button>
      </div>
      {selected !== null ? (
        <button type="button" className="route-link-button" onClick={() => onSelect(null)}>
          Ver toda la ruta
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
                    {formatLength(group.lengthM)} ·{' '}
                    {pluralize(group.steps.length, 'tramo', 'tramos')}
                    {group.damagedSteps > 0 ? ` · ${group.damagedSteps} con daño` : ''}
                  </span>
                </span>
              </button>
              {isSelected ? (
                <ul className="route-steps__segments" aria-label={`Tramos de ${group.name}`}>
                  {group.steps.map((step) => (
                    <li key={step.id}>
                      Tramo {step.properties.order} · {formatLength(step.properties.lengthM)} ·{' '}
                      {damageText(step.properties.damageScore)}
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
