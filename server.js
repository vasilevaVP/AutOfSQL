const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const { Sequelize, DataTypes, Op } = require("sequelize");
const bcrypt = require("bcrypt");
const cors = require("cors");
const path = require("path");

const app = express();
const port = 3000;

// Подключение к базе данных SQLite
const sequelize = new Sequelize("db", "vp", "123", {
  dialect: "sqlite",
  storage: "db.sqlite",
});

// Модель пользователя
const User = sequelize.define(
  "User",
  {
    login: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: "Логин не может быть пустым" },
        len: { args: [3, 20], msg: "Логин должен быть от 3 до 20 символов" },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: "Пароль не может быть пустым" },
        len: { args: [8, 50], msg: "Пароль должен быть от 8 до 50 символов" },
      },
    },
  },
  {
    timestamps: false, // Отключаем авто-поля createdAt и updatedAt
  }
);
async function run() {
  try {
    await sequelize.sync({ force: true });
    console.log("Таблица User пересоздана.");
    // Создание пользователей
    await User.create({ login: "VasilevaVP", password: 12345678 });
  } catch (error) {
    console.error("Ошибка:", error);
  } finally {
    await sequelize.close();
  }
}

run();

// Синхронизация модели с базой данных
sequelize
  .sync()
  .then(() => {
    console.log("База данных синхронизирована.");
  })
  .catch((err) => {
    console.error("Ошибка синхронизации базы данных:", err);
  });

/// Данные пользователей
let users = [];

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: "1234546789",
    resave: false,
    saveUninitialized: true,
  })
);

// Главная страница
app.get("/", (req, res) => {
  if (req.session.user) {
    res.redirect("/profile");
  } else {
    res.render("index");
  }
});

// Регистрация
app.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (users.find((user) => user.username === username)) {
    res.send("Пользователь с таким именем уже существует");
  } else {
    users.push({ username, password });
    res.redirect("/profile");
  }
});

// Вход
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(
    (user) => user.username === username && user.password === password
  );
  if (user) {
    req.session.user = user;
    res.redirect("/profile");
  } else {
    res.send("Неверный логин или пароль");
  }
});

// Профиль
app.get("/profile", (req, res) => {
  if (req.session.user) {
    res.render("profile", { user: req.session.user });
  } else {
    res.redirect("/");
  }
});

// Редактирование профиля
app.post("/profile/update", (req, res) => {
  if (req.session.user) {
    const { newUsername, newPassword } = req.body;
    const userIndex = users.findIndex(
      (user) => user.username === req.session.user.username
    );
    users[userIndex].username = newUsername;
    users[userIndex].password = newPassword;
    req.session.user.username = newUsername;
    req.session.user.password = newPassword;
    res.redirect("/profile");
  } else {
    res.redirect("/");
  }
});

// Выход
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
    }
    res.redirect("/");
  });
});

app.listen(port, () =>
  console.log(`Server is running at http://localhost:${port}`)
);
