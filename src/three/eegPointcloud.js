import deviceProfile from './devices/device01'
class EEGPointcloud {
  constructor(subScene) {
    this.dotScale = 5;
    this.subScene = subScene
    const textureLoader = new THREE.TextureLoader();
    const geometry = new THREE.BufferGeometry();

    const dataPoints = deviceProfile.length;
    const color = new THREE.Color();
    const vertex = new THREE.Vector3();
    const size = 0.1;

    let positions = new Float32Array(dataPoints * 3);
    let colors = new Float32Array(dataPoints * 3);
    let sizes = new Float32Array(dataPoints);

    for (let i = 0; i < dataPoints; i++) {
      vertex.x = deviceProfile[i].x;
      vertex.y = deviceProfile[i].y;
      vertex.z = deviceProfile[i].z;
      vertex.toArray(positions, i * 3);

      color.setHSL(1.0, 1.0, 1.0);
      color.toArray(colors, i * 3);

      sizes[i] = size;
    }

    geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.addAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    geometry.addAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Pointcloud sprite shader
    let material = new THREE.ShaderMaterial( {
      transparent: true,
      depthTest: false,
      uniforms: {
        color:   { value: new THREE.Color(0xFFFFFF) },
        texture: { value: textureLoader.load('textures/sprites/disc.png') }
      },
      vertexShader: require('./glsl/vertex.glsl'),
      fragmentShader: require('./glsl/fragment.glsl')
    } );

    this.points = new THREE.Points(geometry, material);
  }

  updateData(data) {
    let minV = 9
    let maxV = 15
    let meanV = (minV+maxV)/2
    _.each(data, (value, key) => {
      const idx = deviceProfile.findIndex(i => i.label === key);

      let inVal= parseFloat(value.freq)
      let tColor = new THREE.Color(
        this.mapRange(inVal, minV, maxV, 0, 1),
        this.mapRange(Math.abs(inVal - meanV), (maxV-minV)/2, 0, 0, 1 ),
        this.mapRange(inVal, maxV, minV, 0, 1)
      );

      tColor.toArray(this.points.geometry.attributes.customColor.array, idx*3)

      this.points.geometry.attributes.customColor.needsUpdate = true
      this.points.geometry.attributes.size.array[idx] = ((this.mapRange(parseFloat(value.int), 10, 70, 0.1, this.dotScale)) * (this.subScene.scale.x/10)) + 0.01;
      this.points.geometry.attributes.size.needsUpdate = true;
      this.points.geometry.needsUpdate = true;
    });

  }

  mapRange (inVal, inMin, inMax, outMin, outMax) {
		let a = inMax - inMin;
		let b = outMax - outMin;
    let outVal = (inVal - inMin) / a * b + outMin;
    outVal = outVal > outMax ? outMax : outVal
    outVal = outVal < outMin ? outMin : outVal
    return outVal
	}
}

export default EEGPointcloud;
