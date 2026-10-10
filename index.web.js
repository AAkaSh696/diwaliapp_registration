import { AppRegistry } from 'react-native';
import App from './App';

AppRegistry.registerComponent('AwesomeProject', () => App);

AppRegistry.runApplication('AwesomeProject', {
  rootTag: document.getElementById('root'),
});