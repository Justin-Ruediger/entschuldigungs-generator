// bring in environment variables from a .env file
require("dotenv").config();

const database = require("./modules/databaseConnection.js");
const path = require("path");
database.connect(
  "206.189.249.7",
  "entgen",
  "xXO1poV6F0JOmvyN",
  "entschuldigungs_generator"
);
const accounts = require("./modules/accounts.js")(database);
const child = require("./modules/child.js")(database);
// import express and morgan
const express = require("express");
const session = require("express-session");

// create an application object
const app = express();

// define a PORT variable from the environment with a default value
const PORT = process.env.PORT || 8080;

// set the view engine to ejs
app.set("view engine", "ejs");
app.set("views", [
  path.join(__dirname, "views"),
  path.join(__dirname, "views/user/"),
  path.join(__dirname, "views/user/child/"),
]);
/////////////////////////////////////
// ALL YOUR MIDDLEWARE AND ROUTES GO HERE
//app.use(morgan("tiny")) // middleware for logging
app.use(express.urlencoded({ extended: true })); //middleware for parsing urlencoded data
app.use(express.json()); // middleware for parsing incoming json
app.use("/static", express.static("static")); // to set a folder for static file serving
app.use(
  session({
    name: `awfefdysef`,
    secret: "t48wa7f9aw8hfieuobsyziaef",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // This will only work if you have https enabled!
      maxAge: 600000, // 1 min
    },
  })
);

/////////////////////////////////////

// Routes
const userRoute = require("./routes/userRoute.js");
app.use("/user", userRoute);

// Server Listener
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/", (req, res) => {
  res.render("login");
});
app.get("/logout", async (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        res.status(400).send("Unable to log out");
      } else {
        res.redirect("/login");
      }
    });
  } else {
    res.end();
  }
});

app.get("/login", (req, res) => {
  if (req.session.auth) {
    res.redirect("/user");
    return;
  }
  res.render("login", { error: false });
});
app.post("/login", async (req, res) => {
  if (req.session.auth) {
    res.redirect("/user");
    return;
  }
  try {
    var result = await accounts.login(req.body.email, req.body.password);
    console.log("result: " + result);
    if (result === false) {
      res.render("login", { error: true });
      return;
    }
    req.session.auth = true;
    req.session.email = req.body.email;
    req.session.user_id = result;
    res.redirect("./user/selectchild");
  } catch (e) {
    res.render("login", { error: true });
    return;
  }
  //res.redirect('/pdf/Entschuldigung-Krankheit-Male.pdf?name=' + req.body.email);
});
app.get("/register", (req, res) => {
  if (req.session.auth) {
    res.redirect("/user");
    return;
  }
  res.render("register", { error: false });
});
app.post("/register", async (req, res) => {
  try {
    if (req.session.auth) {
      res.redirect("/user");
      return;
    }
    var success = await accounts.register(
      req.body.name,
      req.body.address,
      req.body.city,
      req.body.email,
      req.body.password
    );
    if (!success) {
      res.render("register", { error: true });
      return;
    }
    res.redirect("login");
    return;
  } catch (err) {
    console.log(err);
  }
});
app.get("*", function (req, res) {
  res.redirect("/");
});
