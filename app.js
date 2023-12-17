const express = require("express");
const path = require("path");
const sqlite3 = require('better-sqlite3')
const db = sqlite3('./users.db', {verbose: console.log})
const session = require('express-session')
const dotenv = require('dotenv');
dotenv.config()
const bcrypt = require('bcrypt')


const app = express();
const staticPath = path.join(__dirname, 'public')

app.use(express.urlencoded({ extended: true }));


app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))


function checkUserPassword(username, password){

    const getOldHash = db.prepare('SELECT password FROM user WHERE username = ?');

    const oldHash = getOldHash.get(username);
    console.log("oldHash: ", oldHash.password)

    const result = bcrypt.compareSync(password, oldHash.password);
    console.log("Result of comparing passwords: " + result)


    if (result) {
        const sql = db.prepare('SELECT user.id, user.firstname, user.lastname, role.name as role FROM user INNER JOIN role where user.role_id = role.ID AND username = ?');
        let rows = sql.all(username);
        return rows.length > 0 ? rows[0]:null
    }
}



app.post('/login', (req, res) => {
    console.log(req.body)
    let user = checkUserPassword(req.body.username, req.body.password) 
    if (user != null) {
        req.session.loggedIn = true
        req.session.username = req.body.username
        req.session.userrole = user.role
        req.session.name = user.firstname + ' ' + user.lastname
        req.session.userid = user.ID
        //res.redirect('/');
        // Pseudocode - Adjust according to your actual frontend framework or vanilla JS
        if (req.session.userrole === 'Soldier' || req.session.userrole === 'Parent') {
            res.sendFile(path.join(__dirname, "public/peletonMembers.html"));
        } else if (req.session.userrole === 'Leader') {
            res.sendFile(path.join(__dirname, "public/leader.html"));
            //displayLeaderForm();
        } else if (req.session.userrole === 'Administrator') {
            res.sendFile(path.join(__dirname, "public/admin.html"));
            //displayAdministratorForm();
        }

    } else {
        req.session.loggedIn = false;
        res.sendFile(path.join(__dirname, "public/loginForm.html"));
    }

})
function addUser(username, firstName, lastName, mobile, email, password, role_id, peleton_id) {
    //Denne funksjonen må endres slik at man hasher passordet før man lagrer til databasen
    //rolle skal heller ikke være hardkodet.

    const sql = db.prepare("INSERT INTO user (username, firstname, lastname, mobile, email, password, role_id, peleton_id) values (?, ?, ?, ?, ?, ?, ?, ?)")

    saltRounds = 10
    const hash = bcrypt.hashSync(password, saltRounds);
    
    const info = sql.run(username, firstName, lastName, mobile, email, hash, role_id, peleton_id)
    return info
}

function selfAddUser(username, firstName, lastName, mobile, email) {
    //Denne funksjonen må endres slik at man hasher passordet før man lagrer til databasen
    //rolle skal heller ikke være hardkodet.

    const sql = db.prepare("INSERT INTO user (username, firstname, lastname, mobile, email, password, role_id) values (?, ?, ?, ?, ?, ?, ?)")

    const tempPassword = "temp"
    saltRounds = 10
    const hash = bcrypt.hashSync(tempPassword, saltRounds);
    
    const info = sql.run(username, firstName, lastName, mobile, email, hash, 5)
    return info
}

function updateUserDB(ID, username, firstname, lastname, mobile, email, role_id, peleton_id) {
    const sql = db.prepare("update user set username=(?), firstname=(?), lastname=(?), mobile=(?), email=(?), role_id=(?), peleton_id=(?)  WHERE ID=(?)")
    const info = sql.run(username, firstname, lastname, mobile, email, role_id, peleton_id, ID)
}

function updateUserDB2(ID, username, firstname, lastname, mobile, email, password, role_id, peleton_id) {
    const sql = db.prepare("update user set username=(?), firstname=(?), lastname=(?), mobile=(?), email=(?), password=(?), role_id=(?), peleton_id=(?)  WHERE ID=(?)")

    saltRounds = 10
    const hash = bcrypt.hashSync(password, saltRounds);

    const info = sql.run(username, firstname, lastname, mobile, email, hash, role_id, peleton_id, ID)
}

app.post('/register', (req, res) => {
    console.log(req.body)
    addUser(req.body.username, req.body.firstname, req.body.lastname, req.body.mobile, req.body.email, req.body.password, req.body.role_id, req.body.peleton_id)
    res.sendFile(path.join(__dirname, "public/loginForm.html"));
     
});

