/* eslint-env jest */
// Reanimated / worklets sous Jest : l'implémentation native n'existe pas, on la remplace par un mock minimal
// (valeurs partagées lisibles, animations qui sautent directement à la valeur finale, aucun timer).
jest.mock('react-native-worklets', () => ({
  scheduleOnRN: (fn, ...args) => fn(...args),
}));

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View, Text, ScrollView } = require('react-native');
  const shared = (initial) => {
    let current = initial;
    return {
      get value() {
        return current;
      },
      set value(v) {
        current = v;
      },
      get: () => current,
      set: (v) => {
        current = v;
      },
    };
  };
  const chain = new Proxy(() => chain, { get: () => chain });
  const Animated = {
    View,
    Text,
    ScrollView,
    createAnimatedComponent: (component) => component,
  };
  return {
    __esModule: true,
    default: Animated,
    ...Animated,
    useSharedValue: (initial) => React.useRef(shared(initial)).current,
    useAnimatedStyle: () => ({}),
    useAnimatedProps: () => ({}),
    useAnimatedReaction: () => undefined,
    useDerivedValue: (fn) => ({ get: fn, value: fn() }),
    withTiming: (toValue) => toValue,
    withSpring: (toValue) => toValue,
    withDelay: (_delay, animation) => animation,
    withSequence: (...animations) => animations[animations.length - 1],
    withRepeat: (animation) => animation,
    interpolate: (x, input, output) => output[0] + ((x - input[0]) / (input[1] - input[0])) * (output[1] - output[0]),
    // Courbes réelles pour les calculs côté JS (compteurs) ; le reste reste neutre.
    Easing: new Proxy(
      { linear: (t) => t, cubic: (t) => t * t * t, out: (f) => (t) => 1 - f(1 - t), in: (f) => f },
      { get: (o, k) => (k in o ? o[k] : chain) },
    ),
    runOnJS: (fn) => fn,
  };
});
