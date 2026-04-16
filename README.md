# macOS Digital Clock Web App (Django)

A professional, visually stunning full-stack Digital Clock application inspired by the macOS aesthetic. This app features a responsive design, real-time updates, and advanced time-management tools.

## 🚀 Features

### Core Features
- **Live Digital Clock**: Real-time updates with 12/24-hour format support.
- **Analog Mode**: Toggle between a sleek digital display and a classic macOS-style analog clock.
- **World Clock**: Track multiple cities globally with ease.
- **Alarm System**: Set multiple alarms with custom labels, daily repeat, and browser notifications.
- **Timer**: Precise countdown with sound alerts and haptic feedback (vibration).
- **Stopwatch**: High-precision stopwatch with lap recording.

### Smart & Visual Features
- **macOS Glassmorphism**: Translucent cards, blurred backgrounds, and premium typography.
- **Dynamic Themes**: Switch between multiple background gradients (Default, Ocean, Sunset, Forest).
- **Weather Integration**: Live weather widget showing current conditions and temperature.
- **Fullscreen Mode**: Immerse yourself in a beautiful fullscreen clock view.
- **PWA (Progressive Web App)**: Installable on your phone or desktop with offline support.
- **Keyboard Shortcuts**:
  - `C`: Clock
  - `A`: Alarm
  - `S`: Stopwatch
  - `T`: Timer
  - `F`: Fullscreen Toggle

## 🛠️ Tech Stack
- **Backend**: Django (Python)
- **Frontend**: TailwindCSS, JavaScript (ES6+), FontAwesome
- **Storage**: LocalStorage (for user preferences, alarms, and clocks)
- **Real-time**: RequestAnimationFrame & setInterval for smooth UI updates.

## 📦 Installation & Setup

### 1. Prerequisites
- Python 3.8 or higher
- Pip (Python package manager)

### 2. Clone the Repository
```bash
git clone <repository-url>
cd "digital clock"
```

### 3. Install Django
If you haven't installed Django yet:
```bash
pip install django
```

### 4. Database Migrations
Initialize the Django SQLite database:
```bash
python manage.py migrate
```

### 5. Run the Server
```bash
python manage.py runserver
```

### 6. Access the App
Open your browser and navigate to:
[http://127.0.0.1:8000](http://127.0.0.1:8000)

## 📁 Project Structure
- `clock/`: Django app containing views and routing.
- `static/js/main.js`: Core logic for time, alarms, and UI interactions.
- `static/css/style.css`: Custom animations and glassmorphism refinements.
- `templates/clock/index.html`: Main SPA (Single Page Application) template.
- `static/manifest.json`: PWA configuration.

---

Built with ❤️ by Antigravity
