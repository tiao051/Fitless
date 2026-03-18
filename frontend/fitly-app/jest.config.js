module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['**/?(*.)+(test|spec).(ts|tsx)'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|expo(nent)?|@expo(nent)?/.*|expo-.*|@expo-google-fonts/.*|react-clone-referenced-element|@sentry/react-native))',
  ],
};
