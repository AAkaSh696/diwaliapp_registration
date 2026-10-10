import React, { createContext, useContext } from 'react';

const defaultInsets = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

export const SafeAreaInsetsContext = createContext(defaultInsets);

export const SafeAreaFrameContext = createContext({
  x: 0,
  y: 0,
  width: 0,
  height: 0,
});

export function SafeAreaProvider({ children, initialMetrics }) {
  const insets = initialMetrics?.insets ?? defaultInsets;
  const frame = initialMetrics?.frame ?? {
    x: 0,
    y: 0,
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  };

  return (
    <SafeAreaFrameContext.Provider value={frame}>
      <SafeAreaInsetsContext.Provider value={insets}>
        {children}
      </SafeAreaInsetsContext.Provider>
    </SafeAreaFrameContext.Provider>
  );
}

export function SafeAreaView({
  children,
  style,
  edges,
  mode,
  ...props
}) {
  return (
    <div style={style} {...props}>
      {children}
    </div>
  );
}

export function useSafeAreaInsets() {
  return useContext(SafeAreaInsetsContext);
}

export function useSafeAreaFrame() {
  return useContext(SafeAreaFrameContext);
}

export function initialWindowMetrics() {
  return {
    frame: {
      x: 0,
      y: 0,
      width: typeof window !== 'undefined' ? window.innerWidth : 0,
      height: typeof window !== 'undefined' ? window.innerHeight : 0,
    },
    insets: defaultInsets,
  };
}

export const initialWindowSafeAreaInsets = defaultInsets;

export default {
  SafeAreaProvider,
  SafeAreaView,
  SafeAreaInsetsContext,
  SafeAreaFrameContext,
  useSafeAreaInsets,
  useSafeAreaFrame,
  initialWindowMetrics,
  initialWindowSafeAreaInsets,
};
