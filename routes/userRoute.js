// Router for logged in User:
const express = require("express");
const router = express.Router();
const database = require("../modules/databaseConnection.js");
database.connect(
  "206.189.249.7",
  "entgen",
  "xXO1poV6F0JOmvyN",
  "entschuldigungs_generator"
);
//check if user is logged in, if not, redirect to login page
router.use((req, res, next) => {
  console.log(req.session);
  if (!req.session.auth) {
    res.redirect("/login");
    console.log("unauthorized access");
    return;
  }
  next();
});

// Sub Routes:
router.use("/child", require("./childRoute.js"));
// Route: /user

router.get("/", (req, res) => {
  res.redirect("./user/selectchild");
});
router.get("/editAccount", async (req, res) => {
  try {
    var data = await database.query(
      "SELECT email, name, address, city FROM `users` WHERE id = ?",
      [req.session.user_id]
    );
    if (data.length > 0) {
      res.render("editAccount", data[0]);
    }
  } catch (err) {
    console.log(err);
  }
});
router.post("/editAccount", async (req, res) => {
  try {
    await database.query(
      "UPDATE `users` SET `email`=? ,`name`=?,`address`=?,`city`=? WHERE id = ?",
      [
        req.body.email,
        req.body.name,
        req.body.address,
        req.body.city,
        req.session.user_id,
      ]
    );
    res.redirect("./selectchild");
  } catch (err) {
    console.log(err);
  }
});
router.get("/deleteAccount", async (req, res) => {
  //TODO: add confirmation
  try {
    await database.query("DELETE FROM `users` WHERE id = ?", [
      req.session.user_id,
    ]);
    res.redirect("/login");
  } catch (err) {
    console.log(err);
  }
});

router.get("/selectchild", async (req, res) => {
  try {
    var children = await database.query(
      "SELECT id, name FROM `children` WHERE `parent_id` = ?",
      [req.session.user_id]
    );
    res.render("selectChild", { children: children });
  } catch (err) {
    console.log(err);
  }
});
router.get("/addChild", async (req, res) => {
  try {
    var schools = await database.query(
      "SELECT name, id FROM `schools` where creator = ?",
      [req.session.user_id]
    );
    res.render("addChild", { schools: schools });
  } catch (err) {
    console.log(err);
  }
});
router.post("/addChild", async (req, res) => {
  console.log(
    req.session.user_id,
    req.body.name,
    req.body.grade,
    req.body.teachername,
    req.body.schoolid
  );
  try {
    var result = await database.query(
      "INSERT INTO `children`(`parent_id`, `name`, `grade`, `teacher_name`, `school_id`, `teacher_gender`) VALUES (?, ?, ?, ?, ?, ?)",
      [
        req.session.user_id,
        req.body.name,
        req.body.grade,
        req.body.teachername,
        req.body.schoolid,
        req.body.teachergender,
      ]
    );
    res.redirect("./selectChild");
  } catch (err) {
    console.log(err);
    res.render("addChild", { error: true });
  }
});
router.get("/addSchool", async (req, res) => {
  res.render("addSchool");
});
router.post("/addSchool", async (req, res) => {
  try {
    var result = await database.query(
      "INSERT INTO `schools`(`creator`, `name`, `address`, `city`) VALUES (?,?,?,?)",
      [req.session.user_id, req.body.name, req.body.address, req.body.city]
    );
    res.redirect("./addChild");
  } catch (err) {
    console.log(err);
    res.render("addSchool", { error: true });
  }
});

module.exports = router;
