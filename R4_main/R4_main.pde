//毎回ジャッジ、06の方は当たり判定に入ったときのみジャッジ
import processing.sound.*;
import gab.opencv.*;
import processing.video.*;
import java.awt.*;
import java.util.ArrayList;
import jp.nyatla.nyar4psg.*;

Capture cam;
OpenCV opencv;
MultiMarker nya;

boolean objectDetected = false;
boolean without = true;//ギターなし
int sist=0;
int ost=0;
int huemin=5;
int huemax=40;
int brimin=70;
int brimax=90;
int onbrackcount=0;
int Number_of_songs=10;//曲数
SoundFile[] soundFiles;
SoundFile[] drums;
String[] lines;
int notessize = 60;
boolean onplaying = false;
boolean music_gameset1=false,music_waiting=false;
boolean onmusic = false,onPremusic=true,resultset=false;
boolean rylicdrawing=false,renew_lines_flag=true;
boolean Amarker=false,Bmarker=false,Cmarker=false,Dmarker=false;
//死に設定
int Aline = 0;
int Bline = notessize + 10; // ラインの太さ
int Cline = 2 * (notessize + 10);
int Dline = 3 * (notessize + 10);
//
int selectedIndex = 0;
int  centerX ;
int  centerY ;
PImage[] NotesArray = new PImage[4];
PImage[] MusicBackArray = new PImage[Number_of_songs];
PImage processingback;
PImage title,start,LYRICS,exit,retry,guiter;

int speed = 10,cha=0;
int totalScore=0;
ArrayList<Float> timeArray;
ArrayList<Integer> markerArray;
ArrayList<Float> notePositions;
String[] options = {
    "Processing", "BAD UI", "Invisible Data", "婉曲モダリティ",
    "仮想領域現実感", "RW Interaction", "テン、二大原則", "Open CoVenant",
    "AdveNyAr!", "HCI"
};
int startTime;
int currentIndex;
int guitercount=0;
String[][] lyricsArray;
String[][] linesArray;//(追加0705吉岡)

int delayTime = 2000; // 遅延（画面左から判定バーまでの時間）(0703日隅)//なんで「左」だけフォント濃さ違うの？左左左右左左左ナエ
int musicStartTime; // 音楽再生開始時間
boolean musicStarted = false; // (0703日隅)

