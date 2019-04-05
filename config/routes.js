const axios = require("axios");
const bcrypt = require("bcryptjs");
const db = require("../database/dbConfig");
const jwt = require("jsonwebtoken");

const { authenticate } = require("../auth/authenticate");

module.exports = server => {
  server.post("/api/register", register);
  server.post("/api/login", login);
  server.get("/api/jokes", authenticate, getJokes);
};

function register(req, res) {
  // implement user registration
  const user = req.body;
  if (user.username && user.password) {
    user.password = bcrypt.hashSync(user.password, 5);
    db("users")
      .insert(user)
      .then(([id]) => {
        db("users")
          .where({ id: id })
          .first()
          .then(user => res.status(200).json(user))
          .catch(err => res.status(500).json(err));
      })
      .catch(err => res.status(500).json(err));
  } else {
    res.status(403).json({ message: "required fields were not provided" });
  }
}

function login(req, res) {
  // implement user login
  const { username, password } = req.body;

  db("users")
    .where({ username: username })
    .first()
    .then(user => {
      if (user && bcrypt.compareSync(password, user.password)) {
        const token = generateToken(user);
        res.status(200).json({
          message: `Welcome ${user.username}!`,
          token
        });
      } else {
        res.status(401).json({ message: "Invalid Credentials" });
      }
    })
    .catch(err => res.status(500).json(err));
}

function getJokes(req, res) {
  const requestOptions = {
    headers: { accept: "application/json" }
  };

  axios
    .get("https://icanhazdadjoke.com/search", requestOptions)
    .then(response => {
      res.status(200).json(response.data.results);
    })
    .catch(err => {
      res.status(500).json({ message: "Error Fetching Jokes", error: err });
    });
}

function generateToken(user) {
  const payload = {
    subject: user.id,
    username: user.username
  };
  const secret =
    "add a .env file to root of project with the JWT_SECRET variable";
  const options = {
    expiresIn: "1d"
  };

  return jwt.sign(payload, secret, options); // returns valid token
}
