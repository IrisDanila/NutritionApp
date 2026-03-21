/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Polyfills for AI model support
import { Buffer } from 'buffer';
global.Buffer = Buffer;

if (typeof process === 'undefined') {
  global.process = require('process');
} else if (!process.env) {
  process.env = {};
}

AppRegistry.registerComponent(appName, () => App);
