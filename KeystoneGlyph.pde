
class KeystoneGlyph {

  PVector cent;
  float wid, hei;
  ArrayList <PVector> points;

  KeystoneGlyph () {
    cent = new PVector (width/2.0, height/2.0);
    wid = width;
    hei = height;
    points = new ArrayList <PVector> ();
    points.add(new PVector (0.0, 0.0));
    points.add(new PVector (1.0, 0.0));
    points.add(new PVector (1.0, 1.0));
    points.add(new PVector (0.0, 1.0));
  }

  KeystoneGlyph (float _x, float _y, float _w, float _h) {
    cent = new PVector (_x, _y);
    wid=_w;
    hei=_h;
    points = new ArrayList <PVector> ();
    points.add(new PVector (0.0, 0.0));
    points.add(new PVector (1.0, 0.0));
    points.add(new PVector (1.0, 1.0));
    points.add(new PVector (0.0, 1.0));
  }

  void display() {
    stroke (0);
    fill (0);
    for (int i = 0; i < points.size (); i++) {
      PVector pA = get_real_pos (points.get(i));
      PVector pB = get_real_pos (points.get((i+1)%points.size()));
      line (pA.x, pA.y, pB.x, pB.y);
    }
    noStroke();
    fill(255, 100);
    int i=0;
    for (PVector p : points) {
      if (i == 0)
        fill (255, 0, 0, 100);
      else if (i == 1)
        fill (0, 255, 0, 100);
      else if (i == 2)
        fill (0, 0, 255, 100);
      else if (i == 3)
        fill (255, 100);
      PVector pA = get_real_pos(p);
      ellipse(pA.x, pA.y, 20, 20);
      i += 1;
    }
  }

  PVector get_real_pos (PVector p) {
    PVector oot = p.get();
    oot.x *= wid;
    oot.y *= -hei;
    PVector BL = cent.get();
    BL.sub(new PVector(wid * 0.5, -hei * 0.5));
    oot.add(BL);
    return oot;
  }

  PVector get_norm_pos (PVector p) {
    PVector oot = p.get();
    PVector BL = cent.get();
    BL.sub(new PVector(wid * 0.5, -hei * 0.5));
    oot.sub(BL);
    oot.x /= wid;
    oot.y /= -hei;
    return oot;
  }

  int closest_point (PVector hit) {
    float dist = MAX_FLOAT;
    int i = 0;
    int closest = -1;
    for (PVector p : points) {
      float d = hit.dist(get_real_pos(p));
      if (d < dist) {
        dist = d;
        closest = i;
      }
      i += 1;
    }
    return closest;
  }

  //  void set_point (int pi, PVector p) {
  //    points.get(pi) = p.get();
  //  }
  //  
  //  void move_point (int pi, float dx, float dy) {
  //    float ndx = dx / wid;
  //    float ndy = dy / hei;
  //    PVector pi =  
  //  }
}

