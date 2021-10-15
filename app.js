import * as THREE from "https://cdn.skypack.dev/three@0.133.1";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.133.1/examples/jsm/controls/OrbitControls.js";
import fragment from "./shaders/fragment.glsl.js";
import vertex  from "./shaders/vertex.glsl.js";
// import girl from "./img/girl.jpeg";

class Sketch {
  constructor(options) {
    this.time = 0;
    this.container = options.dom;
    //create scene
    this.scene = new THREE.Scene();

    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    //create camera
    this.camera = new THREE.PerspectiveCamera(
      70,
      this.width / this.height,
      100,
      2000
    );
    this.camera.position.z = 600;

    this.camera.fov = 2*Math.atan(( this.height / 2) / 600 )*(180/Math.PI);//merging dimensions of threeJs and browser screen

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    //get the details of the images
    this.images =[...document.querySelectorAll("img")];

    this.addImages();
    this.setPosition();
    this.resize();
    this.setupResize();
    this.addObjects();
    this.render();
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    //we are saying the viewport has changed and resize based on vieport
    this.camera.updateProjectionMatrix();
  }

  addImages() {
    this.imgCollection = this.images.map((img)=>{
      let bounds = img.getBoundingClientRect();

      let geometry = new THREE.PlaneBufferGeometry(bounds.width, bounds.height,1,1);
      let texture = new THREE.Texture(img);
      texture.needsUpdate = true;
      let material = new THREE.MeshBasicMaterial({map: texture});
      
      let mesh = new THREE.Mesh(geometry, material);

      this.scene.add(mesh);

       return{
         img: img,
         mesh: mesh,
         top: bounds.top,
         left: bounds.left,
         width: bounds.width,
         height: bounds.height
       }
    })
  }

  setPosition(){
      this.imgCollection.forEach(img => {
      img.mesh.position.y = -img.top + this.height/2 - img.height/2;
      img.mesh.position.x = img.left - this.width/2 + img.width/2;
    })
  }

   //creating shaders
  addObjects() {
    this.geometry = new THREE.PlaneBufferGeometry(100, 100, 10, 10);
    // this.geometry = new THREE.SphereBufferGeometry(0.4,40, 40);
    this.material = new THREE.MeshNormalMaterial();

    //this shader material has couple of options
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        time: {value: 0},
        picTexture: {value: new THREE.TextureLoader().load("https://images.pexels.com/photos/2690323/pexels-photo-2690323.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260")},
      },
      side: THREE.DoubleSide,
      fragmentShader: fragment,
      vertexShader: vertex,
      wireframe: true,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);
  }

  render() {
    this.time += 0.05;
    this.mesh.rotation.x = this.time / 2000;
    this.mesh.rotation.y = this.time / 1000;

    this.material.uniforms.time.value = this.time;

    this.renderer.render(this.scene, this.camera);
    window.requestAnimationFrame(this.render.bind(this));
  }
}

new Sketch({
  dom: document.getElementById("container"),
});
