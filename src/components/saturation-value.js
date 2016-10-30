import xs from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import { div } from '@cycle/dom';
import { between, containerBoundaries } from '../helpers';
import { sample } from '../operators';
import tinycolor from 'tinycolor2';
import { saturationValueStyle } from '../styles/saturation-value';
import css from 'stylin';

function view ([state, props]) {
  const propsColor = tinycolor.fromRatio(props.color).toHsv();
  const background = `hsl(${propsColor.h}, 100%, 50%)`;
  const indicatorColor = state.value < 0.5 ? '#fff' : '#000';

  const indicatorStyle = {
    left: `${state.container.width * state.saturation}px`,
    top: `${state.container.height * (1 - state.value)}px`,
    'border-color': `${indicatorColor}`
  };

  return (
    div(`.saturation-lightness-container ${css.unimportant(saturationValueStyle)}`, [
      div('.white-overlay'),
      div('.saturation-color', {style: {background}}),
      div('.grey-overlay'),
      div('.saturation-indicator', {style: indicatorStyle})
    ])
  );
}

function setState (event, type, value) {
  return function _setState (state) {
    return {...state, [`${type}`]: value};
  };
}

function update (event) {
  return function _update (state) {
    if (!state.mouseIsDown) { return state; }

    const {
      containerWidth,
      containerHeight,
      top,
      left
    } = containerBoundaries(state, event, state.container);

    const x = between(0, containerWidth, left) / containerWidth;
    const y = between(0, containerHeight, top) / containerHeight;

    return Object.assign({}, state, {saturation: x, value: 1 - y});
  };
}

export default function SaturationValue ({DOM, props$}) {
  const container$ = DOM
    .select('.saturation-lightness-container');

  const containerEl$ = container$
    .elements()
    .drop(1)
    .compose(sample(100))
    .map(el => el[0].getBoundingClientRect())
    .map(value => setState('nil', 'container', value));

  const mouseDown$ = container$
    .events('mousedown')
    .map(ev => setState(ev, 'mouseIsDown', true));

  const mouseMove$ = container$
    .events('mousemove');

  const click$ = container$
    .events('click');

  const update$ = xs.merge(click$, mouseMove$)
    .map(ev => update(ev));

  const mouseUp$ = DOM
    .select('document')
    .events('mouseup')
    .map(ev => setState(ev, 'mouseIsDown', false));

  const initialState = {
    saturation: 0,
    value: 0,
    mouseIsDown: false,
    container: { width: 0, height: 0 }
  };

  const actions$ = xs.merge(
    containerEl$,
    mouseDown$,
    mouseUp$,
    update$
  );

  const state$ = actions$.fold((state, action) => action(state), initialState);

  return {
    DOM: xs.combine(state$, props$).map(view),
    saturationValue$: state$.compose(dropRepeats((state) => JSON.stringify(state) === JSON.stringify(state)))
  };
}
