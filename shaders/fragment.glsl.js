const fragment = `
//declared variables
varying float vNoise;
varying vec2 vUv;
uniform sampler2D uImage;
uniform float time;


   void main(){
    
    vec2 newUV = vUv;

    vec4 picView = texture2D(uImage, newUV);

    gl_FragColor = vec4(vUv, 0., 1.);

    gl_FragColor = picView;
    gl_FragColor.rgb += 0.05*vec3(vNoise);

   }
   `;

export default fragment;
