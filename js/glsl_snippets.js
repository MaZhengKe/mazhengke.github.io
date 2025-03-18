
import * as THREE from 'https://cdn.skypack.dev/pin/three@v0.142.0-gdaaABfl8LlJh6YarzQi/mode=imports/optimized/three.js';
// 跳动的心
const beatingHeart =
  `
// Created by inigo quilez - iq/2013
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 p = (2.0*fragCoord-iResolution.xy)/min(iResolution.y,iResolution.x);
    // background color
    vec3 bcol = vec3(1.0,0.8,0.7-0.07*p.y)*(1.0-0.25*length(p));
    // animate
    float tt = mod(iTime,1.5)/1.5;
    float ss = pow(tt,.2)*0.5 + 0.5;
    ss = 1.0 + ss*0.5*sin(tt*6.2831*3.0 + p.y*0.5)*exp(-tt*4.0);
    p *= vec2(0.5,1.5) + ss*vec2(0.5,-0.5);
    // shape
#if 0
    p *= 0.8;
    p.y = -0.1 - p.y*1.2 + abs(p.x)*(1.0-abs(p.x));
    float r = length(p);
	float d = 0.5;
#else
	p.y -= 0.25;
    float a = atan(p.x,p.y)/3.141593;
    float r = length(p);
    float h = abs(a);
    float d = (13.0*h - 22.0*h*h + 10.0*h*h*h)/(6.0-5.0*h);
#endif
	// color
	float s = 0.75 + 0.75*p.x;
	s *= 1.0-0.4*r;
	s = 0.3 + 0.7*s;
	s *= 0.5+0.5*pow( 1.0-clamp(r/d, 0.0, 1.0 ), 0.1 );
	vec3 hcol = vec3(1.0,0.5*r,0.3)*s;
    vec3 col = mix( bcol, hcol, smoothstep( -0.01, 0.01, d-r) );
    fragColor = vec4(col,1.0);
}
`;
const glsl_snippets = async (userShader, userUniforms) => {

  const vs = `
attribute vec4 position;
void main()	{
  gl_Position = position;
}
`;
  userShader = userShader || beatingHeart;

  // FROM shadertoy.com
  const shadertoyBoilerplate =
    `
// #extension GL_OES_standard_derivatives : enable
//#extension GL_EXT_shader_texture_lod : enable
#ifdef GL_ES
precision highp float;
#endif
uniform vec3      iResolution;
uniform float     iGlobalTime;
uniform float     iChannelTime[4];
uniform vec4      iMouse;
uniform vec4      iDate;
uniform float     iSampleRate;
uniform vec3      iChannelResolution[4];
uniform int       iFrame;
uniform float     iTimeDelta;
uniform float     iFrameRate;
struct Channel
{
    vec3  resolution;
    float time;
};
uniform Channel iChannel[4];
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform sampler2D iChannel2;
uniform sampler2D iChannel3;
void mainImage( out vec4 c,  in vec2 f );

float iTime = iGlobalTime;

${userShader}

void main( void ){
  vec4 color = vec4(0.0,0.0,0.0,1.0);
  mainImage( color, gl_FragCoord.xy );
  color.w = 1.0;
  gl_FragColor = color;
}
`;

  // const $ = document.querySelector.bind(document);
  // const THREE = await import("./three.module.js");


  const camera = new THREE.Camera();
  camera.position.z = 1;

  const scene = new THREE.Scene();

  const geometry = new THREE.BufferGeometry();
  const vertices = new Float32Array([
    -1, -1,0,
    1, -1,0,
    -1, 1,0,

    -1, 1,0,
    1, -1,0,
    1, 1,0]);
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));

  let uniforms = {
    iGlobalTime: { type: "f", value: 1.0 },
    iResolution: { type: "v3", value: new THREE.Vector3() },
  };

  // if (userUniforms) {
  //   const anotherUniforms = await userUniforms(THREE)
  //   uniforms = { ...uniforms, ...anotherUniforms };
  //   console.log(uniforms);
  // }

  const material = new THREE.RawShaderMaterial({
    uniforms: uniforms,
    vertexShader: vs,
    fragmentShader: shadertoyBoilerplate,
  });
  // const material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
  var mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  var renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  function resize(force) {
    var canvas = renderer.domElement;
    var dpr = 1; //window.devicePixelRatio;  // make 1 or less if too slow
    var width = canvas.clientWidth * dpr;
    var height = canvas.clientHeight * dpr;
    if (force || width != canvas.width || height != canvas.height) {
      renderer.setSize(width, height, false);
      uniforms.iResolution.value.x = renderer.domElement.width;
      uniforms.iResolution.value.y = renderer.domElement.height;
    }
  }
  let pause = false;
  window.addEventListener('click', function (e) {
    pause = !pause;
  }, false)

  let clock = new THREE.Clock();
  clock.start()

  function render() {
    if (!pause) {
      resize();
      uniforms.iGlobalTime.value += 0.01;
      renderer.render(scene, camera);
      if (clock && clock.getElapsedTime() > 0.4) {
        render = () => { }
      } else {
        clock = null
      }
    }
    requestAnimationFrame(render);
  }
  resize(true);
  render();
}

export {
  glsl_snippets
}