void setup() {
  size(1280, 960,P3D);
   PFont font = createFont("Meiryo", 50);
  soundFiles= new SoundFile[Number_of_songs];//Number_of_songsにする//した
  drums = new SoundFile[4];
 textFont(font);
  NotesArray[0] = loadImage("notesBlue.png");
  NotesArray[1] = loadImage("notesGreen.png");
  NotesArray[2] = loadImage("notesYellow.png");
  NotesArray[3] = loadImage("notesRed.png");
  
 // for (int i = 0; i < MusicBackArray.length; i++) {
   // MusicBackArray[i] = createImage(100, 100,100);  
  //}
  MusicBackArray[0]=loadImage("processingback.png");
  MusicBackArray[1]=loadImage("BADUIback.png");//後でループで書き換える
  MusicBackArray[2]=loadImage("invisible.png");
  MusicBackArray[3]=loadImage("modality.jpg");
  MusicBackArray[4]=loadImage("VR.jpg");
  MusicBackArray[5]=loadImage("real.jpg");//後で作る5
  MusicBackArray[7]=loadImage("opencv.jpg");
  MusicBackArray[8]=loadImage("nya.jpg");
  MusicBackArray[6]=loadImage("hourensou.png");
  MusicBackArray[9]=loadImage("HCI.png");
  //processingback = loadImage("title.png");
  start=loadImage("start.png");
  title=loadImage("title.png");
  LYRICS=loadImage("LYRICS.png");
  retry=loadImage("retry.png");
  exit=loadImage("exit.png");
  guiter=loadImage("guit.png");
  
  cam = new Capture(this, 1280/2, 960/2);
  //cam = new Capture(this, 1280, 960);
  cam.start();
  
  //opencv = new OpenCV(this, 1280, 960);
  opencv = new OpenCV(this, 1280/2, 960/2);
  
  startTime = millis(); // プログラムの開始時間を記録
  
  //for(int ln=0; ln<Number_of_songs;ln++){soundFiles[ln] = new SoundFile(this, "Processing.mp3");}
  soundFiles[0] = new SoundFile(this, "Processing.mp3");
  soundFiles[1] = new SoundFile(this, "BADUI.MP3");//Invisible Data
  soundFiles[2] = new SoundFile(this, "Invisible.MP3");
  soundFiles[3] = new SoundFile(this, "modality.mp3");
  soundFiles[4] = new SoundFile(this, "VR.MP3");
  soundFiles[5] = new SoundFile(this, "prophecy.MP3");//brain.mp3
  soundFiles[7] = new SoundFile(this, "code.MP3");
  soundFiles[6] = new SoundFile(this, "brain.mp3");
  soundFiles[8] = new SoundFile(this, "AR.MP3");
  soundFiles[9] = new SoundFile(this, "HCI.mp3");
  
  drums[0] = new SoundFile(this, "maou_se_inst_drum1_tom3.mp3");
  drums[1] = new SoundFile(this, "maou_se_inst_drum1_snare.mp3");
  drums[2] = new SoundFile(this, "maou_se_inst_drum1_cymbal.mp3");
  drums[3] = new SoundFile(this, "maou_se_inst_drum2_hat.mp3");
  
  centerX = width / 2;
  centerY = height / 2;
  /*
  
  */
  //歌詞描画初期設定
  lyricsArray = new String[Number_of_songs][];
  //for(int l=0; l<Number_of_songs;l++){lyricsArray [l] = loadStrings("processinglyric.txt");}
  lyricsArray[0]=loadStrings("processinglyric.txt");
  lyricsArray[1]=loadStrings("BADUIlyric.txt");
  lyricsArray[2]=loadStrings("Invisiblelyric.txt");
  lyricsArray[3]=loadStrings("modality.txt");
  lyricsArray[4]=loadStrings("VR.txt");
  lyricsArray[5]=loadStrings("prophecy.txt");
  lyricsArray[6]=loadStrings("brain.txt");
  lyricsArray[7]=loadStrings("opencv.txt");//keyLog_AR.txt
  lyricsArray[8]=loadStrings("nya.txt");
  lyricsArray[9]=loadStrings("HCI.txt");
  
  //ノーツ描画初期設定//////////////////////////////////////////
  timeArray = new ArrayList<Float>();
  markerArray = new ArrayList<Integer>();
  notePositions = new ArrayList<Float>();
  linesArray = new String[Number_of_songs][];
 // for(int l=0; l<Number_of_songs;l++){linesArray [l] = loadStrings("keyLog_processing.txt");}
  lines = loadStrings("keyLog_processing.txt");
  linesArray[0]=loadStrings("keyLog_processing.txt");
  linesArray[1]=loadStrings("keyLog_BADUI.txt");
  linesArray[2]=loadStrings("keyLog_invisible.txt");
  linesArray[3]=loadStrings("keyLog_modality.txt");
  linesArray[4]=loadStrings("keyLog_AR.txt");
  linesArray[5]=loadStrings("keyLog_prophecy.txt");
    linesArray[6]=loadStrings("keyLog_hourensou.txt");
  linesArray[7]=loadStrings("keyLog_opencv.txt");
  linesArray[8]=loadStrings("keyLog_nya.txt");//hourensou.jpg//keyLog_hourensou.txt
  linesArray[9]=loadStrings("keyLog_HCI.txt");
  for (String line : lines) {
    String[] parts = line.split(" ---- ");
    float time = Float.parseFloat(parts[0].split(" ")[1]);
    int marker = Integer.parseInt(parts[1]);
    
    timeArray.add(time);
    markerArray.add(marker);
    notePositions.add((float)70); // 初期位置を設定
    //soundFile.play();
  }
  //println(timeArray);
  ///////////////////////////////////////////////////////////////↑クラスができたら消す
  
    // NyARToolkit の設定 ここいじった(おのえ)
  nya = new MultiMarker(this,             // NyARToolkit の初期設定
             width,                      // カメラ画像の幅（ウィンドウの幅と同じ 640）
             height,                     // カメラ画像の高さ（ウィンドウの高さと同じ 480）
             "camera_para.dat",          // カメラの校正ファイル
             NyAR4PsgConfig.CONFIG_PSG); // nyar4psg を Processing 用に設定する決まり文句
  nya.addNyIdMarker(0, 80);               // 認識するマーカを登録する (ID, マーカの幅[mm])  ここから認識するマーカー4つ書いた
  nya.addNyIdMarker(1, 80);
  nya.addNyIdMarker(2, 80);
  nya.addNyIdMarker(3, 80);
}

