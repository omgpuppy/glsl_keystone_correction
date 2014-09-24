#ifdef GL_ES
precision mediump float;
precision mediump int;
#endif

//#define PROCESSING_TEXTURE_SHADER

uniform sampler2D texture;

uniform float time;
uniform vec2 resolution;

uniform vec2 TL;
uniform vec2 BL;
uniform vec2 BR;
uniform vec2 TR;

varying vec4 vertColor;
varying vec4 vertTexCoord;

// compute barycentric coords
vec3 compute_bary_coords(vec2 p, vec2 c0, vec2 c1, vec2 c2) {
  vec3 bary_coords;
  float denom = (c1.y - c2.y) * (c0.x - c2.x) + (c2.x - c1.x) * (c0.y - c2.y);
  bary_coords.x = ((c1.y - c2.y) * (p.x - c2.x) + (c2.x - c1.x) * (p.y - c2.y)) / denom;
  bary_coords.y = ((c2.y - c0.y) * (p.x - c2.x) + (c0.x - c2.x) * (p.y - c2.y)) / denom;
  bary_coords.z = 1.0 - bary_coords.x - bary_coords.y;
  return bary_coords;
}

void main(void) {

  // normalize tex coords to [0, 1]
  vec2 tc_norm = vertTexCoord.st;
  tc_norm = (vec2 (0.0, 1.0) - tc_norm) * vec2(-1.0, 1.0);

  // points of triangle
  vec2 p0, p1, p2;

  // first, which triangle are we in?
  bool in_upper_tri = tc_norm.s < tc_norm.t;
  if (in_upper_tri) {          // upper -> BL -> TR -> TL
    p0 = vec2 (0, 0);
    p1 = vec2 (1.0, 1.0);
    p2 = vec2 (0.0, 1.0);
  } else {                     // lower : BL -> BR -> TR
    p0 = vec2 (0, 0);
    p1 = vec2 (1.0, 0.0);
    p2 = vec2 (1.0, 1.0);
  }

  // get barycentric coords
  vec3 bary_coords = compute_bary_coords (tc_norm, p0, p1, p2);

  // compute warped texture coord from bary coords
  if (in_upper_tri) {
    p0 = BL;
    p1 = TR;
    p2 = TL;
  } else {
    p0 = BL;
    p1 = BR;
    p2 = TR;
  }

  vec3 xVec = vec3 (p0.x, p1.x, p2.x);
  vec3 yVec = vec3 (p0.y, p1.y, p2.y);
  vec2 warped_tex_coords = vec2 (dot(xVec, bary_coords), dot(yVec, bary_coords));
  //warped_tex_coords_norm.y = 1.0 - warped_tex_coords_norm.y;
  //vec2 warped_tex_coords = warped_tex_coords_norm * resolution;

  gl_FragColor = texture2D(texture, warped_tex_coords) * vertColor;
  //gl_FragColor = texture2D(texture, vertTexCoord.st) * vertColor;
  //gl_FragColor = texture2D(texture, st) * vertColor;

  //gl_FragColor = vec4(1.0*vertTexCoord.t, 0.0, 0.0, 1.0);
}
