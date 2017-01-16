import xs from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import tinycolor from 'tinycolor2';
import { div } from '@cycle/dom';
import css from 'stylin';

import SaturationValue from './components/saturation-value';
import Hue from './components/hue';
import Alpha from './components/alpha';
import TextInput from './components/text-input';
import Swatch from './components/swatch';

import { styles } from './styles/color-picker.js';

function view ([saturationValue, hue, alpha, text, swatch, color]) {
  return (
    div(`.color-picker ${css.unimportant(styles)}`, [
      saturationValue,
      hue,
      alpha,
      text,
      swatch
    ])
  );
}

function colorFromProps (props) {
  if ('color' in props) {
    const color = tinycolor(props.color).toHsv();
    color.h /= 360;

    return color;
  }
}

export default function ColorPicker ({DOM, props$ = xs.empty()}) {
  const colorFromProps$ = props$.map(colorFromProps);
  const colorChangeProxy$ = xs.create();

  const colorChange$ = xs.merge(
    colorFromProps$,
    colorChangeProxy$
  );

  const color$ = colorChange$.fold((color, change) => Object.assign({}, color, change), {h: 1, s: 1, v: 1, a: 1});

  const saturationValueComponent$ = SaturationValue({DOM, color$});
  const hueComponent$ = Hue({DOM, color$});
  const alphaComponent$ = Alpha({DOM, color$});
  const textComponent$ = TextInput({DOM, color$});
  const swatchComponent$ = Swatch({DOM, color$});

  const change$ = xs.merge(
    saturationValueComponent$.change$,
    hueComponent$.change$,
    alphaComponent$.change$,
    textComponent$.change$
  );

  colorChangeProxy$.imitate(change$);

  const vtree$ = xs.combine(
    saturationValueComponent$.DOM,
    hueComponent$.DOM,
    alphaComponent$.DOM,
    textComponent$.DOM,
    swatchComponent$.DOM,
    color$
  ).compose(dropRepeats((a, b) => JSON.stringify(a) === JSON.stringify(b)));

  const colorSink$ = color$.map(color => tinycolor.fromRatio(color).toRgbString());

  return {
    DOM: vtree$.map(view),
    color$: colorSink$
  };
}
