import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { useLanguage } from '../i18n/useLanguage';
import { useStreetSearch, type StreetSearchDependencies } from '../hooks/useStreetSearch';
import { pluralize } from '../lib/format';
import { describeSearchError } from '../search/query';
import { Icon } from './Icon';
import type { StreetMatch } from '../types/roads';

interface StreetSearchProps {
  /** Called when the person picks a street from the suggestions. */
  onSelect: (street: StreetMatch) => void;
  /** Called when the person clears the box: the street shown on the map is let go. */
  onClear: () => void;
  dependencies?: StreetSearchDependencies;
}

/**
 * A magnifier in the top bar that opens a box to find a street by name. It suggests while the person types (the server does the
 * searching with a Trie), and picking one centers the map on it. It works with the keyboard:
 * the arrows move through the suggestions, Enter picks, and Escape closes the list.
 */
export function StreetSearch({ onSelect, onClear, dependencies }: StreetSearchProps) {
  const { t, locale } = useLanguage();
  const search = useStreetSearch(dependencies);
  const { text, state } = search;
  const listId = useId();
  const popoverId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [picked, setPicked] = useState<string | null>(null);

  const streets = state.status === 'results' ? state.streets : [];
  const shown = open && state.status !== 'idle' && text !== picked;
  const activeId =
    shown && active >= 0 && active < streets.length ? `${listId}-${active}` : undefined;

  // The box opens ready to type in.
  useEffect(() => {
    if (expanded) inputRef.current?.focus();
  }, [expanded]);

  // A tap outside the box folds it; the street found stays on the map.
  useEffect(() => {
    if (!expanded) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && rootRef.current?.contains(event.target)) return;
      setExpanded(false);
      setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [expanded]);

  const fold = () => {
    setExpanded(false);
    setOpen(false);
    setActive(-1);
  };

  const choose = (street: StreetMatch) => {
    search.setText(street.name);
    setPicked(street.name);
    fold();
    onSelect(street);
  };

  const clear = () => {
    search.clear();
    setPicked(null);
    setOpen(false);
    setActive(-1);
    onClear();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' && streets.length > 0) {
      event.preventDefault();
      setOpen(true);
      setActive((index) => (index + 1) % streets.length);
    } else if (event.key === 'ArrowUp' && streets.length > 0) {
      event.preventDefault();
      setOpen(true);
      setActive((index) => (index <= 0 ? streets.length - 1 : index - 1));
    } else if (event.key === 'Enter' && shown && active >= 0 && streets[active]) {
      event.preventDefault();
      choose(streets[active]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      if (shown) setOpen(false);
      else if (text !== '') clear();
      else {
        fold();
        toggleRef.current?.focus();
      }
    }
  };

  return (
    <div className="street-search" ref={rootRef}>
      <button
        ref={toggleRef}
        type="button"
        className={`street-search__toggle${text !== '' && !expanded ? ' street-search__toggle--active' : ''}`}
        aria-expanded={expanded}
        aria-controls={popoverId}
        aria-label={expanded ? t('search.close') : t('search.label')}
        title={expanded ? t('search.close') : t('search.label')}
        onClick={() => (expanded ? fold() : setExpanded(true))}
      >
        <Icon name="search" />
      </button>

      {expanded && (
        <div className="street-search__popover" id={popoverId}>
          <div className="street-search__box">
            <Icon name="search" />
            <input
              ref={inputRef}
              className="street-search__input"
              type="text"
              role="combobox"
              aria-label={t('search.label')}
              aria-expanded={shown}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={activeId}
              placeholder={t('search.label')}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="search"
              maxLength={100}
              value={text}
              onChange={(event) => {
                search.setText(event.target.value);
                setPicked(null);
                setOpen(true);
                setActive(-1);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={onKeyDown}
            />
            {text !== '' && (
              <button
                type="button"
                className="street-search__clear"
                aria-label={t('search.clear')}
                onClick={clear}
              >
                ×
              </button>
            )}
          </div>

          {shown && (
            <div className="street-search__panel" id={listId}>
              {state.status === 'loading' && (
                <p className="street-search__note" role="status">
                  {t('search.loading')}
                </p>
              )}
              {state.status === 'empty' && (
                <p className="street-search__note" role="status">
                  {t('search.empty')}
                </p>
              )}
              {state.status === 'error' && (
                <div className="street-search__note" role="alert">
                  <p>{describeSearchError(state.error, t).text}</p>
                  <button type="button" className="street-search__retry" onClick={search.retry}>
                    {t('search.retry')}
                  </button>
                </div>
              )}
              {state.status === 'results' && (
                <ul className="street-search__list" role="listbox" aria-label={t('search.found')}>
                  {state.streets.map((street, index) => (
                    <li
                      key={`${street.name}-${street.roadIds[0]}`}
                      id={`${listId}-${index}`}
                      role="option"
                      aria-selected={index === active}
                      className={`street-search__option${index === active ? ' street-search__option--active' : ''}`}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => choose(street)}
                    >
                      <span className="street-search__name">{street.name}</span>
                      <span className="street-search__meta">
                        {pluralize(street.segments, t('segment.one'), t('segment.other'), locale)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
