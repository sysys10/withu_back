import axios from "axios";
import express from "express";

export const naverRouter = express.Router();

naverRouter.get("/", (req, res) => {
  res.send("Hello World");
});

const clientId = process.env.NAVER_API_CLIENT_ID;
const clientSecret = process.env.NAVER_API_CLIENT_SECRET;

naverRouter.get("/search/:query", async (req, res) => {
  const { query } = req.params;
  const { data } = await axios.get(
    `https://openapi.naver.com/v1/search/local.json?query=${query}&display=5&start=1&sort=random`,
    {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
    }
  );
  console.log(data);
  res.json(data);
});
