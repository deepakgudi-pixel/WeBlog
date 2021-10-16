import * as THREE from "https://cdn.skypack.dev/three@0.133.1";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.133.1/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from 'https://cdn.skypack.dev/three@0.133.1/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.skypack.dev/three@0.133.1/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'https://cdn.skypack.dev/three@0.133.1/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'https://cdn.skypack.dev/three@0.133.1/examples/jsm/postprocessing/UnrealBloomPass.js';




import fragment from "./shaders/fragment.glsl.js";
import vertex  from "./shaders/vertex.glsl.js";
import Scroll from "./scroll.js";


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

    this.camera.fov = 2*Math.atan(( this.height / 2) / 600 )*(180/Math.PI); //merging dimensions of threeJs and browser screen

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    //get the details of the images
    this.images =[...document.querySelectorAll("img")];

     //scroll 
    // window.addEventListener("scroll", ()=>{
    //   this.currentScroll= window.scrollY;
    //   this.setPosition();
    // })

    this.currentScroll = 0;
    this.scroll = new Scroll();

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

   
    this.addImages();
    this.setPosition();
    this.mouseMovement();
    this.resize();
    this.setupResize();
    // this.addObjects();
    this.composerPass();
    this.render();
  }

  //post processing
  composerPass(){
    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    //custom shader pass
    var counter = 0.0;
    this.myEffect = {
      uniforms: {
        "tDiffuse": { value: null },
        "scrollSpeed": { value: null },

      },
      vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix 
          * modelViewMatrix 
          * vec4( position, 1.0 );
      }
      `,
      fragmentShader: `
      uniform sampler2D tDiffuse;
      varying vec2 vUv;

      uniform float scrollSpeed;


      void main(){

        vec2 newUV = vUv;
        float area = smoothstep(0.4,0.,vUv.y);
        area = pow(area, 4.);  
        newUV.x -= (vUv.x - 0.5) * 0.1 * area * scrollSpeed ;
        
        gl_FragColor = texture2D( tDiffuse, newUV);

      }
      `
    }

    this.customPass = new ShaderPass(this.myEffect);
    this.customPass.renderToScreen = true;
    
    this.composer.addPass(this.customPass);
  }

  //mouse movement
  mouseMovement() {

    window.addEventListener("mousemove", (event)=>{
      this.mouse.x = ( event.clientX / this.width) * 2 - 1;
	    this.mouse.y = - ( event.clientY / this.height ) * 2 + 1;
     
    // update the picking ray with the camera and mouse position
	  this.raycaster.setFromCamera( this.mouse, this.camera );

	 // calculate objects intersecting the picking ray
	 const intersects = this.raycaster.intersectObjects( this.scene.children );
 
   if(intersects.length> 0){
    //  console.log(intersects[0]);
     let obj = intersects[0].object;
     obj.material.uniforms.hover.value = intersects[0].uv;
   }



    }, false);
    
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
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        time: {value: 0},
        uImage: {value: 0},
        hover: {value: new THREE.Vector2(0.5, 0.5)},
        hoverState: {value: 0},
      },
      side: THREE.DoubleSide,
      fragmentShader: fragment,
      vertexShader: vertex,
      // wireframe: true,
    });

      this.materials = [];

      this.imgCollection = this.images.map((img)=>{
      let bounds = img.getBoundingClientRect();

      let geometry = new THREE.PlaneBufferGeometry(bounds.width, bounds.height,10,10);
      let texture = new THREE.Texture(img);
      texture.needsUpdate = true;
      // let material = new THREE.MeshBasicMaterial({map: texture});
      
      let material = this.material.clone();

      img.addEventListener("mouseenter", ()=>{
           gsap.to(material.uniforms.hoverState,{
             duration:1,
             value: 1,
           })
      })

      img.addEventListener("mouseout", ()=>{
         gsap.to(material.uniforms.hoverState,{
           duration: 1,
           value: 0,
         })
      })



      this.materials.push(material);
     
      material.uniforms.uImage.value = texture;

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
  //postioning the image in threejs
  setPosition(){
      this.imgCollection.forEach(img => {
      img.mesh.position.y = this.currentScroll -img.top + this.height/2 - img.height/2;
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

    this.scroll.render();
    this.currentScroll = this.scroll.scrollToRender;
    this.setPosition();
    this.customPass.uniforms.scrollSpeed.value = this.scroll.speedTarget;  

    this.materials.forEach(m=>{
      m.uniforms.time.value = this.time;
    });

    // this.renderer.render(this.scene, this.camera);
    this.composer.render();
    window.requestAnimationFrame(this.render.bind(this));
  }
}

new Sketch({
  dom: document.getElementById("container"),
});
