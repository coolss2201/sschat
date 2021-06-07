const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const io = require("socket.io")(server);
const bodyparser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const port = process.env.PORT || 4500;
const path = require("path");
const multer = require("multer");
const dburl =
  "mongodb+srv://user:user@cluster0.dhnws.mongodb.net/chatdb?retryWrites=true&w=majority";

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "static")));
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: false }));
app.use(cors());

var Cred = mongoose.model("Cred", {
  id: String,
  pass: String,
});

var User = mongoose.model("User", {
  name: String,
  id: String,
  dp: String,
  status: String,
  pictures: Array,
  messages: [
    {
      id: String,
      msg: [
        {
          id: String,
          chat: String,
        },
      ],
    },
  ],
});

var Storage = multer.diskStorage({
  destination: "./static/images",
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
  },
});

function compare(a, b) {
  if (a.name.toLowerCase() < b.name.toLowerCase()) {
    return -1;
  }
  if (a.name.toLowerCase() > b.name.toLowerCase()) {
    return 1;
  }
  return 0;
}

var upload = multer({ storage: Storage }).single("dp");

app.get("/", (req, res) => {
  res.render("index", { data: false });
});
app.get("/newaccount", (req, res) => {
  res.render("new-account", { data: false });
});
app.get("/profile/:id", (req, res) => {
  id = req.params.id;
  User.findOne({ id: id }, (err, user) => {
    res.render("profile", { user: user });
  });
});

app.get("/user/:sender/:receiver", (req, res) => {
  User.findOne({ id: req.params.sender }, (err, data) => {
    User.find({}, (err, users) => {
      users.sort(compare);
      User.findOne({ id: req.params.receiver }, (err, f) => {
        if (
          data.messages.length == 0 ||
          data.messages.find((obj) => {
            return obj.id == req.params.receiver;
          }) == undefined
        ) {
          res.render("home", {
            name: data.dp,
            id: data.id,
            users: users,
            chats: [],
            chat: true,
            f: f,
          });
        } else {
          for (let i = 0; i < data.messages.length; i++) {
            if (data.messages[i].id == req.params.receiver) {
              res.render("home", {
                name: data.dp,
                id: data.id,
                users: users,
                chats: data.messages[i].msg,
                chat: true,
                f: f,
              });
            }
          }
        }
      });
    });
  });
});

app.post("/post", (req, res) => {
  var sender = req.body.myid;
  var receiver = req.body.fid;
  var msg1 = req.body.msg;
  User.findOne({ id: sender }, (err, send) => {
    if (
      send.messages.length == 0 ||
      send.messages.find((obj) => {
        return obj.id == receiver;
      }) == undefined
    ) {
      User.findOneAndUpdate(
        { id: sender },
        { $push: { messages: { id: receiver, msg: [] } } },
        (err, data) => {
          User.findOneAndUpdate(
            { id: sender, "messages.id": receiver },
            { $push: { "messages.$.msg": { id: sender, chat: msg1 } } },
            (err, data) => {}
          );
        }
      );
    } else {
      User.findOneAndUpdate(
        { id: sender, "messages.id": receiver },
        { $push: { "messages.$.msg": { id: sender, chat: msg1 } } },
        (err, data) => {}
      );
    }
  });
  User.findOne({ id: receiver }, (err, send) => {
    if (
      send.messages.length == 0 ||
      send.messages.find((obj) => {
        return obj.id == sender;
      }) == undefined
    ) {
      User.findOneAndUpdate(
        { id: receiver },
        { $push: { messages: { id: sender, msg: [] } } },
        (err, data) => {
          User.findOneAndUpdate(
            { id: receiver, "messages.id": sender },
            { $push: { "messages.$.msg": { id: sender, chat: msg1 } } },
            (err, data) => {}
          );
        }
      );
    } else {
      User.findOneAndUpdate(
        { id: receiver, "messages.id": sender },
        { $push: { "messages.$.msg": { id: sender, chat: msg1 } } },
        (err, data) => {}
      );
    }
  });
});

app.post("/delete", (req, res) => {
  fid = req.body.fid;
  myid = req.body.myid;
  ar = [fid, myid].sort();
  User.findOneAndUpdate(
    { id: fid, "messages.id": myid },
    { "messages.$.msg": [] },
    (err, data) => {
      User.findOneAndUpdate(
        { id: myid, "messages.id": fid },
        { "messages.$.msg": [] },
        (err, data) => {
          io.to(ar[0] + ar[1]).emit("deleted");
        }
      );
    }
  );
});

app.post("/change-name", (req, res) => {
  var id = req.body.id;
  var name = req.body.name;
  User.findOneAndUpdate({ id: id }, { name: name }, (err, data) => {
    io.emit("name-changed", id, name);
  });
});

