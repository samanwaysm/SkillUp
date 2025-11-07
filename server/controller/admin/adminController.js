const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const nodemailer = require('nodemailer');

const Course = require("../../../model/course/courseSchema");
const User = require("../../../model/user/userSchema");

exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;
  const errors = {};

  // Validation
  if (!email) errors.email = "Email is required.";
  if (!password) errors.password = "Password is required.";

  if (Object.keys(errors).length > 0) {
    return res.json({ success: false, errors });
  }

  // Check credentials from .env
  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASS) {
    // ✅ Save admin session
    req.session.isAdmin = true;
    req.session.admin = { email };

    return res.json({
      success: true,
      message: "Login successful",
      redirect: "/dashboard",
    });
  }

  // Invalid credentials
  errors.password = "Invalid email or password.";
  return res.json({ success: false, errors });
};

exports.addCourse = async (req, res) => {
  try {
    const { title, description, type, price } = req.body;
    const errors = {};

    // Basic validation
    if (!title || title.trim() === "") errors.title = "Title is required.";
    if (!description || description.trim() === "") errors.description = "Description is required.";
    if (!type) errors.type = "Course type is required.";

    if (type === "paid") {
      if (!price || isNaN(price) || Number(price) <= 0) {
        errors.price = "Please enter a valid price for paid courses.";
      }
    }

    // If validation failed
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    // Create new course
    const newCourse = new Course({
      title,
      description,
      type,
      price: type === "free" ? 0 : price
    });

    await newCourse.save();

    return res.status(200).json({
      success: true,
      message: "Course added successfully!",
      course: newCourse
    });
  } catch (err) {
    console.error("Error adding course:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later."
    });
  }
};

// // Get all courses
// exports.getAllCourses = async (req, res) => {
//   try {
//     const courses = await Course.find();
//     res.json({ success: true, data: courses });
//   } catch (error) {
//     console.error('Error fetching courses:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// };
exports.getAllCourses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5; // Number of courses per page
    const skip = (page - 1) * limit;

    const total = await Course.countDocuments();
    const courses = await Course.find().skip(skip).limit(limit);

    res.json({
      success: true,
      data: courses,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    await Course.findByIdAndDelete(id);
    res.json({ success: true, message: "Course deleted successfully" });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ success: false, message: "Failed to delete course" });
  }
};

// Get single course for edit page
exports.getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    res.json({ success: true, data: course });
  } catch (error) {
    console.error("Error fetching course:", error);
    res.status(500).json({ success: false, message: "Failed to fetch course" });
  }
};

// Update course
exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, type, price } = req.body;

    await Course.findByIdAndUpdate(id, { title, description, type, price }, { new: true });
    res.json({ success: true, message: "Course updated successfully" });
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ success: false, message: "Failed to update course" });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { page = 1, search = "" } = req.query;
    const limit = 5;
    const skip = (page - 1) * limit;

    const query = search
      ? { name: { $regex: search, $options: "i" } }
      : {};

    const [users, total] = await Promise.all([
      User.find(query).skip(skip).limit(limit),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get single user for edit page
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ success: false, message: "Failed to fetch user" });
  }
};

// Update user details
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;
    const errors = {};

    if (!name) errors.name = "Name is required.";
    if (!email) errors.email = "Email is required.";
    if (!phone) errors.phone = "Phone number is required.";

    if (Object.keys(errors).length > 0)
      return res.status(400).json({ success: false, errors });

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { name, email, phone },
      { new: true }
    );

    if (!updatedUser)
      return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, message: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ success: false, message: "Failed to update user" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);

    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ success: false, message: "Failed to delete user" });
  }
};

exports.getDashboardCounts = async (req, res) => {
  try {
    const courseCount = await Course.countDocuments();
    const userCount = await User.countDocuments();

    res.json({
      success: true,
      data: {
        courses: courseCount,
        users: userCount
      }
    });
  } catch (error) {
    console.error("Dashboard count error:", error);
    res.json({ success: false, message: "Error fetching dashboard counts" });
  }
};
