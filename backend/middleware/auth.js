const axios = require("axios");

// axios instance for ASP.NET auth checks
const aspnetAuthClient = axios.create({
  baseURL: process.env.CLIENT_ORIGIN || "http://localhost:49928",
  withCredentials: true,
  timeout: 5000,
  headers: {
    "X-Requested-With": "XMLHttpRequest",
  },
});

/**
 * Express middleware to verify ASP.NET authentication
 */
const verifyAspnetAuth = async (req, res, next) => {
  if (req.method === "OPTIONS") return next();

  try {
    const response = await aspnetAuthClient.get("/api/auth/check", {
      headers: {
        Cookie: req.headers.cookie || "",
      },
    });

    if (response.data.isAuthenticated) {
      // Attach enriched user object
      req.user = {
        ...response.data,
        ip: req.ip,
        timestamp: new Date().toISOString(),
        forwardedFor:
          req.headers["x-forwarded-for"] || req.connection.remoteAddress,
      };
      return next();
    }

    // Not authenticated
    res.status(401).json({
      message: "Unauthorized",
      loginUrl: `${
        aspnetAuthClient.defaults.baseURL
      }/Account/Login?returnUrl=${encodeURIComponent(req.originalUrl)}`,
      code: "AUTH_REQUIRED",
    });
  } catch (error) {
    console.error(
      `Auth verification failed [${req.method} ${req.path}]:`,
      error.message
    );

    // Special handling for 404
    if (error.response?.status === 404) {
      return res.status(502).json({
        message: "Authentication endpoint not found",
        endpoint: `${aspnetAuthClient.defaults.baseURL}/api/auth/check`,
        solution:
          "Verify: 1) ASP.NET is running, 2) Route is registered, 3) CORS is configured",
      });
    }
  }
};

module.exports = {
  verifyAspnetAuth,
  aspnetAuthClient, // Export if needed elsewhere
};
