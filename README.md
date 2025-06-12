# 📱 Wenlock Health System 

An Android-based prototype developed using **Java** and **Android Studio**. This application simulates a hospital display system that includes token queue management, drug inventory alerts, and emergency code notifications.

---

## 📂 Project Structure

WenlockHealthSystem/

├── app/

│ └── src/

│ └── main/

│ ├── java/com/example/wenlock/

│ │ ├── MainActivity.java # Token queue management

│ │ ├── EmergencyActivity.java # Emergency code handling

│ │ ├── InventoryActivity.java # Medicine stock alerts

│ │ └── models/

│ │ ├── Token.java # Token model class

│ │ └── Medicine.java # Medicine model class

│ └── res/

│ ├── layout/

│ │ ├── activity_main.xml # Token management UI

│ │ ├── activity_emergency.xml # Emergency alert UI

│ │ └── activity_inventory.xml # Inventory UI

│ └── values/

│ └── strings.xml # App strings

│
├── screenshots/ # UI screenshots

├── .idea/, gradle/, build.gradle, AndroidManifest.xml, etc.


---

## ✅ Features

- **Token Queue Management**
  - Add, remove, and reset patient tokens
  - Display current queue using ListView

- **Drug Inventory System**
  - List of medicines with quantity indicators
  - Low stock warnings

- **Emergency Code Alerts**
  - Trigger and display alerts like **Code Blue** and **Code Red**
  - Alerts shown on a dedicated screen

- **User Interface**
  - Clean and functional layout using `XML`
  - Separate activities for each module (token, inventory, emergency)

---

## ▶️ How to Run

1. Open Android Studio.
2. Click **"Open an Existing Project"** and select the root `WenlockHealthSystem` folder.
3. Let it sync all Gradle dependencies.
4. Choose an emulator or physical device.
5. Click **Run** (`Shift + F10`) to launch the app.

> If emulator crashes, ensure API Level 30 or higher is installed and AVD is properly configured.

---

## 🖼 Screenshots

- Token Queue UI  
- Emergency Alert UI  
- Inventory View with Alerts


![Screenshot 2025-06-11 170221](https://github.com/user-attachments/assets/191acf22-6115-448f-bea8-4df0c922fb2d) 

![Screenshot 2025-06-11 170255](https://github.com/user-attachments/assets/650169dc-e770-4da9-bcd6-74867f85f1a3)

![Screenshot 2025-06-11 170325](https://github.com/user-attachments/assets/f96cee04-5c90-40d4-9128-e55bd343ee81)

![Screenshot 2025-06-11 170153](https://github.com/user-attachments/assets/8d00a0bf-d790-41c1-aebe-a69ffa971121)
