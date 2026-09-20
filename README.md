** Expense Tracker**

 is a simple and modern local expense tracker built using **HTML, CSS, JavaScript, and Python**.

It helps you manage your daily expenses, track your budget, view spending breakdowns, and keep your expense data stored locally on your computer.

---

## ✨ Features

* 💰 Add and manage expenses
* 📊 Track total spending
* 🎯 Set and monitor budget
* 📅 Monthly expense tracking
* 🧾 Expense ledger
* 📈 Spending breakdown
* 📆 Daily expense view
* 💱 Multiple currency options
* 💾 Local data storage
* 🐍 Python-powered backend
* 📱 Responsive design
* 🌙 Modern dark interface

---

## 🛠️ Tech Stack

* **HTML5** — Structure
* **CSS3** — Styling and responsive design
* **JavaScript** — Application logic
* **Python** — Local backend server
* **JSON** — Local data storage

---

## 📁 Project Structure

```text
 -Expense-Tracker/
│
├── index.html       # Main application
├── style.css        # Styling
├── script.js        # Application logic
├── server.py        # Python backend
└── README.md        # Documentation
```

When you use the application, `server.py` automatically creates:

```text
data.json
```

This file contains your locally stored expense data.

---

## 🚀 How to Run Locally

### 1. Download the project

Download the repository from GitHub and extract the ZIP file.

### 2. Install Python

Make sure **Python 3** is installed on your computer.

Check it with:

```bash
python --version
```

If Python is not installed, download it from:

https://www.python.org/downloads/

### 3. Open the project folder

Open **PowerShell** or **Command Prompt** inside the project folder.

### 4. Start the server

Run:

```bash
python server.py
```

### 5. Open  

Open your browser and visit:

```text
http://127.0.0.1:8000
```

  will now run locally on your computer.

---

## 💾 How Data Works

  uses a simple local architecture:

```text
index.html
     ↓
script.js
     ↓
/api/data
     ↓
server.py
     ↓
data.json
```

Your expenses are saved in `data.json` on your own computer.

No external database is required for the current version.

---

## 🔒 Local & Private

Your expense data is stored locally on the computer where you run  .

The GitHub repository contains the application code, while your personal expense data is created locally through `data.json`.

**Do not upload your personal `data.json` to GitHub.**

---

## 🛑 Stop the Application

To stop the local server, go to the terminal where `server.py` is running and press:

```text
Ctrl + C
```

To start it again:

```bash
python server.py
```

Then open:

```text
http://127.0.0.1:8000
```

---

## 🌐 GitHub

The project is available on GitHub so anyone can download, study, modify, and run it locally.

GitHub Pages can display the frontend, but the complete application requires the Python backend. For the full experience, download the repository and run `server.py` locally.

---

## 🤝 Contributing

Contributions and improvements are welcome.

You can fork the repository, make your changes, test them locally, and submit a pull request.

---

## ⭐ Support

If you find ** ** useful, consider giving the repository a ⭐ on GitHub.

---

**Built with HTML, CSS, JavaScript and Python.**
