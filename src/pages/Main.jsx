import React from 'react';
import { Row, Col, Jumbotron } from 'react-bootstrap';

//Import top level files
import 'bootstrap/dist/css/bootstrap.css';
import styles from './Main.css';

import Scene from '../three/scene';

class Main extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  componentWillMount() {
    // initialize the threejs scene class
    this.setState({
      scene: new Scene(),
    });
  }
  componentDidMount() {
    // once the dom has mounted, initialize threejs
    this.state.scene.initScene();
  }
  render() {
    return (
      <div className="app">
        <div id="threeContainer" />
        <div id="statsBox" />
      </div>
    );
  }
}

export default Main;
