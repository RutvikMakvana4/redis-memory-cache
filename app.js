import "dotenv/config";
import express from "express";
import axios from "axios";
import path from "path";
import redisClient from "./common/redis/redisClient";
import { redisCacheMiddleware } from "./middlewares/redisMiddleware";

const app = express();
const PORT = process.env.PORT || 8004;

app.use(express.urlencoded({ extended: false, limit: "52428800" }));
app.use(express.json({ limit: "52428800" }));

// Middleware for response time
const responseTimeMiddleware = (req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `Request to ${req.method} ${req.originalUrl} took ${duration} ms`
    );
  });
  next();
};

app.use(responseTimeMiddleware);

app.get("/test", redisCacheMiddleware(redisClient), async (req, res) => {
  const key = req.originalUrl;

  try {
    const response = await axios.get("https://api.spacexdata.com/v3/rockets");

    await redisClient.set(key, JSON.stringify(response.data), "EX", 3600);
    console.log(`Data cached successfully for key: ${key}`);

    res.send(response.data);
  } catch (error) {
    console.error("Error fetching or caching data:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.use(express.static(path.join(__dirname, "/public")));

app.listen(PORT, () => {
  console.log(
    `Server is running on http://${process.env.HOST || "localhost"}:${PORT}`
  );
});
