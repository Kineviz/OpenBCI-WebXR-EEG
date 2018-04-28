require('three/examples/js/loaders/OBJLoader.js');
require('three/examples/js/loaders/MTLLoader.js');

require('three/examples/js/controls/VRControls.js');
require('three/examples/js/effects/VREffect.js');
require('three/examples/js/controls/VRControls.js');
require('three/examples/js/vr/ViveController.js');

require('./RiftController.js');

let WEBVR = require('exports-loader?WEBVR!three/examples/js/vr/WebVR.js');

class VR {
  constructor(renderer, camera, parent, controls) {
    this.renderer = renderer;
    this.camera = camera;
    this.parent = parent;
    this.controls = controls;

    this.vrControls = null;
    this.vrEffect = null;

    this.gamepadsAttached = 0;

    this.controllers = {};

    this.controllerNames = ['right', 'left', 'camera'];
    this.viveControllerModel = null;
    this.riftLeftControllerModel = null;
    this.riftRightControllerModel = null;

    this.raycaster = new THREE.Raycaster();
    this.intersected = [];
    this.tempMatrix = new THREE.Matrix4();

    this.group;

    this.events = [];

    this.initStreams()

    if (this.isAvailable() === true) {
      this.initEffect();

      window.addEventListener('resize', (event) => this.onWindowResize, false);
    }

    //just as test, will auto save to redux
    this.gamepadPose = {
      left: {
        position: { x: 0, y: 0, z: 0 },
        orientation: { x: 0, y: 0, z: 0, w: 1 }
      },
      right: {
        position: { x: 0, y: 0, z: 0 },
        orientation: { x: 0, y: 0, z: 0, w: 1 }
      }
    }

  }

  initStreams() {
    // right
    this.rightControllerPoseStream = new Rx.Subject()
    this.rightGripStream = new Rx.Subject()
    this.rightTriggerStream = new Rx.Subject()
    this.buttonAStream = new Rx.Subject()
    this.buttonBStream = new Rx.Subject()
    this.rightStickStream = new Rx.Subject()

    // left
    this.leftControllerPoseStream = new Rx.Subject()
    this.leftGripStream = new Rx.Subject()
    this.leftTriggerStream = new Rx.Subject()
    this.buttonXStream = new Rx.Subject()
    this.buttonYStream = new Rx.Subject()
    this.leftStickStream = new Rx.Subject()
  }

  startStreams() {
    console.log('start controller Rx stream')
    // right
    if (this.controllers[0]) {
      this.controllers[0].addEventListener('gripsdown', (event) => { this.rightGripStream.next('down') });
      this.controllers[0].addEventListener('gripsup', (event) => { this.rightGripStream.next('up') });
      this.controllers[0].addEventListener('triggerdown', (event) => { this.rightTriggerStream.next('down') });
      this.controllers[0].addEventListener('triggerup', (event) => { this.rightTriggerStream.next('up') });
    } else {
      console.log('Right Controller is null')
    }
    // left
    if (this.controllers[1]) {
      this.controllers[1].addEventListener('gripsdown', (event) => { this.leftGripStream.next('down') });
      this.controllers[1].addEventListener('gripsup', (event) => { this.leftGripStream.next('up') });
      this.controllers[1].addEventListener('triggerdown', (event) => { this.leftTriggerStream.next('down') });
      this.controllers[1].addEventListener('triggerup', (event) => { this.leftTriggerStream.next('up') });
    } else {
      console.log('Left Controller is null')
    }
  }

  initEffect() {
    this.vrEffect = new THREE.VREffect(this.renderer);
    this.vrEffect.setSize($('#threeContainer').width(), $('#threeContainer').height());

    window.addEventListener('vrdisplaypresentchange', this.onVRDisplayPresentChange.bind(this));
    document.body.appendChild(WEBVR.createButton(this.renderer));
  }

