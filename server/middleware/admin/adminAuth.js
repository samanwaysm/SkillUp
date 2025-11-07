// ✅ Check if admin is logged in
function isAdminAuthenticated(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  req.session.errors = { auth: "Please log in as admin to access this page." };
  return res.redirect("/admin-login");
}

// ✅ Check if admin is NOT logged in
function isAdminNotAuthenticated(req, res, next) {
  if (req.session && req.session.isAdmin) {
    // Already logged in → redirect to admin dashboard
    return res.redirect("/dashboard");
  }
  next();
}

module.exports = { isAdminAuthenticated, isAdminNotAuthenticated };
