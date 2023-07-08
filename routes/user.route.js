import express from "express";
import rn from "random-number";
import { client } from "../index.js";
import {
  createUser,
  generateHashPassword,
  getUserByEmail,
  getUserByName,
} from "../services/user.service.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

//Express Router
const router = express.Router();
const options = {
  min: 1000,
  max: 9999,
  integer: true,
};

//SignUp Router
router.post("/signup", async function (request, response) {
  try {
    const { username, password, email } = request.body;

    const userFromDB = await getUserByName(username);
    const emailFromDB = await getUserByEmail(email);
    console.log(userFromDB);
    console.log(emailFromDB);
    if (userFromDB) {
      response.status(400).send({ message: "UserName already exists" });
    } else if (password.length <= 6) {
      response
        .status(400)
        .send({ message: "password must be alteast 6 characters" });
    } else if (emailFromDB) {
      response.status(400).send({ message: "Email already exists" });
    } else {
      const hashedPassword = await generateHashPassword(password);
      const result = await createUser({
        username: username,
        email: email,
        password: hashedPassword,
      });
      response.send(result);
    }
  } catch (error) {
    console.log(error);
  }
});

//Login Router
router.post("/login", async function (request, response) {
  try {
    const { username, password } = request.body;

    const userFromDB = await getUserByName(username);

    console.log(userFromDB);
    if (!userFromDB) {
      response.status(401).send({ message: "Invalid Credential" });
    } else {
      const storedDBPassword = userFromDB.password;
      const isPasswordMatch = await bcrypt.compare(password, storedDBPassword);
      console.log(isPasswordMatch);
      if (isPasswordMatch) {
        const token = jwt.sign({ id: userFromDB._id }, process.env.SECRET_KEY);
        response.send({
          message: "Successful Login",
          token: token,
          username: userFromDB,
        });
        console.log("token", token);
      } else {
        response.status(401).send({ message: "Invalid Credential" });
      }
    }
  } catch (error) {
    console.log(error);
  }
});

//Verification Mail send by user
router.post("/sendmail", async function (request, response) {
  try {
    const { username, password, email } = request.body;
    const userFromDB = await getUserByEmail(email);
    console.log(userFromDB);
    if (userFromDB) {
      let randomnum = rn(options);
      console.log("body Email", request.body.email);
      await client
        .db("resetPassword")
        .collection("users")
        .updateOne(
          { email: request.body.email },
          { $set: { rnum: randomnum } }
        );
      var transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        secure: false,
        auth: {
          user: `${process.env.USER}`,
          pass: `${process.env.PASSWORD}`,
        },
      });

      var mailOptions = {
        from: "codewithbobg@gmail.com",
        to: `${request.body.email}`,
        subject: "User verification",
        text: `${randomnum}`,
      };

      await transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
          response.json({
            message: "Error",
          });
        } else {
          console.log("Email sent: " + info.response);
          response.json({
            message: "Email sent",
          });
        }
      });
    }
  } catch (error) {
    console.log(error);
  }
});

router.post("/verify", async (req, res) => {
  try {
    const user = await client
      .db("resetPassword")
      .collection("users")
      .findOne({ email: req.body.email });
    if (user.rnum === req.body.vercode) {
      res.status(200).json(user);
    } else {
      res.status(400).json({ message: "Invalid Verification Code" });
    }
  } catch (error) {
    console.log(error);
  }
});

router.post("/changepassword/:id", async function (request, response) {
  try {
    console.log(request.params.id);
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(request.body.password, salt);
    request.body.password = hash;
    await client
      .db("resetPassword")
      .collection("users")
      .updateOne({ email: request.params.id }, { $set: request.body });

    response.json({ message: "Password updated successfully" });
  } catch (error) {
    console.log(error);
  }
});
export default router;
