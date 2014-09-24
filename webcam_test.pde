import processing.video.*;

boolean DO_CAPTURE = true;

PImage img;
Capture cam;

PVector TL, BL, BR, TR;
PShader morph;

KeystoneGlyph keyGlyph;

void setup() {
  size(1400, 800, P2D);
  textureWrap(REPEAT);

  if (DO_CAPTURE) {
    String[] cameras = Capture.list();

    if (cameras.length == 0) {
      println("There are no cameras available for capture.");
      exit();
    } else {
      println("Available cameras:");
      for (int i = 0; i < cameras.length; i++) {
        println(cameras[i]);
      }

      // The camera can be initialized directly using an 
      // element from the array returned by list():
      cam = new Capture(this, cameras[0]);
      cam.start();
    }
  }

  if (! DO_CAPTURE)
    img = loadImage ("/Users/abrowning/Desktop/silly/ab-glam-shot.png");

  morph = loadShader("morph.frag", "morph.vert");

  keyGlyph = new KeystoneGlyph ();
}

void draw() {
  background (0);

  if (DO_CAPTURE) {
    if (cam.available() == true) {
      cam.read();
    }
  }

  PImage px_src = DO_CAPTURE ? cam : img;
  float half_screen_asp = (width/2.0) / (float)height; 
  float asp = half_screen_asp;
  if (px_src.width > 0 && px_src.height > 0)
    asp = px_src.width / (float)px_src.height;
  float w, h, dx, dy;
  if (asp > half_screen_asp) {// wider
    w = width / 2.0;
    h = w / asp;
    dx = 0;
    dy = (height - h) / 2.0;
  } else {
    h = height;
    w = h * asp;
    dx = (width/2.0 - w) / 2.0;
    dy = 0;
  }

  keyGlyph.cent = new PVector (dx+w/2.0, dy+h/2.0);
  keyGlyph.wid = w;
  keyGlyph.hei = h;

  resetShader();
  image(px_src, dx, dy, w, h);

  //morph.set("time", millis() / 1000.0);
  morph.set("texture", cam);
  morph.set("resolution", float(px_src.width), float(px_src.height));

//  morph.set("TL", 0.0, 0.0);
//  morph.set("BL", 0.0, 1.0);
//  morph.set("BR", 1.0, 1.0);
//  morph.set("TR", 1.0, 0.0);

  PVector p = keyGlyph.points.get(0).get();
  morph.set("TL", p.x, p.y);
  p = keyGlyph.points.get(1).get();
  morph.set("BL", p.x, p.y);
  p = keyGlyph.points.get(2).get();
  morph.set("BR", p.x, p.y);
  p = keyGlyph.points.get(3).get();
  morph.set("TR", p.x, p.y);


  shader(morph);
  image(DO_CAPTURE ? cam : img, (width/2.0)+dx, dy, w, h);

  resetShader();
  keyGlyph.display();
}

int grabbed = -1;
void mousePressed() {
  grabbed = keyGlyph.closest_point(new PVector(mouseX, mouseY));
  println("DOWN -> "+grabbed);
}

void mouseReleased() {
  println("UP");
  grabbed = -1;
}

void mouseDragged() {
  PVector p = keyGlyph.points.get(grabbed);
  p = keyGlyph.get_real_pos(p);
  p.add(new PVector (mouseX-pmouseX, mouseY-pmouseY));
  p = keyGlyph.get_norm_pos(p);
  keyGlyph.points.set(grabbed, p);
}
