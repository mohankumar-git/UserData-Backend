const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");
let db;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("http://localhost:3000 Server Started");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
  }
};

initializeDBAndServer();

//Register User API
app.post("/register", async (request, response) => {
  try {
    const { username, name, password, gender, location } = request.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const getUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
    const user = await db.get(getUserQuery);

    if (user === undefined) {
      if (password.length > 5) {
        const createUserQuery = `INSERT INTO user (username, name, password, gender, location) VALUES ('${username}', '${name}', '${hashedPassword}', '${gender}', '${location}');`;
        const dbResponse = await db.run(createUserQuery);
        response.status(200);
        response.send("User created successfully");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("User already exists");
    }
  } catch (error) {
    response.send(error.message);
  }
});

//Login User API
app.post("/login", async (request, response) => {
  try {
    const { username, password } = request.body;
    const getUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
    const user = await db.get(getUserQuery);

    if (user === undefined) {
      response.status(400);
      response.send("Invalid user");
    } else {
      const isPasswordMatch = await bcrypt.compare(password, user.password);
      if (isPasswordMatch) {
        response.status(200);
        response.send("Login success!");
      } else {
        response.status(400);
        response.send("Invalid password");
      }
    }
  } catch (error) {
    response.status(400);
    response.send(error.message);
  }
});

//Change Password API
app.put("/change-password", async (request, response) => {
  try {
    const { username, oldPassword, newPassword } = request.body;
    const getUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
    const user = await db.get(getUserQuery);

    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);
      if (isPasswordMatch) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `UPDATE user SET password = '${hashedPassword}' WHERE username = '${username}';`;
        const dbResponse = await db.run(updatePasswordQuery);
        response.status(200);
        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Invalid current password");
      }
    }
  } catch (error) {
    response.send(error.message);
  }
});

module.exports = app;