void draw() {
  drawtitle();
  if (onplaying) {
   markerSearch();//おのえ
   //nya();//おのえ//一部改変しました(吉岡)
   drawInitialPlacement();
   preNOTESVOMPdraw();
   areaSearch();
   drawresult();
   if (objectDetected) {
    fill(255, 0, 0);
    textSize(32);
    text("Object Detected!", 10, height - 30);
  }
  }
   guitar();
  // Amarker=true;Bmarker=true;Cmarker=true;Dmarker=true;
   Amarker=false;Bmarker=false;Cmarker=false;Dmarker=false;
   //println(totalScore);
}
/////////////////////////////////////////

//////////////////////////////////////////////
void keyPressed() {
  //onplaying!=true
    
  if (music_gameset1 == true && key == ENTER) {
    soundFiles[selectedIndex].stop();
    music_gameset1 = false;
    renew_lines();
    onplaying = true;
  }
  // ノーツの当たり判定
  if (onplaying) {
    if (key == '1') {
      checkHit(0);
      drums[0].play();
    } else if (key == '2') {
      checkHit(1);
      drums[1].play();
    } else if (key == '3') {
      checkHit(2);
      drums[2].play();
    } else if (key == '4') {
      checkHit(3);
      drums[3].play();
    }
  }
  
}

void checkHit(int lane) {
  for (int i = 0; i < currentIndex; i++) {
    if (markerArray.get(i) == lane && notePositions.get(i) >= 0 && notePositions.get(i) < 130) {
      totalScore++;
      notePositions.set(i, -1000.0); // ノーツを無効にする
     // println("Hit! Total Score: " + totalScore);
      break;
    }
  }
}

    
  // ノーツの当たり判定処理
  /*
  for (int i = 0; i < notePositions.size(); i++) {
    if (notePositions.get(i) < 100) {
      if (key == 'A' && markerArray.get(i) == 0) {
        totalScore++;
        notePositions.set(i, Float.MAX_VALUE); // ノーツを画面外に移動させる
      } else if (key == 'S' && markerArray.get(i) == 1) {
        totalScore++;
        notePositions.set(i, Float.MAX_VALUE);
      } else if (key == 'D' && markerArray.get(i) == 2) {
        totalScore++;
        notePositions.set(i, Float.MAX_VALUE);
      } else if (key == 'F' && markerArray.get(i) == 3) {
        totalScore++;
        notePositions.set(i, Float.MAX_VALUE);
      }
    }
  }
  */

void mousePressed() {
  if(onplaying==false&&music_gameset1==false&&centerX-150<mouseX &&mouseX<centerX-150+300 && centerY+250<mouseY&& mouseY<centerY+250+100){//image(start,centerX-150,centerY+250,300,100);
    music_gameset1=true;
  }
  if (music_gameset1 == false && onplaying!=true&&dist(width *0.8+150/2, height *0.8+150/2,mouseX,mouseY)<150/2) {
    //image(guiter, width *0.8, height *0.8,150,150);
    guitercount=guitercount+1;
    if(guitercount%2==1){
      without=false;
    }else{
      without=true;
    }
    
  
  }
  if(music_gameset1==true&& 740<mouseX&&mouseY<1090&&500<mouseY&&mouseY<590){
  music_gameset1=false;
  soundFiles[selectedIndex].stop();
  onplaying=true;
  renew_lines();
}
//image(exit, width *0.8, height *0.85,170,170);
  if(resultset==true && dist(mouseX,mouseY,(width *0.8)+170/2, (height *0.85)+170/2)<170/2){
   // println(mouseX,mouseY,(width *0.8), (height *0.85));
    exit();
  }
 // image(retry, width *0.7, height *0.851,150,150);
  
    if(resultset==true && dist(mouseX,mouseY,width *0.7+150/2, height *0.851+150/2)<150/2){
    reset();
  }
  

}
void mouseWheel(MouseEvent event) {
  if(music_gameset1){
  float e = event.getCount();
  selectedIndex += e;
  if (selectedIndex < 0) {
    selectedIndex = options.length - 1;
  } else if (selectedIndex >= options.length) {
    selectedIndex = 0;
  }}
}

