import '@testing-library/jest-native/extend-expect';

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) => React.createElement(View, null, children),
  };
});
