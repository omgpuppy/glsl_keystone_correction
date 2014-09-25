
class TriMesh {

  PVector pos;
  float wid, hei;
  PVector[] corners;
  int lod;
  PShape shp;

  TriMesh () {
    pos = new PVector (width/2.0, height/2.0);
    wid = width/2.0;
    hei = height/2.0;
    corners = new PVector[4];
    corners[0] = new PVector(0, 0);
    corners[1] = new PVector(1, 0);
    corners[2] = new PVector(1, 1);
    corners[3] = new PVector(0, 1);
    lod = 0;
    gen_mesh();
  }

  TriMesh (PVector p, float w, float h) {
    pos = p.get();
    wid = w;
    hei = h;
    corners = new PVector[4];
    corners[0] = new PVector(0, 0);
    corners[1] = new PVector(1, 0);
    corners[2] = new PVector(1, 1);
    corners[3] = new PVector(0, 1);
    lod = 0;
    gen_mesh();
  }

  void set_lod (int l) {
    lod = max(0, l);
    gen_mesh();
  }

  void set_pos (PVector p) {
    pos = p.get();
  }

  void set_size (float w, float h) {
    wid = w;
    hei = h;
    gen_mesh();
  }

  void set_corners (PVector bl, PVector br, PVector tr, PVector tl) {
    corners[0] = bl;
    corners[1] = br;
    corners[2] = tr;
    corners[3] = tl;
    gen_mesh();
  }

  PVector get_real_pos (PVector p) {
    PVector oot = p.get();
    oot.x *= wid;
    oot.y *= -hei;
    PVector BL = new PVector(-wid * 0.5, hei * 0.5);
    oot.add(BL);
    return oot;
  }

  PVector get_norm_pos (PVector p) {
    PVector oot = p.get();
    PVector BL = new PVector(-wid * 0.5, hei * 0.5);
    oot.sub(BL);
    oot.x /= wid;
    oot.y /= -hei;
    return oot;
  }

  int i_pow (int b, int p) {
    int oot = 1;
    for (int i = 0; i < p; i++)
      oot *= b;
    return oot;
  }

  void gen_mesh () {
    PVector BL = get_real_pos (corners[0]);
    PVector BR = get_real_pos (corners[1]);
    PVector TR = get_real_pos (corners[2]);
    PVector TL = get_real_pos (corners[3]);
    int n = i_pow(2, lod);
    shp = createShape (GROUP);
    for (int j = 0; j < n; j++) {
      PShape s = createShape();
      s.beginShape (TRIANGLE_STRIP);
      s.fill(150, 0, 150, 35);
      s.stroke(255, 255);
      float vProgB = float(j)/float(n);
      float vProgT = float(j+1)/float(n);
      PVector row_BL = PVector.lerp(BL, TL, vProgB);
      PVector row_TL = PVector.lerp(BL, TL, vProgT);
      PVector row_BR = PVector.lerp(BR, TR, vProgB);
      PVector row_TR = PVector.lerp(BR, TR, vProgT);
      for (int i = 0; i <= n; i++) {
        float hProg = float(i)/float(n);
        PVector top = PVector.lerp(row_TL, row_TR, hProg);
        PVector bottom = PVector.lerp(row_BL, row_BR, hProg);
        s.vertex(top.x, top.y, hProg, 1.0-vProgT);
        s.vertex(bottom.x, bottom.y, hProg, 1.0-vProgB);
      }
      s.endShape();
      shp.addChild(s);
    }
  }

  void display() {
    pushMatrix();
    translate(pos.x, pos.y);
    shape(shp);
    popMatrix();
  }
}

