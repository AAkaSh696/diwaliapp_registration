
import React from 'react';
import { StyleSheet } from 'react-native';

export const enableScreens = () => {};
export const screensEnabled = () => false;
export const enableFreeze = () => {};
export const freezeEnabled = () => false;

const navigationOnlyProps = [
  'enabled',
  'activityState',
  'freezeOnBlur',
  'shouldFreeze',
  'active',
  'gestureEnabled',
  'isNativeStack',
  'nativeBackButtonDismissalEnabled',
  'homeIndicatorHidden',
  'onLayout'
];

function filterProps(props) {
  const filtered = { ...props };

  navigationOnlyProps.forEach((prop) => {
    delete filtered[prop];
  });

  // Convert React Native style arrays to a web-compatible style object.
  if (filtered.style) {
    filtered.style = StyleSheet.flatten(filtered.style) || {};
  }

  return filtered;
}

export function Screen({ children, ...props }) {
  return <div {...filterProps(props)}>{children}</div>;
}

export function ScreenContainer({ children, ...props }) {
  return <div {...filterProps(props)}>{children}</div>;
}

export const NativeScreen = Screen;
export const NativeScreenContainer = ScreenContainer;

export default {
  enableScreens,
  screensEnabled,
  enableFreeze,
  freezeEnabled,
  Screen,
  ScreenContainer,
  NativeScreen,
  NativeScreenContainer,
};