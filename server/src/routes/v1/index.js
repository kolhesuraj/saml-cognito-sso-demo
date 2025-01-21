/* eslint-disable operator-linebreak */
import express from "express";
import authRoute from "./auth.route.js";
import samlRoute from "./saml.route.js";
import selfRoute from "./self.route.js";
import authenticateToken from "../../middlewares/auth.js";

const router = express.Router();

const defaultRoutes = [
  {
    path: "/auth",
    route: authRoute,
  },
  {
    path: "/self",
    route: selfRoute,
  },
  {
    path: "/saml",
    route: samlRoute,
  },
];

// Apply the authenticateToken middleware to all routes except /auth/*
router.use((req, res, next) => {
  if (req.path.startsWith("/auth") || req.path.startsWith("/public")) {
    next(); // Skip the authenticateToken middleware for /auth/* and /public/* routes
  } else {
    // Apply the authenticateToken middleware for all other routes
    authenticateToken(req, res, next);
  }
});

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
