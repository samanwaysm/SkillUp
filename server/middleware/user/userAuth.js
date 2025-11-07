// middlewares/userAuth.js

// ✅ Check if user is logged in
function isUserAuthenticated(req, res, next) {
  if (req.session.userId && req.session.user) {
    return next();
  }
  req.session.errors = { auth: "Please log in to access this page." };
  return res.redirect("/login");
}

// ✅ Check if user is NOT logged in
function isUserNotAuthenticated(req, res, next) {
  if (req.session.userId && req.session.user) {
    // Already logged in → redirect to home/dashboard
    return res.redirect("/"); 
  }
  next();
}

module.exports = { isUserAuthenticated, isUserNotAuthenticated };
