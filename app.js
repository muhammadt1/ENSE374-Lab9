const express = require("express");
const fs = require("fs");
const b = require("body-parser");
// Bring in mongoose
const mongoose = require( 'mongoose' );
const session = require("express-session")
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")
require("dotenv").config();

const app = express();

const port = 3000;

mongoose.connect( 'mongodb://localhost:27017/list', 
                  { useNewUrlParser: true, useUnifiedTopology: true });




//.model is for organization of data to RD's  

//schema1
const usersInfo = new mongoose.Schema ({
    username: String,
    password: String
});

//schema2
const taskInfo = new mongoose.Schema({
   text: String,
   state: String,
   creator: String,
   isTaskClaimed: Boolean,
   claimingUser: String,
   isTaskDone: Boolean,
   isTaskCleared: Boolean
})


const u = mongoose.model ("u",usersInfo);
const t = mongoose.model ("t",taskInfo);



usersInfo.plugin(passportLocalMongoose);
passport.use(u.serializeUser());




app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});


app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use (passport.initialize());
app.use (passport.session());

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(b.json());




app.get("/", (req, res) => {
    res.render(__dirname + "/views/index.ejs");
    console.log("A user requested the page");
});


let activeUser;
let users = require('./users.json');


app.post("/login", (req, res) => {
    const eInp = req.body["Email"];
    const pInp = req.body["Password"];

    fs.readFile(__dirname + "/users.json", "utf8", (err, jsonString) => {
        if (err) {
            console.log("Error reading file from disk:", err);
            return res.redirect("/");
        }

        try {
            const users = JSON.parse(jsonString);

            console.log("The Email user entered is:", eInp);
            console.log("The Password user entered is:", pInp);

            // Check if there is a user with the entered credentials
            let validUser = false;

            for (const user of users) {
                if (user.username === eInp && user.password === pInp) {
                    validUser = true;
                    break;
                }
            }

            // Inside the /login route
            if (validUser) 
            {
                let tk = jsonInf("tasks.json");

                console.log("Success, redirecting");
                res.render("list.ejs", { tasks: tk.tasks, username: activeUser });
            } 
            else 
            {
                console.log("Failure, please try again");
                res.redirect("/");
            }

        } catch (err) {
            console.log("Error parsing JSON:", err);
        }
    });
});



app.post("/register", (req, res) => {

    const ep = req.body["EmailSign"];
    const pp = req.body["PasswordSign"];
    const authenPass = "todo2023";
    const unew = { username: ep, password: pp };

    const userExists = users.some(u => u.username === ep);

    if (!userExists && req.body["todo2023"] === authenPass) 
    {
        users.push(unew);
        fs.writeFileSync('./users.json', JSON.stringify(users, null, 2));
        activeUser = req.body["EmailSign"];
        
        res.redirect("/");
    } 
    else 
    {
        res.redirect("/");
    }
});

function jsonInf(file) {
    const fd = fs.readFileSync(__dirname + "/" + file, 'utf8');
    const psd = JSON.parse(fd);
    return psd;
}

function userSave(newUser, file) {
    fs.writeFile(__dirname + '/users.json', JSON.stringify(userArr), 'utf8', (error) => {
        if (error) {
            console.log("Error writing the file:", error);
        }
    });
}

function userTask(newUser, file) 
{
    fs.writeFile(__dirname + '/tasks.json', JSON.stringify(userArr), 'utf8', (error) => {
        if (error) {
            console.log("Error writing the file:", error);
        }
    });
}

const userArr = [];
const taskArr = [];

app.get("/logout", (req, res) => {
    res.redirect("/");
});

app.post("/addTask", (req, res) => {
    let tk = jsonInf("tasks.json");
    let iter = taskArr.length;

    let newTask = req.body["task"];
    iter++;
    tk.tasks.push({
        "id": iter,
        "text": newTask,
        "state": "unclaimed",
        "creator": activeUser,
        "isTaskClaimed": false,
        "claimingUser": null,
        "isTaskDone": false,
        "isTaskCleared": false
    });
    activeUser = req.body.username;

    userTask(tk, "tasks.json");
    res.render("list.ejs", { tasks: tk.tasks, username: activeUser });
});

app.post("/claim", (req, res) => {
    activeUser = req.body["username"];
    const tsk = req.body["userNum"];

    for (let i = 0; i < taskArr.length; i++) {
        if (taskArr[i].id === tsk) {
            taskArr[i].claimingUser = activeUser;
            taskArr[i].isTaskClaimed = false;
            taskArr[i].state = "unfinished";
            break;
        }
    }

    res.redirect("/list");
});

app.post("/abandonorcomplete", (req, res) => {
    const tsk = jsonInf("./tasks.json");
    activeUser = req.body.username;
    const id = req.body.id;

    for (let i = 0; i < tsk.tasks.length; i++) {
        if (tsk.tasks[i].id === id) {
            tsk.tasks[i].claimingUser = activeUser;
            tsk.tasks[i].isTaskClaimed = false;
            tsk.tasks[i].state = "unclaimed";
            break;
        }
    }

    userSave(tsk, "tasks.json");
    res.redirect("/views/list");
});

app.post("/unfinish", (req, res) => {
    const tsks = jsonInf("./tasks.json");
    const t = req.body.id;

    for (let i = 0; i < tsks.tasks.length; i++) {
        if (tsks.tasks[i].id === t) {
            tsks.tasks[i].state = "unfinished";
            userTask(tsks, "tasks.json");
            break;
        }
    }

    res.redirect("/list");
});

app.post("/purge", (req, res) => {
    const tsk = jsonInf("./tasks.json");

    tsk.tasks.forEach(task => {
        if (task.isTaskDone) {
            task.isTaskCleared = true;
        }
    });

    userTask(tsk, "tasks.json");
    res.redirect("/list");
});

/*MONGOOSE SCHEMAS FOR USERS AND TASKS*/ 
const firstUser = new u({
    username: "muhammad.etariq@gmail.com",
    password: "testpassword"
})

const secondUser = new u ({
    username: "user2@gmail.com",
    password: "testpassword2"
})





const taskOne = new t({
    id: 1,
    text: "the unclaimed task",
    state: "unfinished",
    creator:"firstUser",
    isTaskClaimed: false,
    claimingUser:null,
    isTaskDone: false,
    isTaskCleared:false
})
const taskTwo = new t({
    id: 2,
    text: "the task claimed by firstUser and unfinished",
    state: "unfinished",
    creator:"firstUser",
    isTaskClaimed: true,
    claimingUser:"firstUser",
    isTaskDone: false,
    isTaskCleared:false
})

const taskThree = new t({
    id: 3,
    text: "the task claimed by secondUser and unfinished",
    state: "unfinished",
    creator:"firstUser",
    isTaskClaimed: true,
    claimingUser:"secondUser",
    isTaskDone: false,
    isTaskCleared:false
})

const taskFour = new t({
    id: 4,
    text: "the task claimed by firstUser and finished",
    state: "finished",
    creator:"firstUser",
    isTaskClaimed: true,
    claimingUser:"firstUser",
    isTaskDone: true,
    isTaskCleared:false
})

const taskFive = new t({
    id: 5,
    text: "the task claimed by secondUser and finished",
    state: "finished",
    creator:"firstUser",
    isTaskClaimed: true,
    claimingUser:"secondUser",
    isTaskDone: true,
    isTaskCleared:false
})


firstUser.save();
secondUser.save()

taskOne.save();
taskTwo.save();
taskThree.save();
taskFour.save();
taskFive.save();