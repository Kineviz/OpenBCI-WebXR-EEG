class VRPoseControl {
  constructor(scene, vr) {
    this.scene = scene;
    this.vr = vr;
  }

  startPoseControl() {
    const sbL = this.vr.leftGripStream;
    const sbR = this.vr.rightGripStream;

    const poseL = this.vr.leftControllerPoseStream;
    const poseR = this.vr.rightControllerPoseStream;

    const poseControlStream = Rx.Observable.combineLatest(sbL, sbR)
        .debounce(ev => Rx.Observable.interval(0))
        .map(d => (d[0] === d[1] && d[1] === 'down'));

    const strm = poseControlStream.filter(d => d).flatMap((x) => {
      const rStartPos = this.vr.controllers[0].getGamepad().pose.position;
      const lStartPos = this.vr.controllers[1].getGamepad().pose.position;
      const L = new THREE.Vector3(...lStartPos);
      const R = new THREE.Vector3(...rStartPos);
      const offsetDir = R.clone().sub(L).normalize();
      const start = {
        L,
        R,
        scenePos: this.scene.position.clone(),
        sceneScale: this.scene.scale.clone(),
        offsetDir: offsetDir,
        quaternion: this.scene.quaternion.clone(),
      };

      return Rx.Observable.combineLatest(poseR, poseL)
        .map((y) => {
          return {
            start: start,
            current: {
              L: new THREE.Vector3(...y[1].position),
              R: new THREE.Vector3(...y[0].position),
            },
          };
        })
        .takeUntil(poseControlStream);
    })

    strm.subscribe(this.poseChange.bind(this));
  }

  poseChange(change){
    const start = change.start
    const current = change.current

    const startMeanPos = start.L.clone().add(start.R).divideScalar(2)
    const currentMeanPos = current.L.clone().add(current.R).divideScalar(2)

    const shift = currentMeanPos.clone().sub(startMeanPos).multiplyScalar(5.0)
    this.scene.position.copy(start.scenePos.clone().add(shift))

    const startDist = start.L.distanceTo(start.R)
    const currentDist = current.L.distanceTo(current.R)

        let s = start.sceneScale
        let ratio = currentDist / startDist
        this.scene.scale.set(s.x*ratio, s.y*ratio, s.z*ratio)

    let offsetDir = current.R.clone().sub(current.L).normalize()
    let quaternion = new THREE.Quaternion()
    quaternion.setFromUnitVectors(start.offsetDir, offsetDir)
    this.scene.quaternion.copy(quaternion.multiply(start.quaternion))
  }
}

export default VRPoseControl;
