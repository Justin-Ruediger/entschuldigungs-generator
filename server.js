// bring in environment variables from a .env file
require("dotenv").config()
const pdfLoader = require("./modules/pdfLoader.js");
const database = require("./modules/databaseConnection.js");
database.connect("206.189.249.7", "entgen", "xXO1poV6F0JOmvyN", "entschuldigungs_generator");
const accounts = require('./modules/accounts.js')(database);
const child = require('./modules/child.js')(database);
// import express and morgan
const express = require("express")
const session = require('express-session')

// create an application object
const app = express()

// define a PORT variable from the environment with a default value
const PORT = process.env.PORT || 4000

// set the view engine to ejs
app.set('view engine', 'ejs');
/////////////////////////////////////
// ALL YOUR MIDDLEWARE AND ROUTES GO HERE
//app.use(morgan("tiny")) // middleware for logging
app.use(express.urlencoded({extended: true})) //middleware for parsing urlencoded data
app.use(express.json()) // middleware for parsing incoming json
app.use("/static", express.static("static")) // to set a folder for static file serving
app.use(session({  
	name: `awfefdysef`,
	secret: 't48wa7f9aw8hfieuobsyziaef',  
	resave: false,
	saveUninitialized: false,
	cookie: { 
	  secure: false, // This will only work if you have https enabled!
	  maxAge: 600000 // 1 min
	} 
  }));
app.use(sessionChecker);


/////////////////////////////////////

// Server Listener
app.listen(PORT, () => console.log(`Listening on port ${PORT}`))

app.get("/", (req, res) => {
	res.render("login");
});
app.get("/removeChild/:childid", async(req, res) => {
	var hasPermission = await child.hasChildPermission(req.params.childid, req.session.user_id)
	if(!hasPermission){
		res.redirect("/selectchild");
		return;
	}
	try{
		await database.query("DELETE FROM `children` WHERE id = ?", [req.params.childid]);
		res.redirect("/selectchild");
	}catch(err){
		console.log(err);
	}

});
app.get("/deleteAccount", async(req, res) => {
	try{
		await database.query("DELETE FROM `users` WHERE id = ?", [req.session.user_id]);
		res.redirect("/login");
	}catch(err){
		console.log(err);
	}

});
app.get("/logout", async(req, res) => {
	if (req.session) {
		req.session.destroy(err => {
		  if (err) {
			res.status(400).send('Unable to log out')
		  } else {
			res.redirect('/login')
		  }
		});
	  } else {
		res.end()
	  }

});
app.get("/", (req, res) => {
	res.render("login");
});
app.get("/editAccount", async(req, res) => {

	data = await database.query("SELECT email, name, address, city FROM `users` WHERE id = ?", [req.session.user_id]);
	if(data.length > 0){
		res.render("editAccount", data[0]);
	}
});
app.post("/editAccount", async(req, res) => {
	console.log(req.body);
	try{
		await database.query("UPDATE `users` SET `email`=? ,`name`=?,`address`=?,`city`=? WHERE id = ?", [req.body.email, req.body.name, req.body.address, req.body.city, req.session.user_id]);
		res.redirect("/selectchild");
	}catch(err){
		console.log(err);
	}
});
app.get("/editChild/:childid", async(req, res) => {
	var hasPermission = await child.hasChildPermission(req.params.childid, req.session.user_id)
	if(!hasPermission){
		res.redirect("/selectchild");
		return;
	}
	var data = await child.getChildData(req.params.childid)
	data.schools = await database.query("SELECT name, id FROM `schools` where creator = ?", [req.session.user_id]);
	res.render("editChild", data);
});
app.get("/history/:childid", async(req, res) => {
	var hasPermission = await child.hasChildPermission(req.params.childid, req.session.user_id)
	if(!hasPermission){
		res.redirect("/selectchild");
		return;
	}

	var data = await child.getHistory(req.params.childid);
	console.log(data[0].timestamp);
	res.render("history", {doc : data});
});
app.get("/historyRender/:docid", async (req, res) => {
	console.log("hi");
	var hasPermission = await child.hasDocPermission(req.params.docid, req.session.user_id);
	if(!hasPermission){
		res.redirect("/selectchild");
		return;
	}
	
	var data = await child.getSpecificHistory(req.params.docid)
	console.log(data);

	pdfLoader.getPdf(data.document, data.data["teacher_gender"], data.data)
	.then(function(pdfBuffer) {
		  res.status(200);
		  res.type('pdf');
		  res.send(pdfBuffer);
		  console.log(pdfBuffer);
	  }).catch(function (err) {
		  res.status(500);
		  res.send(err.message);
	  });
});
app.post("/editChild/:childid", async(req, res) => {
	var hasPermission = await child.hasChildPermission(req.params.childid, req.session.user_id)
	if(!hasPermission){
		res.redirect("/selectchild");
		return;
	}
	
	console.log(req.body);
	try{
		await database.query("UPDATE `children` SET `name`=?,`grade`=?,`teacher_name`=?,`teacher_gender`=?,`school_id`=? WHERE children.id = ?", [req.body.name, req.body.grade, req.body.teachername, req.body.teachergender, req.body.schoolid, req.params.childid]);
		res.redirect("/selectchild");
	}catch(err){
		console.log(err);
	}
});
app.get('/pdf/:type', function(req, res) {
  pdfLoader.getPdfSimple(req.params.type)
  .then(function(pdfBuffer) {
		res.status(200);
		res.type('pdf');
		res.send(pdfBuffer);
	}).catch(function (err) {
		res.status(500);
		res.send(err.message);
	});
});
app.get('/file/:name/:childid', async(req, res) => {
	var customPropertys = pdfLoader.getCustomProperties(req.params.name);

	if(customPropertys.length > 0){
		res.render("dataForm", {properties : customPropertys, filename : req.params.name, childid : req.params.childid});
		return;
	}

	var hasPermission = await child.hasChildPermission(req.params.childid, req.session.user_id)
	if(!hasPermission){
		res.redirect("/selectchild");
		return;
	}
	var data = await child.getChildData(req.params.childid)

	child.addToHistory(req.params.childid, req.params.name, data);

	pdfLoader.getPdf(req.params.name, data["teacher_gender"], data)
	.then(function(pdfBuffer) {
		  res.status(200);
		  res.type('pdf');
		  res.send(pdfBuffer);
		  console.log(pdfBuffer);
	  }).catch(function (err) {
		  res.status(500);
		  res.send(err.message);
	  });
  });
