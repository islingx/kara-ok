import React from 'react';
import ReactDOM from 'react-dom';
import firebase from 'firebase/app';

import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

firebase.initializeApp({
  apiKey: 'AIzaSyAmB0eySt6j02gcSqXZZXmOifaDd76gLW0',
  authDomain: 'isling-me.firebaseapp.com',
  databaseURL: 'https://isling-me.firebaseio.com',
  projectId: 'isling-me',
  storageBucket: 'isling-me.appspot.com',
  messagingSenderId: '267111120183',
  appId: '1:267111120183:web:d0e5ead5285209d70caeb2',
  measurementId: 'G-57PX1F6KHZ',
});

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
