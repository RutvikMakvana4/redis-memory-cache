export const redisCacheMiddleware = (redisClient) => {
  return async (req, res, next) => {
    const key = req.originalUrl;
    console.log(`Checking Redis cache for key: ${key}`);

    if (!redisClient || !redisClient.isOpen) {
      console.error("Redis client is not connected.");
      return next();
    }

    try {
      const data = await redisClient.get(key);

      if (data) {
        console.log(`Serving cached response for key: ${key}`);
        return res.send(JSON.parse(data));
      }

      console.log(`No cache found for key: ${key}`);
      next();
    } catch (err) {
      console.error("Redis error:", err);
      return res.status(500).send("Server error");
    }
  };
};