app.post('/file/:name/:childid', async(req, res) => {

	var hasPermission = await child.hasChildPermission(req.params.childid, req.session.user_id)
	if(!hasPermission){
		res.redirect("/selectchild");
		return;
	}
	var customPropertys = pdfLoader.getCustomProperties(req.params.name);
	var data = await child.getChildData(req.params.childid)

	customPropertys.forEach(prop => {
		data[prop.name] = req.body[prop.name];
	});
	console.log(data);
	child.addToHistory(req.params.childid, req.params.name, data);

	pdfLoader.getPdf(req.params.name, data["teacher_gender"], data)
	.then(function(pdfBuffer) {
		
		  res.status(200);
		  res.type('pdf');
		  res.send(pdfBuffer);
		  console.log(pdfBuffer);
	  }).catch(function (err) {
		  res.status(500);
		  res.send(err.message);
	  });
  });


app.get("/selectchild", async (req, res) => {
	var children = await database.query("SELECT id, name FROM `children` WHERE `parent_id` = ?", [req.session.user_id]);
	console.log(children);
	res.render("selectchild", {children: children});
});
app.get("/addChild", async(req, res) => {
	var schools = await database.query("SELECT name, id FROM `schools` where creator = ?", [req.session.user_id]);
	console.log(schools);
	res.render("addChild", {schools: schools});
});
app.post("/addChild", async(req, res) => {
	console.log(req.body);
	console.log(req.session.user_id, req.body.name, req.body.grade, req.body.teachername, req.body.schoolid)
	try{
		var result = await database.query("INSERT INTO `children`(`parent_id`, `name`, `grade`, `teacher_name`, `school_id`, `teacher_gender`) VALUES (?, ?, ?, ?, ?, ?)", [req.session.user_id, req.body.name, req.body.grade, req.body.teachername, req.body.schoolid, req.body.teachergender]);
		res.redirect("selectChild");
	}
	catch(err){
		console.log(err);
		res.render("addChild", {error: true});
	}

});
app.get("/addSchool/:redirect", async(req, res) => {
	console.log(req.params.redirect);
	res.render("addSchool", {redirect: req.params.redirect});
});
app.post("/addSchool/:redirect", async(req, res) => {
	console.log(req.params.redirect)
	try{
		var result = await database.query("INSERT INTO `schools`(`creator`, `name`, `address`, `city`) VALUES (?,?,?,?)", [req.session.user_id, req.body.name, req.body.address, req.body.city]);
		res.redirect("/" + req.params.redirect.replace("&", "/"));
	}
	catch(err){
		console.log(err);
		res.render("addSchool", {error: true});
	}

});
app.get("/selectFile/:childid", async(req, res) => {
	var files = [{name: "Entschuldigung", destination:"Entschuldigung-Krankheit"}];
	res.render("selectFile", {files : files, childid : req.params.childid})
});
app.get("/login", (req, res) => {
	res.render("login", {error: false});
});
app.post("/login", async(req, res) => {
	var result = await accounts.login(req.body.email, req.body.password);
	console.log("result: " + result);
	if(result === false){
		res.render("login", {error: true});
		return;
	}
	req.session.auth = true;
	req.session.email = req.body.email;
	req.session.user_id = result;
	res.redirect("selectchild");
	//res.redirect('/pdf/Entschuldigung-Krankheit-Male.pdf?name=' + req.body.email);
});
app.get("/register", (req, res) => {
	res.render("register", {error: false});
});
app.post("/register", async (req, res) => {
	var success = await accounts.register(req.body.name, req.body.address, req.body.city, req.body.email, req.body.password);
	if(!success){
		res.render("register", {error: true});
		return;
	}
	res.redirect("login");
	return;
});



function sessionChecker(req, res, next){    
    console.log(`Session Checker: ${req.session.id}`);
    //console.log(req.session);
    if (req.session.auth || req.path === '/login' || req.path === '/register') {
        console.log(`Found User Session`);
        next();
    } else {
        console.log(`No User Session Found`);
        res.redirect('/login');
    }
};