  onVRDisplayPresentChange(event) {
    console.log('====VR Display Present Changed=====')
    if (event.display.isPresenting) {
      console.log('====Entering VR====')
      this.trigger('isPresenting', event);
      this.initVRControls();

      if (navigator) {
        let gamepads = _.filter(navigator.getGamepads(), d => d !== null);
        if (_.size(gamepads) > 0) {
          this.attachGamePad(gamepads)
        } else {

          window.addEventListener("gamepadconnected", (e) => {
            console.log('Gamepad connected at index %d: %s. %d buttons, %d axes.',
              e.gamepad.index, e.gamepad.id,
              e.gamepad.buttons.length, e.gamepad.axes.length);

            gamepads = _.filter(navigator.getGamepads(), d => d !== null);
            this.attachGamePad(gamepads);
          });

        }

      }
    } else {
      console.log('===Leaving VR===')
      this.clearVR();
      this.trigger('isPresenting', event.display.isPresenting);
    }

  }

  attachGamePad(gamepads) {
    if (this.gamepadAttached === gamepads.length) return // skip if gamepad already attached
    let controllerIdx = 0;
    _.each(gamepads, (gamepad) => {
      if (gamepad) {
        console.log('Current gamapad is:', gamepad.id);
        switch (gamepad.id.slice(0, 14)) {
          case 'OpenVR Gamepad':
            this.initViveController(gamepad.id, controllerIdx);
            controllerIdx++;
            break;
          case 'Oculus Touch (':
            this.initRiftController(gamepad.id, controllerIdx);
            controllerIdx++;
            break;
        }
      }
    });

    this.gamepadAttached++;
    this.startStreams();
  }

  clearVR() {
    this.vrEffect.cancelAnimationFrame();

    this.vrControls.dispose();
    this.vrControls = null;

    _.each(this.controllers, (c) => {
      c = null;
    });
    this.controllers = {};
  }

  initVRControls() {
    this.vrControls = new THREE.VRControls(this.camera);
    this.vrControls.standing = true;
  }

  initViveController(name, idx) {
    // controllers

    this.controllers[idx] = new THREE.ViveController(idx);
    this.controllers[idx].name = this.controllerNames[idx];

    this.controllers[idx].standingMatrix = this.vrControls.getStandingMatrix();

    this.parent.add(this.controllers[idx]);

    this.getViveControllerModel((object) => {
      console.log('Vive Controller Model :', object);
      this.controllers[idx].add(object.clone());
    });
  }

  initRiftController(name, idx) {
    // controllers

    this.controllers[idx] = new THREE.RiftController(idx);
    this.controllers[idx].name = this.controllerNames[idx];

    this.controllers[idx].standingMatrix = this.vrControls.getStandingMatrix();

    this.parent.add(this.controllers[idx]);

    let hand = 'right';
    if (name.toLowerCase().search('left') !== -1) {
      hand = 'left';
    }
    if (name.toLowerCase().search('right') !== -1) {
      hand = 'right';
    }

    this.getRiftControllerModel(hand, (object, type) => {
      console.log('Rift Controller Model :', object);
      object.rotation.x = (Math.PI / 4);
      object.position.y += 0.075;
      object.position.x += (type === 'left') ? -0.0125 : 0.0125;
      this.controllers[idx].add(object.clone());
    });
  }

  onWindowResize() {
    this.vrEffect.setSize($('#threeContainer').width(), $('#threeContainer').height());
  }

  getViveControllerModel(callback) {
    if (this.viveControllerModel) {
      callback(this.viveControllerModel);
    }
    else {
      var loader = new THREE.OBJLoader();
      loader.setPath('/models/viveController/');
      loader.load('vr_controller_vive_1_5.obj', (object) => {

        var loader = new THREE.TextureLoader();
        loader.setPath('/models/viveController/');

        var controller = object.children[0];
        controller.material = new THREE.MeshBasicMaterial({color: 0xFFFFFF, wireframe: true, transparent:true, opacity: 0.5});
        // controller.material.map = loader.load('onepointfive_texture.png');
        // controller.material.specularMap = loader.load('onepointfive_spec.png');

        controller.castShadow = true;

        this.viveControllerModel = object;

        callback(this.viveControllerModel);
      });
    }
  }

