import jwt from "jsonwebtoken";

export const auth = function (req, res, next) {
  if (req.headers.authorization) {
    const verify = jwt.verify(
      req.headers.authorization,
      process.env.SECRET_KEY
    );
    if (verify) {
      req.userid = verify._id;
      req.username = verify.username;
      next();
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};
