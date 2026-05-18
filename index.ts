import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { installTerminalErrorLogging } from './src/utils/terminalErrorLog';
import { LogBox } from 'react-native';
import { registerRootComponent } from 'expo';

installTerminalErrorLogging();

LogBox.ignoreLogs([
  // Emitted by some dependencies still importing SafeAreaView from react-native.
  'SafeAreaView has been deprecated',
]);

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
