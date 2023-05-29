const express = require("express");
const router = express.Router({ mergeParams: true }); //aces to child id
const pdfLoader = require("../modules/pdfLoader.js");
const database = require("../modules/databaseConnection.js");
database.connect();
const child = require("../modules/child.js")(database);
router.get("/:name", async (req, res) => {
  var customPropertys = pdfLoader.getCustomProperties(req.params.name);
  if (customPropertys.length > 0) {
    res.render("dataForm", {
      properties: customPropertys,
      filename: req.params.name,
      childid: req.params.childid,
    });
    return;
  }

  var data = await child.getChildData(req.params.childid);
  data.date = pdfLoader.getCurrentDateString();
  child.addToHistory(req.params.childid, req.params.name, data);

  pdfLoader
    .getPdf(req.params.name, data["teacher_gender"], data)
    .then(function (pdfBuffer) {
      res.status(200);
      res.type("pdf");
      res.send(pdfBuffer);
    })
    .catch(function (err) {
      res.status(500);
      res.send(err.message);
    });
});
router.post("/:name", async (req, res) => {
  var customPropertys = pdfLoader.getCustomProperties(req.params.name);

  var data = await child.getChildData(req.params.childid);

  customPropertys.forEach((prop) => {
    data[prop.name] = req.body[prop.name];
  });
  data.date = pdfLoader.getCurrentDateString();
  child.addToHistory(req.params.childid, req.params.name, data);

  pdfLoader
    .getPdf(req.params.name, data["teacher_gender"], data)
    .then(function (pdfBuffer) {
      res.status(200);
      res.type("pdf");
      res.send(pdfBuffer);
    })
    .catch(function (err) {
      res.status(500);
      res.send(err.message);
    });
});

router.get("/history/:docid", async (req, res) => {
  var hasPermission = await child.hasDocPermission(
    req.params.docid,
    req.session.user_id
  );
  if (!hasPermission) {
    res.redirect("/user/selectchild");
    return;
  }

  var data = await child.getSpecificHistory(req.params.docid);

  pdfLoader
    .getPdf(data.document, data.data["teacher_gender"], data.data)
    .then(function (pdfBuffer) {
      res.status(200);
      res.type("pdf");
      res.send(pdfBuffer);
    })
    .catch(function (err) {
      res.status(500);
      res.send(err.message);
    });
});

module.exports = router;
