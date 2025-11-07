const express = require("express");
const route = express.Router();

const services = require("../../services/admin/admin_services");
const controller = require("../../controller/admin/adminController");

const {
  isAdminAuthenticated,
  isAdminNotAuthenticated
} = require("../../middleware/admin/adminAuth");

route.get("/admin-login",isAdminNotAuthenticated, services.adminLogin);
route.get("/dashboard",isAdminAuthenticated, services.dashboard);
route.get("/course-list",isAdminAuthenticated, services.courseList);
route.get("/add-course",isAdminAuthenticated, services.addCourse);
route.get("/edit-course/:id",isAdminAuthenticated, services.editCourse);
route.get("/users-list",isAdminAuthenticated, services.usersList);
route.get("/edit-user/:id",isAdminAuthenticated, services.editUser);

route.post("/admin/adminlogin", controller.adminLogin);

route.post("/admin/add-course", controller.addCourse);

route.get("/admin/get-courses", controller.getAllCourses);

route.get("/admin/get-course/:id", controller.getCourseById);
route.put("/admin/update-course/:id", controller.updateCourse);
route.delete("/admin/delete-course/:id", controller.deleteCourse);
route.get("/admin/get-users", controller.getUsers);
route.get('/admin/get-user/:id', controller.getUserById);
route.put('/admin/update-user/:id', controller.updateUser);
route.delete("/admin/delete-user/:id", controller.deleteUser);

route.get("/admin/dashboard-counts", controller.getDashboardCounts);

module.exports = route;