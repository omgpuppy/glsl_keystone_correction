#ifdef GL_ES
precision mediump float;
precision mediump int;
#endif

#define PROCESSING_TEXTURE_SHADER
//#define DEBUG_MESH_RESOLUTION

uniform sampler2D texture;

uniform vec2 TL;
uniform vec2 BL;
uniform vec2 BR;
uniform vec2 TR;

uniform int tri_levels;

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

// flip horizontally
vec2 flip_vec (vec2 v) {
  return (vec2 (0.0, 1.0) - v) * vec2(-1.0, 1.0);
}

// integer exponentiation base ^ pwr
int i_pow (int base, int pwr) {
  int oot = 1;
  for (int i = 0; i < pwr; i++)
    oot *= base;
  return oot;
}

// 2D cross product
float cross2 (vec2 a, vec2 b) {
  return cross (vec3 (a.x, a.y, 0.0), vec3 (b.x, b.y, 0.0)).z;
}

// intersection of 2 lines A & B given by 2 points on each
vec2 intersect (vec2 a0, vec2 a1, vec2 b0, vec2 b1) {
  vec2 p = a0;
  vec2 r = a1 - a0;
  vec2 q = b0;
  vec2 s = b1 - b0;
  float t = cross2((q - p), s) / cross2(r, s);
  return p + t * r;
}


// multi-resolution triangular grid sampling
//  - binary division of quadrilateral formed by [_BL,_BR,_TR,_TL]
//  - p is UV sample point for which you want the point of the intersected triangle
//  - ori, exp define UV boundary of quad
//  - selected gives indecies for sub-quad & sub-triangle for the found triangle
void get_wedge (int level,
                vec2 p,
                vec2 ori, vec2 ext,
                vec2 _BL, vec2 _BR, vec2 _TR, vec2 _TL,
                out vec2 p0, out vec2 p1, out vec2 p2,
                out ivec3 selected) {

  int jumps_per_div = 0;
  int xx = 0;
  int yy = 0;
  for (int i = level-1; i >= 0; i--) {

    jumps_per_div = i_pow(2,i);

    // pick quad
    //  - adjust ori, ext
    //  - adjust bl, br, tr, tl
    vec2 new_BL, new_BR, new_TR, new_TL;
    vec2 new_ori, new_ext;
    vec2 np = p - ori;
    vec2 dee = ext - ori;
    vec2 half_dee = 0.5 * dee;
    if (np.s < half_dee.s) {   // left
      if (np.t < half_dee.t) { // down
        new_ori = ori;
        new_ext = new_ori + half_dee;
        new_BL = _BL;
        new_BR = _BL + 0.5 * (_BR - _BL);
        new_TL = _BL + 0.5 * (_TL - _BL);

        vec2 TTR = _TL + 0.5 * (_TR - _TL);
        vec2 RTR = _BR + 0.5 * (_TR - _BR);
        new_TR = intersect (new_BR, TTR, new_TL, RTR);
      } else {                 // up

        yy += jumps_per_div;

        new_ori = ori + vec2 (0.0, half_dee.t);
        new_ext = new_ori + half_dee;

        new_TL = _TL;
        new_BL = _TL + 0.5 * (_BL - _TL);
        new_TR = _TL + 0.5 * (_TR - _TL);

        vec2 BBR = _BL + 0.5 * (_BR - _BL);
        vec2 RBR = _TR + 0.5 * (_BR - _TR);
        new_BR = intersect (new_BL, RBR, new_TR, BBR);
      }
    } else {                   // right

      xx += jumps_per_div;

      if (np.t < half_dee.t) { // down
        new_ori = ori + vec2 (half_dee.s, 0.0);
        new_ext = new_ori + half_dee;
        new_BR = _BR;
        new_TR = _BR + 0.5 * (_TR - _BR);
        new_BL = _BR + 0.5 * (_BL - _BR);

        vec2 TTL = _TR + 0.5 * (_TL - _TR);
        vec2 LTL = _BL + 0.5 * (_TL - _BL);
        new_TL = intersect (new_TR, LTL, new_BL, TTL);
      } else {                 // up

        yy += jumps_per_div;

        new_ori = ori + half_dee;
        new_ext = new_ori + half_dee;
        new_TR = _TR;
        new_BR = _TR + 0.5 * (_BR - _TR);
        new_TL = _TR + 0.5 * (_TL - _TR);

        vec2 BBL = _BR + 0.5 * (_BL - _BR);
        vec2 LBL = _TL + 0.5 * (_BL - _TL);
        new_BL = intersect (new_BR, LBL, new_TL, BBL);
      }
    }

    ori = new_ori;
    ext = new_ext;
    _BL = new_BL;
    _BR = new_BR;
    _TR = new_TR;
    _TL = new_TL;
  }

  selected.x = xx;
  selected.y = yy;

  // base case -> pick the triangle
  vec2 np = p - ori;
  if (np.s > np.t) { // lower
    p0 = _BL;
    p1 = _BR;
    p2 = _TR;
    selected.z = 0;
  } else {           // upper
    p0 = _BL;
    p1 = _TR;
    p2 = _TL;
    selected.z = 1;
  }
  return;
}

// convenience version that starts the origin & extent UVs at [0,0] & [1,1]
void get_wedge (int level, vec2 p,
                vec2 _BL, vec2 _BR, vec2 _TR, vec2 _TL,
                out vec2 p0, out vec2 p1, out vec2 p2,
                out ivec3 selected) {
  get_wedge (level, p, vec2(0,0), vec2(1,1), _BL, _BR, _TR, _TL, p0, p1, p2, selected);
}


void main(void) {

  // normalize tex coords to [0, 1] with BL origin
  vec2 tc_norm = vertTexCoord.st;

  // flip tex coords along y axis (ugh...Processing coordinate frame...)
  tc_norm = flip_vec(tc_norm);

  // points of interpolating triangle
  vec2 p0, p1, p2;

  ivec3 selA, selB;

  // get triangle we're interpolating
  get_wedge (tri_levels, tc_norm,
             vec2(0,0), vec2(1,0), vec2(1,1), vec2(0,1),
             p0, p1, p2,
             selA);

  // get barycentric coords
  vec3 bary_coords = compute_bary_coords (tc_norm, p0, p1, p2);

  // get corresponding triangle in warped quadrilateral
  get_wedge (tri_levels, tc_norm,
             BL, BR, TR, TL,
             p0, p1, p2,
             selB);

  // compute warped texture coord from bary coords
  vec3 xVec = vec3 (p0.x, p1.x, p2.x);
  vec3 yVec = vec3 (p0.y, p1.y, p2.y);
  vec2 warped_tex_coords = vec2 (dot(xVec, bary_coords), dot(yVec, bary_coords));
  warped_tex_coords = flip_vec (warped_tex_coords);

  // debugging to tease apart Processing's inverted y axis nonsense...
  vec4 adj_clr = vec4(1.0 * tc_norm.s * tc_norm.t, 1.0*tc_norm.s, 1.0*tc_norm.t, 1.0);
  adj_clr = vec4 (1.0);

  gl_FragColor = texture2D(texture, warped_tex_coords) * adj_clr;

#ifdef DEBUG_MESH_RESOLUTION
  if (selA == ivec3 (1,1,1))
    gl_FragColor = mix (gl_FragColor, vec4 (0,1,0,1), 0.25);
#endif
}
