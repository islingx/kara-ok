import React, { memo } from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import Controller from './Controller';
import Player from './Player';

const App = () => (
  <Router>
    <Switch>
      <Route path='/' exact component={Controller} />
      <Route path='/player' component={Player} />
    </Switch>
  </Router>
);

export default memo(App);
