const database = require("../modules/databaseConnection.js");
database.connect(
  "206.189.249.7",
  "entgen",
  "xXO1poV6F0JOmvyN",
  "entschuldigungs_generator"
);
const child = require("../modules/child.js")(database);

// Route for accesing children
const express = require("express");

const router = express.Router();
const routerChild = express.Router({ mergeParams: true }); //manages the middleware

router.use("/:childid", routerChild);
routerChild.use("/file", require("./fileRoute.js"));
//Middleware
//Check for permission to access child
routerChild.use(async (req, res, next) => {
  var hasPermission = await child.hasChildPermission(
    req.params.childid,
    req.session.user_id
  );
  if (!hasPermission) {
    res.redirect("/user");
    return;
  }
  next();
});
//ROutes /user/child/[id]/...

routerChild.get("/editChild", async (req, res) => {
  try {
    var data = await child.getChildData(req.params.childid);
    data.schools = await database.query(
      "SELECT name, id FROM `schools` where creator = ?",
      [req.session.user_id]
    );
    res.render("editChild", data);
  } catch (err) {
    console.log(err);
  }
});
routerChild.get("/removeChild", async (req, res) => {
  try {
    await database.query("DELETE FROM `children` WHERE id = ?", [
      req.params.childid,
    ]);
    res.redirect("../selectchild");
  } catch (err) {
    console.log(err);
  }
});
routerChild.get("/history", async (req, res) => {
  var data = await child.getHistory(req.params.childid);
  if (data === false) {
    return;
  }
  res.render("history", { doc: data });
});

routerChild.post("/editChild", async (req, res) => {
  try {
    await database.query(
      "UPDATE `children` SET `name`=?,`grade`=?,`teacher_name`=?,`teacher_gender`=?,`school_id`=? WHERE children.id = ?",
      [
        req.body.name,
        req.body.grade,
        req.body.teachername,
        req.body.teachergender,
        req.body.schoolid,
        req.params.childid,
      ]
    );
    res.redirect("../selectchild");
  } catch (err) {
    console.log(err);
  }
});
routerChild.get("/selectFile", async (req, res) => {
  var files = [
    { name: "Entschuldigung", destination: "Entschuldigung-Krankheit" },
  ];
  res.render("selectFile", { files: files, childid: req.params.childid });
});
module.exports = router;
