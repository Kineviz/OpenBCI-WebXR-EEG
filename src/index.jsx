//Attaching React to the DOM

import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader'; // AppContainer is a necessary wrapper component for HMR

import App from './pages/Main.jsx'

const render = Component => {
  ReactDOM.render(
    <AppContainer>
      <Component/>
    </AppContainer>,
    document.getElementById('kv-root')
  );
};

render(App);

// Hot Module Replacement API
if (module.hot) {
  module.hot.accept('./', () => {
    console.info("-------Re-render React app-----");
    render(App)
  });
}
