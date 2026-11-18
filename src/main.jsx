import { render } from 'preact';
import '@fontsource-variable/inter';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';
import './styles.css';
import { App } from './App.jsx';

render(<App />, document.getElementById('app'));
