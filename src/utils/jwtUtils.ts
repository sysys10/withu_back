import jwt, { JwtPayload } from "jsonwebtoken";
const generateAccessToken = (userId: string): string => {
  return jwt.sign({ id: userId }, process.env.ACCESS_TOKEN_SECRET || "", {
    expiresIn: "1h",
  });
};

const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET || "", {
    expiresIn: "7d",
  });
};

const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || "") as JwtPayload;
};

const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(
    token,
    process.env.REFRESH_TOKEN_SECRET || ""
  ) as JwtPayload;
};

export {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
