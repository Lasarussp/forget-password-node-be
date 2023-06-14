import express from "express";
import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";
import cors from "cors";
import UserRouter from "./routes/user.route.js";

dotenv.config();
const app = express();
app.use(cors());

//middlewares
app.use(express.json());

//PORT
const PORT = process.env.PORT;

// const MONGO_URL = "mongodb://127.0.0.1";
const MONGO_URL = process.env.MONGO_URL;

const client = new MongoClient(MONGO_URL);
await client.connect();
console.log("Mongodb is connected successfully 🎉✨");

//Routes
app.use("/api/user", UserRouter);

//Home
app.get("/", function (request, response) {
  response.send("🙋‍♂️, 🌏 🎊✨🤩 <h1>Welcome to Password Reset App<h1>");
});

app.listen(PORT, () => console.log(`The server started in: ${PORT} ✨✨`));

export { client };
