#  Expense Tracker

Expense tracker is a simple and modern local expense tracker built using **HTML, CSS, JavaScript, and Python**.

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
Tally-Expense-Tracker/
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

Make sure **Python 3** is installed.

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

### 5. Open Tally

Open your browser and visit:

```text
http://127.0.0.1:8000
```

Tally will now run locally on your computer.

---

## 💾 How Data Works

Tally uses a simple local architecture:

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

## 🔍 How to Check Your Saved Data

After adding an expense in Tally, the data is saved automatically in:

```text
data.json
```

### Method 1 — Open `data.json`

1. Stop the server if needed or leave it running.
2. Open your **Tally-Expense-Tracker** folder.
3. Find:

```text
data.json
```

4. Open it with **Notepad**, **VS Code**, or another text editor.

You will see the saved application data in JSON format.

### Method 2 — Check from PowerShell

Open PowerShell inside the project folder and run:

```powershell
Get-Content data.json
```

This will display the saved data directly in the terminal.

### Example

After adding expenses, `data.json` will contain your saved Tally data.

You can use this file to verify that your expenses are being stored locally.

> **Do not delete or manually modify `data.json` unless you know what you are changing.**

---

## 🔄 Test That Your Data Is Saved

You can test the local storage system:

1. Start Tally:

```bash
python server.py
```

2. Open:

```text
http://127.0.0.1:8000
```

3. Add an expense.
4. Check that `data.json` has been created.
5. Stop the server with:

```text
Ctrl + C
```

6. Start it again:

```bash
python server.py
```

7. Open Tally again.

Your previously saved data should still be available.

---

## 🔒 Local & Private

Your expense data is stored locally on the computer where you run Tally.

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

GitHub Pages can display the frontend, but the complete application requires the Python backend.

For the full application, download the repository and run `server.py` locally.

---

## 🤝 Contributing

Contributions and improvements are welcome.

You can fork the repository, make your changes, test them locally, and submit a pull request.

---

## ⭐ Support

If you find **Tally** useful, consider giving the repository a ⭐ on GitHub.

---

**Built with HTML, CSS, JavaScript and Python.**
