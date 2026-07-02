// 経過時間に対応したキー入力の保存（マーカ番号：A～Dを１～４として表示しています）

ArrayList<String> keyLog = new ArrayList<String>();
PrintWriter file;
int startTime;

void setup() {
  size(400, 400);
  startTime = millis(); // プログラムの開始時間を記録
  // Create a writer for the log file
  file = createWriter("keyLog.txt");
}

void draw() {
  background(255);
  
  // Calculate elapsed time
  int elapsedTime = millis() - startTime;
  int seconds = elapsedTime / 1000; // 経過秒数
  
  // Display elapsed time
  textAlign(LEFT, TOP);
  textSize(16);
  fill(0);
  text("Elapsed time: " + seconds + "." + elapsedTime % 1000 + " seconds", 20, 20);
  
  // Display the key log on the screen
  for (int i = 0; i < keyLog.size(); i++) {
    String logEntry = keyLog.get(i);
    text(logEntry, 20, 60 + i * 20);
  }
}

void keyPressed() {
  if (key == '1' || key == '2' || key == '3' || key == '4') {
    // Calculate elapsed time
    int elapsedTime = millis() - startTime;
    int seconds = elapsedTime / 1000; // 経過秒数
    int milliseconds = elapsedTime % 1000; // ミリ秒部分
    
    String logEntry = String.format("At %d.%03d seconds ---- %s", seconds, milliseconds, key);
    println(logEntry); // コンソールに出力
    keyLog.add(logEntry);
    file.println(logEntry);
    file.flush(); // ファイルに即時書き込み
  }
}

void exit() {
  // Close the file before exiting
  file.flush();
  file.close();
  
  super.exit();  // Call the super exit function after closing the file
}
