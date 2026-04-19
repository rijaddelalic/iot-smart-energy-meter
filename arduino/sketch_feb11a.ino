#include <WiFi.h>
#include <FirebaseESP32.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>


#define WIFI_SSID "Placeholder"
#define WIFI_PASSWORD "Placeholder"

#define FIREBASE_HOST "Placeholder firebaseio.com"
#define FIREBASE_AUTH "Placeholder"


#define PIN_SENZORA 34
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);


FirebaseData firebaseData;
FirebaseConfig config;
FirebaseAuth auth;
const float OSJETLJIVOST = 0.135;

void setup() {
  Serial.begin(115200);


  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) { Serial.println("Ekran greska!"); for(;;); }
  display.clearDisplay();
  display.setTextColor(WHITE);
  display.setCursor(0,10);
  display.println("POVEZIVANJE...");
  display.display();


  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }


  config.database_url = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}


float getTrueRMSCurrent() {
  long sumaKvadrata = 0;
  int brojUzoraka = 0;
  int sredina = 0;


  for(int i=0; i<200; i++) { sredina += analogRead(PIN_SENZORA); delay(1); }
  sredina /= 200;

  uint32_t start_time = millis();
  while((millis() - start_time) < 200) { // Uzorkuj 10 punih ciklusa (200ms)
    int uzorak = analogRead(PIN_SENZORA) - sredina;
    sumaKvadrata += (long)uzorak * uzorak;
    brojUzoraka++;
  }
  float rmsSirovo = sqrt((float)sumaKvadrata / brojUzoraka);
  // Pretvaranje u ampere: (Napon_na_pinu / Osjetljivost_senzora)
  return (rmsSirovo * 3.3 / 4095.0) / OSJETLJIVOST;
}

void loop() {
  float struja = getTrueRMSCurrent();
  if (struja < 0.18) struja = 0.0;
  float snaga = struja * 230.0;


  Firebase.setFloat(firebaseData, "/mjerenja/snaga", snaga);
  Firebase.setFloat(firebaseData, "/mjerenja/struja", struja);


  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0,0);
  display.print("IoT MONITORING");

  display.setTextSize(2);
  display.setCursor(0,25);
  display.print(snaga, 1); display.print(" W"); // Prikaz snage

  display.setTextSize(1);
  display.setCursor(0,52);
  display.print("Struja: "); display.print(struja, 2); display.print(" A");

  display.display();
  delay(1500);
}