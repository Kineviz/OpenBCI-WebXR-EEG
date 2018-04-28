//Main threejs scene

import TWEEN from 'tween';

require('three/examples/js/loaders/OBJLoader.js');
require('three/examples/js/loaders/ColladaLoader.js');
require('three/examples/js/controls/TrackballControls.js');

const Stats = require('three/examples/js/libs/stats.min.js');

import config from './../config';

import EEG_PC from './eegPointcloud'
import PlaybackStream from './inputs/playbackStream';

import VR from './vr/vr';
import VRPoseControl from './vrPoseControl';

class Scene {
  constructor() {
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.controls = null;

    this.clock = new THREE.Clock();

    this.container = null;
    this.w = null;
    this.h = null;

    this.stats = null;

    this.brain = null;
    this.skull = null;
  }

  initScene() { // Initialize the basic threejs stuff
    this.container = $('#threeContainer');

    this.w = this.container.width();
    this.h = this.container.height();

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });

    this.renderer.sortObjects = false;
    this.renderer.setClearColor(0x000000);
    this.renderer.setSize(this.w, this.h);

    this.scene = new THREE.Scene();
    // window.scene = this.scene;

    this.addLights();

    if (config.debug) {
      this.scene.add(new THREE.AxisHelper(5));
    }

    this.camera = new THREE.PerspectiveCamera(20, this.w / this.h, 0.001, 1000000);
    // window.camera = this.camera;

    this.camera.position.set(0, 0, 2);

    this.scene.add(this.camera);

    this.controls = new THREE.TrackballControls(this.camera);
    this.controls.target = new THREE.Vector3(0, 0, 0);
    // window.controls = this.controls;

    this.configControls();

    // attach this.renderer to DOM
    this.container.append(this.renderer.domElement);

    this.addContent();
    this.listenForDataPlayback();

    this.initVR();

    if (config.debug) {
      this.stats = new Stats();
      document.body.appendChild(this.stats.dom);
    }

    this.addEventListeners();
    this.animate();
  }

  listenForDataPlayback() { // Start ws instance, listen for data
    new PlaybackStream('ws://' + window.location.hostname + ':' + config.dataPlayback.ports.outgoing, (data) => {
      this.eeg_pc.updateData(data);
    });
  }

  initVR() { // Init vr controls / view, listen for button presses, etc
    this.vr = new VR(this.renderer, this.camera, this.scene, this.controls);
    this.vr.on('isPresenting', this.isVRPresenting.bind(this)); // handle the transition to vr.

    this.vrPoseControl = new VRPoseControl(this.head, this.vr);
    if (this.vr) {
      this.vrPoseControl.startPoseControl();
      this.vr.buttonAStream
        .distinctUntilChanged()
        .filter(x => x)
        .subscribe((x) => {this.toggleWireframe(this.brain);});

      this.vr.buttonBStream
        .distinctUntilChanged()
        .filter(x => x)
        .subscribe((x) => {this.toggleWireframe(this.brain);});

      this.vr.buttonXStream
        .distinctUntilChanged()
        .filter(x => x)
        .subscribe((x) => {this.toggleWireframe(this.skull);});

      this.vr.leftStickStream
        // .distinctUntilChanged()
        .filter(x => Math.abs(x[1])>0.1)
        .subscribe((x) => {
          // console.log(x)
          this.changeOpacity(this.brain, -(x[1]/1000));});

      this.vr.rightStickStream
        // .distinctUntilChanged()
        .filter(x => Math.abs(x[1])>0.1)
        .subscribe((x) => {this.changeOpacity(this.skull, -(x[1]/1000));});
    }
  }

  addContent() { // Add assets to scene
    this.head = this.loadHead();
    window.head = this.head;
    this.scene.add(this.head);

    this.eeg_pc = new EEG_PC(this.head);
    window.eeg_pc = this.eeg_pc.points;
    this.eeg_pc.points.scale.set(0.0021, 0.0021, 0.0021);
    this.eeg_pc.points.rotation.x = -(Math.PI / 2) - (Math.PI / 18);
    this.eeg_pc.points.rotation.z = -(Math.PI / 2);
    this.eeg_pc.points.position.y = -0.02;
    this.head.add(this.eeg_pc.points);
  }

  addLights() { // Add lights to scene
		this.scene.add( new THREE.AmbientLight( 0xFFFFFF ) );
		var directionalLight = new THREE.DirectionalLight( 0xFFFFFF, 0.125 );
		directionalLight.position.y = 10;
		directionalLight.position.normalize();
		this.scene.add( directionalLight );
  }

  toggleWireframe(object) { // Hide / show wirframe of Object3d material
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material.wireframe = !child.material.wireframe;
        child.material.needsUpdate = true;
      }
    });
  }

  changeOpacity(object, val) { // Change opacity of Object3d material
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material.opacity += val;
        child.material.needsUpdate = true;
        if (child.material.opacity < 0.001) { // Limit opacity range
          child.material.opacity = 0.001;
        }
        if (child.material.opacity > 1) { // Limit opacity range
          child.material.opacity = 1;
        }
      }
    });
  }

  updateMaterial(options) { // Update properties of Object3d material
    return new THREE.MeshPhongMaterial({
      color: options.color || 0xFFFFFF,
      wireframe: options.wireframe || false,
      opacity: options.opacity || 0.75,
      transparent: options.transparent || false,
      side: THREE.DoubleSide,
      depthTest: options.depthTest || false,
    });
  }

  configControls() { // Set default threejs control params
    this.controls.rotateSpeed = 1.0;
    this.controls.zoomSpeed = 1.2;
    this.controls.panSpeed = 0.8;
    this.controls.noZoom = false;
    this.controls.noPan = false;
    this.controls.staticMoving = true;
    this.controls.dynamicDampingFactor = 0.3;
    this.controls.keys = [65, 83, 16];
  }

  loadHead() { // Load 3d assets
    const head = new THREE.Object3D();
    this.loadObj('models/skulls/Skull.obj', {
      color: 0xFFFFFF,
      opacity: 0.01,
      wireframe: true,
      transparent: true,
      side: THREE.BackSide,
      depthTest: false,
    }, (obj) => {
      obj.scale.set(0.00088, 0.00088, 0.00088);
      obj.position.set(-0.0129, -0.09, -0.005);
      obj.rotation.x = Math.PI / 25;
      obj.renderOrder = 1;
      this.skull = obj;
      head.add(obj);
    });

    this.loadObj('models/brains/spineless.obj', {
      color: 0x6EC5FB,
      opacity: 0.015,
      wireframe: true,
      transparent: true,
      depthTest: false,
    }, (obj) => {
      obj.scale.set(0.022, 0.022, 0.022);
      obj.position.set(0, 0, 0);
      obj.renderOrder = 100;
      this.brain = obj;
      head.add(obj);
    });
    return head;
  }

  isVRPresenting(event) { // Adjust scene / clean up listeners when entering / exiting VR
    if (event.display && event.display.isPresenting) { // app is vr mode
      this.controls.enabled = false;
      this.removeEventListeners(); // make sure mouse events, etc aren't interfering with VR.

      this.head.position.set(-0.0021, 1.6715, -1.7996);
      this.eeg_pc.dotScale = 2.5;

      this.initEnvironment();
    } else { // app is not in vr mode
      this.controls.enabled = true;
      this.addEventListeners(); // re-enable mouse control when VR is finished

      this.head.position.set(0, 0, 0);
      this.eeg_pc.dotScale = 5;

      this.removeEnvironment();
    }
  }

  initEnvironment() {
    this.gridHelperBottom = new THREE.PolarGridHelper( 8, 16, 8, 64, 0x404040, 0x404040);
    this.scene.add(this.gridHelperBottom);
  }

  removeEnvironment() {
    if (this.gridHelperBottom) {
        this.scene.remove(this.gridHelperBottom);
    }
  }

  addEventListeners() { // Make it easy to add mouse events, etc
    this.renderer.domElement.addEventListener('mousemove', e => this.onDocumentMouseMove(e), false);
    this.renderer.domElement.addEventListener('mousedown', e => this.onDocumentMouseDown(e), false);
    this.renderer.domElement.addEventListener('mouseout', e => this.onDocumentMouseUp(e), false);

    document.addEventListener('mouseup', e => this.onDocumentMouseUp(e), false);

    window.addEventListener('resize', e => this.resizeRenderer(e), true);

    this.configControls();
  }

  removeEventListeners() { // Make it easy to clean up mouse events, etc
    this.renderer.domElement.removeEventListener('mousemove', e => this.onDocumentMouseMove(e), false);
    this.renderer.domElement.removeEventListener('mousedown', e => this.onDocumentMouseDown(e), false);
    this.renderer.domElement.removeEventListener('mouseout', e => this.onDocumentMouseUp(e), false);

    document.removeEventListener('mouseup', e => this.onDocumentMouseUp(e), false);

    window.removeEventListener('resize', e => this.resizeRenderer(e), true);
  }

  onDocumentMouseMove(event) {
    // event.preventDefault();
  }

  onDocumentMouseDown(event) {
      // event.preventDefault();
  }

  onDocumentMouseUp(event) {
      // event.preventDefault();
  }

  loadObj(url, options, cb) { // Simple interface for loading OBJ files
    new THREE.OBJLoader(new THREE.LoadingManager()).load(url, (object) => {
      object.traverse((child) => {
        child.position.set(0, 0, 0); // force center
        if (child instanceof THREE.Mesh) {
          child.material = this.updateMaterial(options);
        }
      });
      cb(object);
    }, (xhr) => {
      if (xhr.lengthComputable) {
        const percentComplete = (xhr.loaded / xhr.total) * 100;
        console.log(Math.round(percentComplete, 2) + '% downloaded');
      }
    }, (xhr) => {
      console.log('OBJLoader Error: ', xhr);
    });
  }

  loadCollada(url, options, cb) { // Simple interface for loading DAE files
    let obj = null;
    new THREE.ColladaLoader(new THREE.LoadingManager(() => {
      cb(obj);
    })).load(url, (c) => {
      obj = c.scene;
      obj.traverse((child) => {
        child.position.set(0, 0, 0); // force center
        if (child instanceof THREE.Mesh) {
          child.material = this.updateMaterial(options);
        }
      });
    });
  }

  animate() {
    if (this.vr && this.vr.vrEffect) {
      this.vr.vrEffect.requestAnimationFrame(this.animate.bind(this));
    } else {
      requestAnimationFrame(this.animate.bind(this));
    }

    this.controls.update();
    this.render();
  }

  render() {
    TWEEN.update();

    // update stats
    if (config.debug) {
      this.stats.update();
    }

    if (this.vr) {
      this.vr.render(this.vr);
    }

    this.renderer.render(this.scene, this.camera);
  }

  resizeRenderer(event) {
    const width = $('#threeContainer').width();
    const height = $('#threeContainer').height();

    // First update the camera's aspect ratio: width / height
    this.camera.aspect = width / height;


    // must update for your changes to take effect
    this.camera.updateProjectionMatrix();

    // reset the size of the window to the new height

    // this.composer.setSize(width, height)
    this.renderer.setSize(width, height);
  }
}

export default Scene;