app.post("/change-dp", (req, res) => {
  var id = req.body.id;
  var name = req.body.dp.toString().trim();
  User.findOneAndUpdate(
    { id: id },
    { $pull: { pictures: name } },
    { new: true },
    (err, user) => {
      var dp = user.dp;
      User.findOneAndUpdate(
        { id: id },
        { $push: { pictures: dp }, dp: name },
        { new: true },
        (err, data) => {
          if (err) console.log(err);
          else {
            io.emit("dp-changed", data.id, data.dp);
          }
        }
      );
    }
  );
});

app.post("/profile/:id", upload, (req, res) => {
  var name = req.file.filename;
  User.findOne({ id: req.params.id }, (err, user) => {
    var dp = user.dp;
    User.findOneAndUpdate(
      { id: req.params.id },
      { $push: { pictures: dp }, dp: name },
      { new: true },
      (err, data) => {
        if (err) console.log(err);
        else {
          io.emit("dp-changed", data.id, data.dp);
          res.redirect(req.params.id)
        }
      }
    );
  });
});


// var uid;
// var upass;
// app.post("/user", (req, res) => {
//   try{
//   id = req.body.id;
//   pass=req.body.password;
//   if(id==undefined){
//     id=uid;
//     pass=upass;
//   }
//   else{
//     uid=id;
//     upass=pass;
//   }
//   }
//   catch(err){
//     console.log(err)
//   }
//   Cred.findOne({ id: id }, (err, data) => {
//     if (data == null) res.render("index", { data: true });
//     else {
//       if (data.pass == pass) {
//         User.findOne({ id: id }, (err, data) => {
//           User.find({}, (err, users) => {
//             res.render("home", {
//               name: data.dp,
//               id: id,
//               users: users.sort(compare),
//               chats: [],
//               chat: false,
//             });
//           });
//         });
//       } else res.render("index", { data: true });
//     }
//   });
// });


app.post("/user", (req, res) => {
  id = req.body.id;
  pass=req.body.password;
  Cred.findOne({ id: id }, (err, data) => {
    if (data == null) res.render("index", { data: true });
    else {
      if (data.pass == pass) {
        User.findOne({ id: id }, (err, data) => {
          User.find({}, (err, users) => {
            res.render("home", {
              name: data.dp,
              id: id,
              users: users.sort(compare),
              chats: [],
              chat: false,
            });
          });
        });
      } else res.render("index", { data: true });
    }
  });
});

app.post("/created", (req, res) => {
  var name = req.body.name;
  var pass = req.body.password;
  var id = req.body.id;
  Cred.findOne({ id: id }, (err, data) => {
    if (data == null) {
      var cred = new Cred({ id: id, pass: pass });
      var user = new User({
        name: name,
        id: id,
        dp: "profile.png",
        status: "offline",
        pictures: [],
        messages: [],
      });
      cred.save((err) => {
        if (err) console.log(err);
        else {
          user.save((err) => {
            if (err) console.log(err);
            else res.render("index", { data: false });
          });
        }
      });
    } else {
      res.render("new-account",{data:true})
    }
  });
});

app.post("/deleteacc", (req, res) => {
  id = req.body.id;
  io.emit("user-deleted", id);
  User.findOneAndDelete({ id: id }, (err) => {
    Cred.findOneAndDelete({ id: id }, (err) => {
      User.updateMany(
        { "messages.id": id },
        { $pull: { messages: { id: id } } },
        (err, data) => {
          res.send("hello");
        }
      );
    });
  });
});

mongoose.connect(
  dburl,
  { useNewUrlParser: true, useUnifiedTopology: true },
  (err) => {
    console.log("database connected", err);
  }
);

users = {};

io.on("connection", (socket) => {
  var roomname;
  socket.on("new-user", (id) => {
    users[socket.id] = id;
    User.findOneAndUpdate({ id: id }, { status: "online" }, (err, data) => {
      socket.broadcast.emit("user-connected", id);
    });
  });
  socket.on("room-created", (room) => {
    roomname = room;
    socket.join(room);
  });
  socket.on("send-message", (msg, room) => {
    socket.to(room).emit("message", msg);
  });
  socket.on("disconnect", () => {
    User.findOneAndUpdate(
      { id: users[socket.id] },
      { status: "offline" },
      (err, data) => {
        socket.broadcast.emit("user-disconnected", users[socket.id]);
        socket.leave(roomname);
        delete users[socket.id];
      }
    );
  });
});
server.listen(port, () => {
  console.log("server is listening at port ", port);
});
