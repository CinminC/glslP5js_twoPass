// Author:CMH
// Title:20220321_glsl GlassDistortion_v2(normal).qtz 

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform sampler2D u_tex0; //webcam
uniform sampler2D u_tex1; //pastFrame
//uniform sampler2D u_buffer1; //pass 1: optical flow
//uniform sampler2D u_buffer2; //pass 2


// Cellular noise ("Worley noise") in 2D in GLSL.
// Copyright (c) Stefan Gustavson 2011-04-19. All rights reserved.
// This code is released under the conditions of the MIT license.
// See LICENSE file for details.

// Permutation polynomial: (34x^2 + x) mod 289
vec3 permute(vec3 x) {
  return mod((34.0 * x + 1.0) * x, 289.0);
}

// Cellular noise, returning F1 and F2 in a vec2. returning closest point in .zw
// Standard 3x3 search window for good F1 and F2 values
vec4 cellularID(vec2 P) {
#define K 0.142857142857 // 1/7
#define Ko 0.428571428571 // 3/7
#define jitter 1.0 // Less gives more regular pattern
    vec2 Pi = mod(floor(P), 289.0);
    vec2 Pf = fract(P);
    vec3 oi = vec3(-1.0, 0.0, 1.0);
    vec3 of = vec3(-0.5, 0.5, 1.5);
    vec3 px = permute(Pi.x + oi);
    vec3 p = permute(px.x + Pi.y + oi); // p11, p12, p13
    vec3 ox = fract(p*K) - Ko;
    vec3 oy = mod(floor(p*K),7.0)*K - Ko;
    vec3 dx = Pf.x + 0.5 + jitter*ox;
    vec3 dy = Pf.y - of + jitter*oy;
    vec3 d1 = dx * dx + dy * dy; // d11, d12 and d13, squared
    p = permute(px.y + Pi.y + oi); // p21, p22, p23
    ox = fract(p*K) - Ko;
    oy = mod(floor(p*K),7.0)*K - Ko;
    dx = Pf.x - 0.5 + jitter*ox;
    dy = Pf.y - of + jitter*oy;
    vec3 d2 = dx * dx + dy * dy; // d21, d22 and d23, squared
    p = permute(px.z + Pi.y + oi); // p31, p32, p33
    ox = fract(p*K) - Ko;
    oy = mod(floor(p*K),7.0)*K - Ko;
    dx = Pf.x - 1.5 + jitter*ox;
    dy = Pf.y - of + jitter*oy;
    vec3 d3 = dx * dx + dy * dy; // d31, d32 and d33, squared
    
    // Modified to look for ID of closest neighbor
    float f1 = d1.x;
    vec2 ci = vec2(Pi.x - 1.0, Pi.y - 1.0);
    if (d1.y < f1) { f1 = d1.y; ci = vec2(Pi.x - 1.0, Pi.y); }
    if (d1.z < f1) { f1 = d1.z; ci = vec2(Pi.x - 1.0, Pi.y + 1.0); }
    if (d2.x < f1) { f1 = d2.x; ci = vec2(Pi.x      , Pi.y - 1.0); }
    if (d2.y < f1) { f1 = d2.y; ci = vec2(Pi.x      , Pi.y); }
    if (d2.z < f1) { f1 = d2.z; ci = vec2(Pi.x      , Pi.y + 1.0); }
    if (d3.x < f1) { f1 = d3.x; ci = vec2(Pi.x + 1.0, Pi.y - 1.0); }
    if (d3.y < f1) { f1 = d3.y; ci = vec2(Pi.x + 1.0, Pi.y); }
    if (d3.z < f1) { f1 = d3.z; ci = vec2(Pi.x + 1.0, Pi.y + 1.0); }
    
    // Sort out the two smallest distances (F1, F2)
    vec3 d1a = min(d1, d2);
    d2 = max(d1, d2); // Swap to keep candidates for F2
    d2 = min(d2, d3); // neither F1 nor F2 are now in d3
    d1 = min(d1a, d2); // F1 is now in d1
    d2 = max(d1a, d2); // Swap to keep candidates for F2
    d1.xy = (d1.x < d1.y) ? d1.xy : d1.yx; // Swap if smaller
    d1.xz = (d1.x < d1.z) ? d1.xz : d1.zx; // F1 is in d1.x
    d1.yz = min(d1.yz, d2.yz); // F2 is now not in d2.yz
    d1.y = min(d1.y, d1.z); // nor in  d1.z
    d1.y = min(d1.y, d2.x); // F2 is in d1.y, we're done.
        
    return vec4(sqrt(d1.xy), mod(ci, 289.0));
}


vec3 cellularNormal(vec2 P) {
    vec2 C = cellularID(P).xy;
    vec2 L = cellularID(P-vec2(0.1,0.0)).xy;
    vec2 D = cellularID(P-vec2(0.0,0.1)).xy;
    vec3 normal;
    if (true){
    float facets    = abs(C.y-C.x);
    float facetsX = abs(L.y-L.x);
    float facetsY = abs(D.y-D.x);
        normal = vec3(facets - facetsX, facets - facetsY, 0.1);} //凹
        else normal = vec3(C.x-L.x, C.x-D.x, 0.1);            //凸
    return normal ;
}

vec2 cellularNormalDistort(vec2 uv, float motionFreq)
{
float motionScale=120.0;
//float motionFreq=40.0;
vec2 motionVector= cellularNormal((uv*motionFreq-u_time*vec2(0.,0.))).xy; //redＸ軸正負速度、greenY軸正負速度 
uv = (1.0/u_resolution.xy)*motionScale*motionVector;
return uv;
}


float mouseEffect(vec2 uv, vec2 mouse, float size)
{
    float dist=length(uv-mouse);
    return 1.-smoothstep(size*1.9, size, dist);  //size
    //return pow(dist, 0.5);
}

void main() {
    vec2 st = 1.0-gl_FragCoord.xy/u_resolution.xy;          //screen coordinate
    vec2 mouse=u_mouse.xy/u_resolution.xy;
    mouse.x=1.0-mouse.x;

    float breathing=(exp(sin(u_time*2.0*3.14159/5.0)) - 0.36787944)*0.42545906412; 
    float value=mouseEffect(st,mouse,0.05*breathing+0.07);
    
    float sizeBrick=80.0;  //是否＝motionFreq
    vec2 uv= st+cellularNormalDistort(st, sizeBrick)*value;    //以Worley noise計算Normal，再計算Motion Vector

    vec3 col = texture2D(u_tex0, uv).rgb;     //整合uv偏移
    gl_FragColor = vec4(vec3(col), 1.0);
}



