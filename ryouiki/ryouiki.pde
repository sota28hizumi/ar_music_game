import gab.opencv.*;  // OpenCVライブラリをインポート
import processing.video.*;  // ビデオキャプチャ用のライブラリをインポート
import java.util.ArrayList;  // ArrayListを使用するためのライブラリをインポート

Capture cam;  // カメラオブジェクトを宣言
OpenCV opencv;  // OpenCVオブジェクトを宣言
boolean objectDetected = false;  // オブジェクト検出フラグを初期化
int huemin=10;  // 色相の最小値を設定
int huemax=30;  // 色相の最大値を設定
int brimin=70;  // 明るさの最小値を設定（未使用）
int brimax=90;  // 明るさの最大値を設定（未使用）
int onbrackcount=0;  // 黒領域のカウントを初期化

int[] onbrackarray = new int[10];  // 黒領域の配列を宣言

void setup() {
  size(1280, 960);  // ウィンドウのサイズを設定
  cam = new Capture(this, 640, 480);  // カメラを640x480の解像度で初期化
  cam.start();  // カメラキャプチャを開始
  
  opencv = new OpenCV(this, 640, 480);  // OpenCVを640x480の解像度で初期化
  
  println("Camera opened successfully.");  // カメラの初期化成功メッセージを表示
}

void draw() {
  objectDetected = false;  // オブジェクト検出フラグをリセット
  
  if (cam.available() == true) {
    cam.read();  // カメラから新しいフレームを読み込む
  }
  
  opencv.loadImage(cam);  // カメラのフレームをOpenCVにロード
  
  opencv.gray();  // 画像をグレースケールに変換
  
  opencv.threshold(40);  // 二値化を行い、黒領域を抽出（しきい値40）
  
  PImage blackAreas = opencv.getSnapshot();  // 二値化された画像を取得
  blackAreas.filter(INVERT);  // 画像を反転し、黒領域を抽出
  
  opencv.loadImage(blackAreas);  // 反転した画像をOpenCVに再ロード
  opencv.dilate();  // 画像の白い領域を広げる（膨張）
  opencv.erode();  // 画像の白い領域を縮める（収縮）
  
  ArrayList<Contour> contours = opencv.findContours(true, false);  // 輪郭を検出
  
  Contour largestContour = null;  // 最大の輪郭を初期化
  float maxArea = 0;  // 最大の領域面積を初期化
  
  for (Contour contour : contours) {
    float area = contour.area();  // 各輪郭の面積を取得
    if (area > maxArea) {
      maxArea = area;  // 最大の面積を更新
      largestContour = contour;  // 最大の輪郭を更新
    }
  }
  
  PImage largestBlackArea = createImage(640, 480, RGB);  // 最大の黒領域を描画するための画像を作成
  largestBlackArea.loadPixels();  // ピクセルデータをロード
  for (int i = 0; i < largestBlackArea.pixels.length; i++) {
    largestBlackArea.pixels[i] = color(255);  // 背景を白に設定
  }
  largestBlackArea.updatePixels();  // ピクセルデータを更新
  
  if (largestContour != null) {
    largestBlackArea.loadPixels();  // ピクセルデータをロード
    for (int i = 0; i < largestBlackArea.pixels.length; i++) {
      largestBlackArea.pixels[i] = color(255);  // 背景を白に設定
    }
    
    PGraphics pg = createGraphics(largestBlackArea.width, largestBlackArea.height);  // グラフィックスオブジェクトを作成
    pg.beginDraw();
    pg.background(255);
    pg.fill(0);
    pg.noStroke();
    pg.beginShape();
    for (PVector point : largestContour.getPoints()) {
      pg.vertex(point.x, point.y);  // 最大の輪郭を描画
    }
    pg.endShape(CLOSE);
    pg.endDraw();
    
    largestBlackArea = pg.get();  // 描画した画像を取得
    largestBlackArea.updatePixels();  // ピクセルデータを更新
    
    for (int y = 0; y < largestBlackArea.height; y++) {
      for (int x = 0; x < largestBlackArea.width; x++) {
        if (largestBlackArea.pixels[y * largestBlackArea.width + x] == color(0)) {
          int pixelColor = cam.get(x, y);  // カメラのピクセル色を取得
          float hueValue = hue(pixelColor);  // 色相値を取得
          float brightnessValue = brightness(pixelColor);  // 明るさ値を取得

          if (hueValue >= huemin && hueValue <= huemax) {
            objectDetected = true;  // オブジェクトが検出されたことを示す
            break;
          }
        }
      }
      if (objectDetected) {
        break;
      }
    }
  }
  
  image(cam, 0, 0);  // カメラ映像を表示
  image(blackAreas, 640, 0);  // 二値化された画像を表示
  image(largestBlackArea, 0, 480);  // 最大の黒領域を表示
  
  if (objectDetected) {
    fill(255, 0, 0);
    textSize(32);
    text("Object Detected!", 10, height - 30);  // 検出結果を表示
  }
}
