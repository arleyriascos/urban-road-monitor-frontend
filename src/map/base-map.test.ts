import { afterEach, describe, expect, it } from 'vitest';
import { englishTexts } from '../test/english';
import { PANES, createMap } from './base-map';

const containers: HTMLElement[] = [];

afterEach(() => {
  containers.splice(0).forEach((container) => container.remove());
});

function newContainer() {
  const container = document.createElement('div');
  document.body.append(container);
  containers.push(container);
  return container;
}

describe('createMap', () => {
  it('puts the route over the streets and the potholes over the route', () => {
    const map = createMap(newContainer());

    const streets = Number(map.getPane('overlayPane')?.style.zIndex || 400);
    const route = Number(map.getPane(PANES.route.name)?.style.zIndex);
    const potholes = Number(map.getPane(PANES.potholes.name)?.style.zIndex);
    const markers = Number(map.getPane('markerPane')?.style.zIndex || 600);

    expect(streets).toBeLessThan(route);
    expect(route).toBeLessThan(potholes);
    expect(potholes).toBeLessThan(markers);
    map.remove();
  });
});

describe('the zoom buttons', () => {
  const titles = (container: HTMLElement) =>
    [...container.querySelectorAll('.leaflet-control-zoom a')].map((a) => a.getAttribute('title'));

  it('are named in Spanish when no language is given', () => {
    const container = newContainer();
    const map = createMap(container);
    expect(titles(container)).toEqual(['Acercar', 'Alejar']);
    map.remove();
  });

  it('are named in the language of the app', () => {
    const container = newContainer();
    const map = createMap(container, englishTexts);
    expect(titles(container)).toEqual(['Zoom in', 'Zoom out']);
    map.remove();
  });
});