void drawtitle(){
    if(onplaying!=true){
      image(title, 0, 0,width,height);
      image(guiter, width *0.8, height *0.8,150,150);
      if(without){
        fill(255);
        textSize(30);
        text("guiter OFF",width *0.67, height *0.93);
      }else{
        fill(255);
        textSize(30);
      text("guiter ON",width *0.67, height *0.93);
    }
       if(music_gameset1==false){
       //←クロマキー合成ボタンとゲームタイトルの表示をここに後から追加する(吉岡)
      image(start,centerX-150,centerY+250,300,100);
      
    
  }
      else{
        fill(0, 0, 0, 200);
        rect(0,0,width,height);
        textSize(63);
        draw_musicOptions();
        //lyricDraw();
        image(LYRICS,width *0.9, height *0.85,120,120);
        if(dist(mouseX,mouseY,width *0.9+60, height *0.85+60)<60){
          rylicdrawing=true;
        }
        lyricDraw();
      }
  rylicdrawing=false;
  }

}
//選択肢の描画
 void draw_musicOptions(){
      fill(255);
      text("曲を選択してください",width *0.04, height *0.15);
     for (int i = -2; i <= 2; i++) {
    int optionIndex = selectedIndex + i;
    if (optionIndex >= 0 && optionIndex < options.length) {
      if (i == 0) {
        fill(250);
      } else {
        fill(150);
      }
      text(options[optionIndex], width *0.6, height *0.6 + i * 110);
     // println(selectedIndex);
      image(MusicBackArray[selectedIndex],30,270,700,600);
      if(onPremusic){
        soundFiles[selectedIndex].play();
        onPremusic=false;
      }
     // println(cha,selectedIndex);
     
      if(cha!=selectedIndex){////////////////ここ後で消す消すかも
        soundFiles[cha].stop();
        onPremusic=true;
        //println("changed");
    }
       cha=selectedIndex;
       
      
    }
  }
  drawresult();
 
 }
