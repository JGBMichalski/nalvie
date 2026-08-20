const React = require('react');

function useSharedValue(initial) {
  const ref = React.useRef(null);
  if (ref.current === null) ref.current = { value: initial };
  return ref.current;
}

function useAnimatedStyle(factory) {
  try {
    return factory() ?? {};
  } catch {
    return {};
  }
}

function useFrameCallback() {
  return { setActive: () => {}, isActive: false };
}

const AnimatedView = React.forwardRef((props, ref) => {
  const { View } = require('react-native');
  return React.createElement(View, { ...props, ref });
});
AnimatedView.displayName = 'Animated.View';

const createAnimatedComponent = (Component) => Component;

const mock = {
  __esModule: true,
  default: { View: AnimatedView, createAnimatedComponent, call: () => {} },
  View: AnimatedView,
  createAnimatedComponent,
  useSharedValue,
  useAnimatedStyle,
  useFrameCallback,
  useDerivedValue: (factory) => ({ value: factory() }),
  useAnimatedRef: () => React.createRef(),
  runOnJS: (fn) => fn,
  runOnUI: (fn) => fn,
  withTiming: (value) => value,
  withSpring: (value) => value,
};

module.exports = mock;