app.post('/selfRegister', (req, res) => {
    console.log(req.body)
    selfAddUser(req.body.username, req.body.firstname, req.body.lastname, req.body.mobile, req.body.email)
    res.sendFile(path.join(__dirname, "public/loginForm.html"));
     
});


app.use((req, res, next)=>{
    console.log(req.session)
    if (req.session.loggedIn != undefined && req.session.loggedIn) {
        console.log("Bruker innlogget")
        next()
    } else {
        console.log("Bruker not logged in - redirect i middleware")
        res.sendFile(path.join(__dirname, "public/loginForm.html"));
    }
})

const blockedExtensions = ['.html', '.txt', '.pdf']; // Add more extensions as needed

app.use((req, res, next) => {
    const urlPath = path.parse(req.originalUrl).ext;

    // Check if the URL has a blocked extension
    if (blockedExtensions.includes(urlPath)) {
        // Send an error response or redirect as needed
        console.log("URL has blocked extension: " + urlPath);
        if (req.session.userrole === 'Administrator') {
            next();
        } else if (req.session.userrole === 'Leader') {
            res.sendFile(path.join(__dirname, "public/leader.html"));
        } else if (req.session.userrole === 'Soldier' || req.session.userrole === 'Parent') {
            res.sendFile(path.join(__dirname, "public/peletonMembers.html"));
        }

    } else {
        // Continue to the next middleware or route
        next();
    }
});

app.get('/', (req, res, next) => {
    if (req.session.userrole === 'Administrator') {
        res.sendFile(path.join(__dirname, "public/admin.html"));
    } else if (req.session.userrole === 'Leader') {
        res.sendFile(path.join(__dirname, "public/leader.html"));
    } else if ((req.session.userrole === 'Soldier' || req.session.userrole === 'Parent')) {
        res.sendFile(path.join(__dirname, "public/peletonMembers.html"));
    }
})

app.use(express.static(staticPath));

async function getUsers(request, response) {

    const sql=db.prepare('SELECT ID, username, firstname, lastname, mobile, email, password, role_id, peleton_id FROM user')
    let rows = sql.all()   
    console.log("rows.length", rows.length)

    response.send(rows);

}


app.get("/users", getUsers);

app.post("/user", (req, res) => {
    console.log(req.body)
    const user = req.body
    if (user.newPassword != "") {
        updateUserDB2(user.ID, user.username, user.firstname, user.lastname, user.mobile, user.email, user.newPassword, user.role_id, user.peleton_id)
    } else {
        updateUserDB(user.ID, user.username, user.firstname, user.lastname, user.mobile, user.email, user.role_id, user.peleton_id)
    }
    res.redirect('/');
})

app.get('/api/activeUser', (req, res) => {
    const userId = req.session.userid;

    const sql = db.prepare(`SELECT user.ID, user.username, user.firstname, user.lastname, user.mobile, user.email, user.password, user.peleton_id, role.name as role FROM user INNER JOIN role ON user.role_id = role.ID WHERE user.ID = ?`);

    const activeUser = sql.get(userId);
    console.log("Active user: ", activeUser);
    res.json(activeUser);
});

app.get('/api/parentChildren', (req, res) => {
    const userId = req.session.userid;

    const sql = db.prepare(`SELECT user.ID, user.username, user.firstname, user.lastname, user.mobile FROM user JOIN parent_child ON user.ID = parent_child.child_id WHERE parent_child.parent_id = ?;`);

    const children = sql.all(userId);
    console.log(children);
    res.json(children);
});


app.get('/api/peletonMember', (req, res) => {
    const userId = req.session.userid;
    const desiredRole = 'Soldier';

    const sql = db.prepare(`SELECT user.ID, user.username, user.firstname, user.lastname, user.mobile, user.email, user.password, user.peleton_id, role.name as role FROM user INNER JOIN role ON user.role_id = role.ID WHERE role.name = ? AND peleton_id = (SELECT peleton_id FROM user WHERE ID = ?)`);

    const members = sql.all(desiredRole, userId);
    res.json(members);
});

app.get('/api/peletonLeader', (req, res) => {
    const userId = req.session.userid;
    const desiredRole = 'Leader';

    const sql = db.prepare(`SELECT user.ID, user.username, user.firstname, user.lastname, user.mobile, user.email, user.password, user.peleton_id, role.name as role FROM user INNER JOIN role ON user.role_id = role.ID WHERE role.name = ? AND peleton_id = (SELECT peleton_id FROM user WHERE ID = ?)`);
    const leaders = sql.all(desiredRole, userId);
    res.json(leaders);
});




app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});
