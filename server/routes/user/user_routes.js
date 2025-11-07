const express = require("express");
const route = express.Router();

const services = require("../../services/user/user_services");
const controller = require("../../controller/user/userController");

const {
  isUserAuthenticated,
  isUserNotAuthenticated
} = require("../../middleware/user/userAuth");

route.get("/login",isUserNotAuthenticated, services.login);
route.get("/", services.home);
route.get("/courses",isUserAuthenticated, services.courses);
route.get("/course-detail/:id",isUserAuthenticated, services.courseDetail);
route.get("/register",isUserNotAuthenticated, services.register);
route.get("/otp-verify",isUserNotAuthenticated, services.otpverify);

route.post("/api/register", controller.registerUser);
route.post("/api/login", controller.loginUser);
route.post("/api/enroll", controller.enrollCourse);
route.post("/api/payment-success", controller.paymentSuccess);
route.get("/api/logout", controller.logout);

route.get("/api/courses", controller.getCourses);
route.get("/api/course-detail/:id", controller.getCourseDetail);


route.post('/api/verify-otp', controller.verifyOtp);
route.post('/api/resend-otp', controller.resendOtp);

module.exports = route;