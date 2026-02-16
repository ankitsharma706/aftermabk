<<<<<<< HEAD
# aftermabk
# aftermabk
=======
# AfterMaWell Backend (C++ Execution)

This is a Node.js/Express backend service designed to compile and execute C++ programs. It is a standalone component within the AfterMaWell project.

## Project Structure

```
backend/
├── config/         # Configuration files
├── controllers/    # Request handlers
├── cpp/            # C++ source files and binaries
├── middleware/     # Express middleware (security, etc.)
├── routes/         # API Route definitions
├── services/       # Business logic (compilation, execution)
├── server.js       # Entry point
└── package.json    # Dependencies and scripts
```

## Prerequisites

- **Node.js** (v14+ recommended)
- **g++** (GNU C++ Compiler) - Must be installed and in your system PATH.
  - Linux: `sudo pacman -S gcc` (Arch) or `sudo apt install g++` (Debian/Ubuntu)

## Setup

1. **Environment Variables**:
   Create a `.env` file in the `backend/` directory:
   ```env
   MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>
   PORT=5000
   ```

2. **Install Dependencies**:
   ```bash
   cd backend
   npm install
   ```

3. **Seed Database**:
   Populate MongoDB with initial data from JSON files:
   ```bash
   node scripts/seedData.js
   ```

## Running the Server

- **Development Mode** (auto-restart):
  ```bash
  npm run dev
  ```
- **Production Mode**:
  ```bash
  npm start
  ```

The server runs on **port 5000** by default.

## API Endpoints

### 1. Health Check
- **GET** `/health`
- Returns: `{ "status": "OK" }`

### 2. Compile C++ Code
- **POST** `/api/compile`
- **Body**: `{ "fileName": "hello.cpp" }`
- **Description**: Compiles the specified file from the `cpp/` directory.
- **Response**: `{ "message": "Compilation successful", "outputFile": "hello" }`

### 3. Run C++ Program
- **POST** `/api/run`
- **Body**: `{ "fileName": "hello.cpp" }`
- **Description**: Runs the compiled binary of the specified file.
- **Response**: `{ "output": "Hello from C++ backend!\\n" }`

### 4. User Management (In-Memory)
- **GET** `/api/users`: Get all users.
- **GET** `/api/users/:id`: Get user by ID.
- **POST** `/api/users`: Create user (Body: `{ "name": "...", "email": "..." }`).
- **PUT** `/api/users/:id`: Update user.
- **DELETE** `/api/users/:id`: Delete user.

### 5. Doctor Data (Read-Only)
- **GET** `/api/doctors`: Get all doctors.
- **GET** `/api/doctors/:id`: Get specific doctor details.

### 6. Profile Data
- **GET** `/api/profile`: Get full user profile.
- **GET** `/api/profile/:section`: Get specific section (e.g., `preferences`, `medical_profile`).
- **PUT** `/api/profile/:section`: Update section data.

## Security Notes
- Validates filenames to prevent directory traversal (`../`).
- Limits execution time to 5 seconds (configurable in `config/config.js`).
>>>>>>> 49a3fa4 (Initial backend commit)