  getRiftControllerModel(type, callback) {
    let temp_m = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, wireframe: true, transparent:true, opacity: 0.015});
    switch (type) {
      case 'left':
        if (this.riftLeftControllerModel) {
          callback(this.riftLeftControllerModel);
        }
        else {
          var mtlLoader = new THREE.MTLLoader();
          mtlLoader.setPath('/models/riftController/');
          mtlLoader.load('oculus-touch-controller-left.mtl', (materials) => {
            materials.preload();

            var objLoader = new THREE.OBJLoader();

            // objLoader.setMaterials(materials);
            objLoader.setPath('/models/riftController/');

            objLoader.load('oculus-touch-controller-left.obj', (object) => {
              var controller = object.children[0];
              controller.castShadow = false;

              this.riftLeftControllerModel = object;
              object.traverse(c => {
                if (c instanceof THREE.Mesh) c.material = temp_m
              })
              callback(this.riftLeftControllerModel, type);
            });
          });
        }
        break;

      case 'right':
        if (this.riftRightControllerModel) {
          callback(this.riftRightControllerModel, type);
        }
        else {
          var mtlLoader = new THREE.MTLLoader();
          mtlLoader.setPath('/models/riftController/');
          mtlLoader.load('oculus-touch-controller-right.mtl', (materials) => {
            materials.preload();

            var objLoader = new THREE.OBJLoader();

            // objLoader.setMaterials(materials);
            objLoader.setPath('/models/riftController/');

            objLoader.load('oculus-touch-controller-right.obj', (object) => {
              var controller = object.children[0];
              controller.castShadow = false;

              this.riftRightControllerModel = object;
              object.traverse(c => {
                if (c instanceof THREE.Mesh) {
                  c.material = temp_m
                }
              })

              callback(this.riftRightControllerModel);
            });
          });
        }
        break;
    }
  }

  isEqualArray(aArray, bArray, accuracy = 0.01) {
    if (aArray == bArray) {
      return true;
    } else if (aArray && bArray && aArray.length >= 0 && bArray.length >= 0 && aArray.length == bArray.length) {
      let resArray = aArray.map((e, index) => {
        return Math.abs(e - bArray[index]) < accuracy;
      })
      return (resArray.filter(isEqual => !isEqual)).length == 0;
    } else {
      return false;
    }

  }

  updateGamepadPose(leftPose, rightPose) {
    let hasChange = false;
    if (leftPose
      && (!this.isEqualArray(this.gamepadPose.left.position, leftPose.position) || !this.isEqualArray(this.gamepadPose.left.orientation, leftPose.orientation))
    ) {
      this.gamepadPose.left.position = leftPose.position;
      this.gamepadPose.left.orientation = leftPose.orientation;
      hasChange = true;
      // console.log('Left GamePad pose changed :', this.gamepadPose);
    }

    if (rightPose && (!this.isEqualArray(this.gamepadPose.right.position, rightPose.position)
      || !this.isEqualArray(this.gamepadPose.right.orientation, rightPose.orientation))) {
      this.gamepadPose.right.position = rightPose.position;
      this.gamepadPose.right.orientation = rightPose.orientation;
      hasChange = true;
      // console.log('Right GamePad pose changed :', this.gamepadPose);
    }
  }

  render(that) {
    if (_.size(that.controllers) > 0) {
      _.each(that.controllers, (c) => {
        c.update();

        let gamepad = null;
        if (that.controllers[0]) {
          gamepad = that.controllers[0].getGamepad();
          if (gamepad) {
            that.rightControllerPoseStream.next(gamepad.pose);
            that.buttonXStream.next(gamepad.buttons[3].pressed);
            that.buttonYStream.next(gamepad.buttons[4].pressed);
            that.rightStickStream.next(gamepad.axes);

            that.updateGamepadPose(null, gamepad.pose);
          }
        }
        if (that.controllers[1]) {
          gamepad = that.controllers[1].getGamepad();
          if (gamepad) {
            that.leftControllerPoseStream.next(gamepad.pose);
            that.buttonAStream.next(gamepad.buttons[3].pressed);
            that.buttonBStream.next(gamepad.buttons[4].pressed);
            that.leftStickStream.next(gamepad.axes);

            that.updateGamepadPose(gamepad.pose, null);
          }
        }
      });
    }

    if (that.vrControls) {
      that.vrControls.update();
    }

    if (that.vrEffect) {
      that.vrEffect.render(that.parent, that.camera);
    }
  }

  on(name, callback) {
    this.events[name] = callback;
  }

  trigger(name, data) {
    if (this.events[name]) {
      this.events[name](data);
    }
  }

  isAvailable() {
    return navigator.getVRDisplays !== undefined;
  }
}

export default VR;