//譜面の配置
void drawInitialPlacement(){
    //image(processingback, 0, 0, width, height);
    if((!soundFiles[selectedIndex].isPlaying()&&onplaying==true&&musicStarted == true)==false){
    fill(90, 100);
    rect(0, 0, width, 4 * (notessize + 10));
    fill(0);
    for (int i = 0; i < 4; i++) {
      line(0, i * (notessize + 10), width, i * (notessize + 10));
      rect(70, i * (notessize + 5), (notessize + 5) / 2, notessize +23);///////////
    }}
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//流れるノーツの設定（drawnotes()で描画）

void preNOTESVOMPdraw(){
  sist=sist+speed;
  //println(width-sist);
  //if(/*width-sist<0&&*/ost==0){onmusic=true;}
   //if(/*width-sist<0&&*/ost==0){startTime = millis(); println("j");}// プログラムの開始時間を記録
  //if(onmusic){soundFiles[selectedIndex].play();onmusic=false;ost=1;}
    // ゲームの開始時間を設定
  if (ost == 0) { // (0703日隅)
    startTime = millis();
    ost = 1;
  }
    // 経過時間を計算
 
  int elapsedTime = millis() - startTime;//ゲームの開始時間
  float elapsedTimeSeconds = elapsedTime / 1000.0;//秒換算

  // ノーツを描画
  drawnotes();
  
  // 音楽の再生を遅らせる(0703日隅)
  if (!musicStarted && elapsedTime >= delayTime) {
    soundFiles[selectedIndex].play();
    musicStarted = true;
  }
  
  // 経過時間に対応するmarkerをコンソールに表示
  while(currentIndex < timeArray.size() && elapsedTimeSeconds >= timeArray.get(currentIndex)) {
    currentIndex++;
  }
  //println(currentIndex,elapsedTimeSeconds,timeArray.get(currentIndex),startTime/1000);
}
//流れるノーツの描画
void drawnotes() {
  for (int i = 0; i < currentIndex; i++) {
    notePositions.set(i, notePositions.get(i) - speed);
    if (notePositions.get(i) > -9999f) { // ノーツが画面外でない場合のみ描画
      image(NotesArray[markerArray.get(i)], notePositions.get(i), markerArray.get(i) * (notessize + 10), notessize, notessize);
    }
  
     // Nullチェック
    if (NotesArray == null) {
      println("NotesArray is null");
      return;
    }
    if (markerArray == null) {
      println("markerArray is null");
      return;
    }
    if (notePositions == null) {
      println("notePositions is null");
      return;
    }
    if (NotesArray[markerArray.get(i)] == null) {
      println("NotesArray[markerArray.get(i)] is null at index " + i);
      return;
    }
    if (markerArray.get(i) == null) {
      println("markerArray.get(i) is null at index " + i);
      return;
    }
    if (notePositions.get(i) == null) {
      println("notePositions.get(i) is null at index " + i);
      return;
    }
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////↑クラスができたら消す
//領域抽出、r4 draw()内コピペ(吉岡)
PImage blackAreas;
PImage largestBlackArea;

void areaSearch() {
  objectDetected = false;
  
  if (cam.available() == true) {
    cam.read();
  }
  
  opencv.loadImage(cam);
  
  // グレースケールに変換
  opencv.gray();
  
  // 黒領域を抽出（二値化）
  opencv.threshold(40);  // しきい値を調整して、より暗い領域を対象にする
  
  // 二値化された画像を反転して黒領域を抽出
  blackAreas = opencv.getSnapshot();
  blackAreas.filter(INVERT);
  
  // 形態素演算（膨張と収縮を行うことで閉じる処理を強化）
  opencv.loadImage(blackAreas);
  opencv.dilate();
  opencv.erode();
  
  // 輪郭を検出
  ArrayList<Contour> contours = opencv.findContours(true, false);
  
  // 最大の輪郭を見つける
  Contour largestContour = null;
  float maxArea = 0;
  
  for (Contour contour : contours) {
    float area = contour.area();
    if (area > maxArea) {
      maxArea = area;
      largestContour = contour;
    }
  }
  
  // 最大の輪郭を描画
  largestBlackArea = createImage(640, 480, RGB);
  largestBlackArea.loadPixels();
  for (int i = 0; i < largestBlackArea.pixels.length; i++) {
    largestBlackArea.pixels[i] = color(255); // 背景を白に設定
  }
  largestBlackArea.updatePixels();
  
  if (largestContour != null) {
    largestBlackArea.loadPixels();
    for (int i = 0; i < largestBlackArea.pixels.length; i++) {
      largestBlackArea.pixels[i] = color(255); // 背景を白に設定
    }
    
    PGraphics pg = createGraphics(largestBlackArea.width, largestBlackArea.height);
    pg.beginDraw();
    pg.background(255);
    pg.fill(0);
    pg.noStroke();
    pg.beginShape();
    for (PVector point : largestContour.getPoints()) {
      pg.vertex(point.x, point.y);
    }
    pg.endShape(CLOSE);
    pg.endDraw();
    
    largestBlackArea = pg.get();
    largestBlackArea.updatePixels();
    
    // 最大の黒領域内に色相10〜30の色があるか検出
    for (int y = 0; y < largestBlackArea.height; y++) {
      for (int x = 0; x < largestBlackArea.width; x++) {
        if (largestBlackArea.pixels[y * largestBlackArea.width + x] == color(0)) {
          int pixelColor = cam.get(x, y);
          float hueValue = hue(pixelColor);
          float brightnessValue = brightness(pixelColor); 

          if (hueValue >= huemin && hueValue <= huemax) {
            objectDetected = true;
            break;
          }
        }
      }
      if (objectDetected) {
        break;
      }
    }
  }
  /*
    image(cam, 0, 0);  // カメラ映像を表示
  image(blackAreas, 640, 0);  // 二値化された画像を表示
  image(largestBlackArea, 0, 480);  // 最大の黒領域を表示
  */
}
/*
void nya(){
  cam.read();
  nya.detect(cam);
  background(0);
  nya.drawBackground(cam);//frustumを考慮した背景描画
  for(int i=0;i<4;i++){ // i<4に変更
    if((nya.isExist(i))){
      continue;
    } 
   // println(i); //検出されていないマーカーをコンソールに表示　おのえ(06/27)
  }
}
*/

void markerSearch(){
  cam.read();
  nya.detect(cam);
  background(0);
  nya.drawBackground(cam);//frustumを考慮した背景描画
  for(int i=0;i<4;i++){ // i<4に変更
    if((nya.isExist(i))){
      continue;
    } 
  //println(i); //検出されていないマーカーをコンソールに表示　おのえ(06/27)//検出されているマーカーが出ます。(吉岡)//修正しておきました(吉岡)
    
    if(i==0){Amarker=true;}//Amarker=trueの時、マーカーは検出されていない＝押されている
    if(i==1){Bmarker=true;}
    if(i==2){Cmarker=true;}
    if(i==3){Dmarker=true;}
    
    /*
    if(i==0){Amarker=false;}//Amarker=trueの時、マーカーは検出されていない＝押されている
    if(i==1){Bmarker=false;}
    if(i==2){Cmarker=false;}
    if(i==3){Dmarker=false;}
  */
  }
}
/*
      text(options[optionIndex], width *0.6, height *0.6 + i * 110);
     // println(selectedIndex);
      image(MusicBackArray[selectedIndex],30,270,700,600);
*/
/*
  //歌詞描画初期設定
  lyricsArray = new String[Number_of_songs][];
  for(int l=0; l<Number_of_songs;l++){lyricsArray [l] = loadStrings("processinglyric.txt");}
  lyricsArray[0]=loadStrings("processinglyric.txt");
  lyricsArray[1]=loadStrings("BADUIlyric.txt");
  lyricsArray[2]=loadStrings("Invisiblelyric.txt");

*/
//selectedIndex

void lyricDraw(){
    if(rylicdrawing){
    fill(0, 0, 0, 190);
    rect(30,270,700,600);
    for (int i = 0; i < lyricsArray[selectedIndex].length; i++) {
    textSize(21);
    fill(230);
    if(i< lyricsArray[selectedIndex].length/2){
    text(lyricsArray[selectedIndex][i],40,300+30*i);}
    else{
    text(lyricsArray[selectedIndex][i],400,300+30*(i-(lyricsArray[selectedIndex].length/2)));}
    }
  }
}
void drawresult(){
   if(!soundFiles[selectedIndex].isPlaying()&&onplaying==true&&musicStarted == true){
       resultset=true; 
       //println(0);
       image(title, 0, 0,width,height);  
        fill(0, 0, 0, 200);
        rect(0,0,width,height);
        fill(255);
        textSize(108);
        int MaxScore=1000;
        int notes=MaxScore/lines.length;
        text("Score:     "+(totalScore*notes) +" points",width *0.04, height *0.1);
        textSize(60);
        String producer;
        String maincomment="a", subcomment="b"; //あおり文の変数　おのえ
        if(5<selectedIndex&&selectedIndex<8){
          producer="おのおの=おのえ";
          }
          else if(8<=selectedIndex&&selectedIndex<10){
          producer="ひずひず=ひずみ(32)";
          }
         else {producer="レオン";}
        //↓あおり文評価分岐　おのえ(7/11)
        if(0<=totalScore*notes&&totalScore*notes<250){
          maincomment="Keep trying.";
          subcomment= "Even a broken clock is right twice daily.";
        } else if(250<=totalScore*notes&&totalScore*notes<450) {      
          maincomment="Not bad.";
          subcomment= "Practice makes... well, less terrible.";
        } else if(500<=totalScore*notes&&totalScore*notes<750) { 
          maincomment="Good effort.";
          subcomment= " You almost didn't embarrass yourself.";          
        } else if(750<=totalScore*notes&&totalScore*notes<=1000) {
          maincomment="Perfect.";
          subcomment= " Did you pay off the judges?";          
        }
        text(options[selectedIndex],width *0.04, height *0.2);
        textSize(30);
        text("lyric.  "+producer+", ChatGPT  feat. Suno",width *0.08, height *0.26);
        image(MusicBackArray[selectedIndex],30,270,700,600);
        //↓あおり文　おのえ(7/11)
        textSize(30);
        text("Judge's comment...", 750, 290);
        textSize(60);
        text(maincomment, 750, 340);
        textSize(30);
        text(subcomment, 750, 390);
        
        textSize(40);
        text("Hit："+totalScore, width *0.6, height *0.6 );//lyricsArray[selectedIndex].length
        text("Lost："+(lines.length-totalScore), width *0.6, height *0.7 );//lyricsArray[selectedIndex].length
       image(retry, width *0.7, height *0.851,150,150);
       image(exit, width *0.8, height *0.85,170,170);
           if(resultset==true && dist(mouseX,mouseY,width *0.7+150/2, height *0.851-150/2)<150/2){
  //  println(00);
  }
   }
 }
/*
 void drawresult(){
   if(!soundFiles[selectedIndex].isPlaying()&&onplaying==true&&musicStarted == true){
       resultset=true; 
       //println(0);
       image(title, 0, 0,width,height);  
        fill(0, 0, 0, 200);
        rect(0,0,width,height);
        fill(255);
        textSize(108);
        int MaxScore=1000;
        int notes=MaxScore/lines.length;
        text("Score:     "+(totalScore*notes) +" points",width *0.04, height *0.1);
        textSize(60);
        String producer;
        if(5<selectedIndex&&selectedIndex<8){
          producer="おのおの=おのえ";
          }
          else if(8<=selectedIndex&&selectedIndex<10){
          producer="ひずひず=ひずみ(32)";
          }
         else {producer="レオン";}
        text(options[selectedIndex],width *0.04, height *0.2);
        textSize(30);
        text("lyric.  "+producer+", ChatGPT  feat. Suno",width *0.08, height *0.26);
        image(MusicBackArray[selectedIndex],30,270,700,600);
        textSize(40);
        text("Hit："+totalScore, width *0.6, height *0.6 );//lyricsArray[selectedIndex].length
        text("Lost："+(lines.length-totalScore), width *0.6, height *0.7 );//lyricsArray[selectedIndex].length
       image(retry, width *0.7, height *0.851,150,150);
       image(exit, width *0.8, height *0.85,170,170);
           if(resultset==true && dist(mouseX,mouseY,width *0.7+150/2, height *0.851-150/2)<150/2){
    println(00);
  }
   }
 }*/
 /*
 background(title_awai);
    //background(255,255,255,128);透過失敗
    fill(0); // 文字色を黒に設定
    textSize(40); // 文字のサイズを32ピクセルに設定
    text("Finish!!", 10, 50); //テキストを表示
    textSize(32);
    text("Time:  "+timer, 10, 80); //テキストを表示
    textSize(13);
    text("There are five different endings.", 454, 278);
    image(retry,470,270,150,80);
    if(timer>6.5){
        textSize(35);
        text("Come on! (^^)", 10, 110);
        text("Even my grandma plays better than that!", 10, 140);
        image(result1,250,160,150,150);
    }else if(timer>4.5){
        textSize(35);
        text("Not bad, but not good enough either.", 10, 110);
        text("    Let's see more!", 10, 140);
        image(result2,250,160,150,150); }
      else if(timer>3.9){
        textSize(35);
        text("impressive...", 10, 110);
        text("    but can you top this?", 10, 140);
        image(result3,250,160,200,150);}
      else if(timer>3.3){
        textSize(35);
        text("Outstanding performance.", 10, 110);
        text("You're a star!!!", 10, 140);
        image(result4,385,30,250,250); }
      else{
        background(result5);  
        fill(255); // 文字色を黒に設定
        textSize(70); // 文字のサイズを32ピクセルに設定
        text("You're Nomber1!!", 50, 150); //テキストを表示 
        textSize(32);
        text("Time:  "+timer, 90, 180);
        textSize(45);
        image(retry,470,270,150,80);
        text("Thank you for playing!!",70,280);}
      }
 */
 
 /*
 void drawresult(){
   if(!soundFiles[selectedIndex].isPlaying()&&onplaying==true&&musicStarted == true){
       resultset=true; 
       //println(0);
       image(title, 0, 0,width,height);  
        fill(0, 0, 0, 200);
        rect(0,0,width,height);
        fill(255);
        textSize(108);
        int MaxScore=1000;
        int notes=MaxScore/lines.length;
        text("Score:     "+(totalScore*notes) +" points",width *0.04, height *0.1);
        textSize(60);
        String producer;
        String maincomment, subcomment; //あおり文の変数　おのえ
        if(5<selectedIndex&&selectedIndex<8){
          producer="おのおの=おのえ";
          }
          else if(8<=selectedIndex&&selectedIndex<10){
          producer="ひずひず=ひずみ(32)";
          }
         else {producer="レオン";}
        //↓あおり文評価分岐　おのえ(7/11)
        if(0<totalScore*notes&&totalScore*notes<249){
          maincomment="Keep trying.";
          subcomment= "Even a broken clock is right twice a day.";
        } else if(250<totalScore*notes&&totalScore*notes<449) {      
          maincomment="Not bad.";
          subcomment= "Practice makes... well, less terrible.";
        } else if(500<totalScore*notes&&totalScore*notes<749) { 
          maincomment="Good effort.";
          subcomment= " You almost didn't embarrass yourself.";          
        } else if(750<totalScore*notes&&totalScore*notes<1000) {
          maincomment="Perfect.";
          subcomment= " Did you pay off the judges?";          
        }
        text(options[selectedIndex],width *0.04, height *0.2);
        textSize(30);
        text("lyric.  "+producer+", ChatGPT  feat. Suno",width *0.08, height *0.26);
        image(MusicBackArray[selectedIndex],30,270,700,600);
        //↓あおり文　おのえ(7/11)
        textSize(30);
        text("Judge's comment...", 750, 270);
        textSize(60);
        text(maincomment, 750, 320);
        textSize(30);
        text(subcomment, 750, 370);
        
        textSize(40);
        text("Hit："+totalScore, width *0.6, height *0.6 );//lyricsArray[selectedIndex].length
        text("Lost："+(lines.length-totalScore), width *0.6, height *0.7 );//lyricsArray[selectedIndex].length
       image(retry, width *0.7, height *0.851,150,150);
       image(exit, width *0.8, height *0.85,170,170);
           if(resultset==true && dist(mouseX,mouseY,width *0.7+150/2, height *0.851-150/2)<150/2){
    println(00);
  }
   }
 }
 
 */
 void renew_lines(){
   if(renew_lines_flag==true){
     //println("Go");
   renew_lines_flag=false;
  timeArray = new ArrayList<Float>();
  markerArray = new ArrayList<Integer>();
  notePositions = new ArrayList<Float>();
  lines = linesArray[selectedIndex];
  for (String line : lines) {
    String[] parts = line.split(" ---- ");
    float time = Float.parseFloat(parts[0].split(" ")[1]);
    int marker = Integer.parseInt(parts[1]);
    
    timeArray.add(time);
    markerArray.add(marker);
    notePositions.add((float)1280); // 初期位置を設定
    //soundFile.play();
  }
   }
 
 }
 
void guitar() {
  if (Amarker == true && objectDetected == true && without == false) {
    textSize(50);
    fill(90);
    checkHit(0);
    if (!drums[0].isPlaying()) { // 再生中かどうか確認
      drums[0].play();
    }
    //text("1",width/2,height/2);
    //println("A");
  }
  if (Bmarker == true && objectDetected == true && without == false) {
    textSize(50);
    fill(90);
    checkHit(1);
    if (!drums[1].isPlaying()) { // 再生中かどうか確認
      drums[1].play();
    }
    //text("2",width/2,height/2);
    //println("B");
  }
  if (Cmarker == true && objectDetected == true && without == false) {
    textSize(50);
    fill(90);
    checkHit(2);
    if (!drums[2].isPlaying()) { // 再生中かどうか確認
      drums[2].play();
    }
    //text("C",width/2,height/2);
    //println("C");
  }
  if (Dmarker == true && objectDetected == true && without == false) {
    textSize(50);
    fill(90);
    checkHit(3);
    if (!drums[3].isPlaying()) { // 再生中かどうか確認
      drums[3].play();
    }
    //text("D",width/2,height/2);
    //println("D");
  }
}

 /*
 void checkHit(int lane) {
  for (int i = 0; i < currentIndex; i++) {
    if (markerArray.get(i) == lane && notePositions.get(i) >= 0 && notePositions.get(i) < 130) {
      totalScore++;
      notePositions.set(i, -1000.0); // ノーツを無効にする
      println("Hit! Total Score: " + totalScore);
      break;
    }
  }
}

 
 
 */
 void reset(){
   
  objectDetected = false;
without = false; //ギターなし
sist = 0;
ost = 0;
//println("reset");
onbrackcount = 0;
onplaying = false;
music_gameset1 = false;
music_waiting = false;
onmusic = false;
onPremusic = true;
resultset = false;
rylicdrawing = false;
renew_lines_flag = true;
selectedIndex = 0;

speed = 10;
cha = 0;
totalScore = 0;
startTime=0;
currentIndex=0;

musicStartTime=0; // 音楽再生開始時間
musicStarted = false; // (0703日隅)

 
 }
