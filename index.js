/**
 * NutriLife 2.0 entry point.
 * Gesture handler must be imported first for react-navigation.
 */
import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
