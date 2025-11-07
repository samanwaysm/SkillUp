const bcrypt = require("bcrypt");
const nodemailer = require('nodemailer');
const Mailgen = require('mailgen');
const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASS,
  },
});

const User = require("../../../model/user/userSchema");
const Course = require("../../../model/course/courseSchema");
const Enrollment = require("../../../model/user/enrollmentSchema");
const OtpDb = require("../../../model/user/otpSchema");

const { sendEnrollmentEmail, sendWhatsAppConfirmation } = require("../../utils/notificationService");
const { log } = require("console");

// exports.registerUser = async (req, res) => {
//   try {
//     const { name, email, phone, password } = req.body;

//     // Validate inputs
//     if (!name || !email || !phone || !password) {
//       return res.status(400).json({ message: "All fields are required." });
//     }

//     if (!/^\S+@\S+\.\S+$/.test(email)) {
//       return res.status(400).json({ message: "Invalid email format." });
//     }

//     if (!/^\d{10}$/.test(phone)) {
//       return res.status(400).json({ message: "Phone number must be 10 digits." });
//     }

//     // Check if user exists
//     const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
//     if (existingUser) {
//       return res.status(400).json({ message: "Email or phone already registered." });
//     }

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Create new user
//     const newUser = new User({
//       name,
//       email,
//       phone,
//       password: hashedPassword,
//     });

//     await newUser.save();

//     res.status(200).json({ message: "Registration successful." });

//   } catch (error) {
//     console.error("Registration error:", error);
//     res.status(500).json({ message: "Server error. Please try again later." });
//   }
// };

// controllers/userController.js

exports.registerUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Validation
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: "Phone number must be 10 digits." });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ message: "Email or phone already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP
    await OtpDb.create({ email, otp });

    // Setup Mailgen template
    const mailGenerator = new Mailgen({
      theme: "default",
      product: {
        name: "SkillUp Verification",
        link: "https://yourdomain.com/",
      },
    });

    const emailContent = {
      body: {
        name,
        intro: "Welcome to SkillUp! Please verify your email to complete registration.",
        table: {
          data: [
            {
              OTP: otp,
              Validity: "5 minutes",
            },
          ],
        },
        outro: "If you did not request this, please ignore this email.",
      },
    };

    const emailBody = mailGenerator.generate(emailContent);

    const mailOptions = {
      from: process.env.AUTH_EMAIL,
      to: email,
      subject: "Your SkillUp OTP Code",
      html: emailBody,
    };

    await transporter.sendMail(mailOptions);

    // Temporarily store user data in session (or frontend)
    req.session.tempUser = { name, email, phone, password: hashedPassword };

    res.status(200).json({ 
      message: "OTP sent to your email for verification.",
      redirect: "/otp-verify" 
    });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const { tempUser } = req.session;

    if (!tempUser) {
      return res.status(400).json({ message: "Session expired. Please register again." });
    }

    const otpRecord = await OtpDb.findOne({ email: tempUser.email, otp });
    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    // Save user permanently
    const user = new User(tempUser);
    await user.save();

    // Delete OTP record
    await OtpDb.deleteMany({ email: tempUser.email });

    // Clear session
    req.session.tempUser = null;

    res.status(200).json({ message: "OTP verified successfully. Registration completed!" });
  } catch (error) {
    console.error("OTP Verification Error:", error);
    res.status(500).json({ message: "Server error. Try again later." });
  }
};

exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.session.tempUser || {};

    if (!email) return res.status(400).json({ message: "Session expired." });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await OtpDb.create({ email, otp });

    // Send new OTP email
    const mailGenerator = new Mailgen({
      theme: "default",
      product: { name: "SkillUp Verification", link: "https://yourdomain.com/" },
    });

    const emailBody = mailGenerator.generate({
      body: {
        intro: "Your new OTP for SkillUp account verification:",
        table: { data: [{ OTP: otp, Validity: "5 minutes" }] },
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "New OTP Code",
      html: emailBody,
    });

    res.status(200).json({ message: "A new OTP has been sent to your email." });
  } catch (error) {
    console.error("Resend OTP Error:", error);
    res.status(500).json({ message: "Could not resend OTP." });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found. Please register first." });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Set session
    req.session.userId = user._id;
    req.session.user = {
      name: user.name,
      email: user.email,
      phone: user.phone
    };

    // Successful login
    res.status(200).json({
      message: "Login successful.",
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

exports.getCourses = async (req, res) => {
  try {
    const userId = req.session.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    // Fetch user's enrolled courses
    const enrolledCourses = await Enrollment.find({ user: userId }).populate("course");
    const enrolledCourseIds = enrolledCourses.map(e => e.course._id.toString());

    // Fetch non-enrolled courses for listing
    const courses = await Course.find({ _id: { $nin: enrolledCourseIds } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Course.countDocuments({ _id: { $nin: enrolledCourseIds } });
    const totalPages = Math.ceil(total / limit);

    res.json({
      enrolledCourses: enrolledCourses.map(e => e.course),
      courses,
      page,
      totalPages,
      total
    });

  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ message: "Server error" });
  }
  // try {
  //   // Get page and limit from query, default page=1, limit=6
  //   const page = parseInt(req.query.page) || 1;
  //   const limit = parseInt(req.query.limit) || 6;

  //   const skip = (page - 1) * limit;

  //   // Fetch courses
  //   const courses = await Course.find()
  //     .sort({ createdAt: -1 }) // newest first
  //     .skip(skip)
  //     .limit(limit);

  //   const total = await Course.countDocuments();
  //   const totalPages = Math.ceil(total / limit);

  //   res.json({
  //     courses,
  //     page,
  //     totalPages,
  //     total
  //   });

  // } catch (error) {
  //   console.error("Error fetching courses:", error);
  //   res.status(500).json({ message: "Server error" });
  // }
};

exports.getCourseDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Return JSON data only
    res.status(200).json({
      course: {
        id: course._id,
        title: course.title,
        description: course.description,
        instructor: course.instructor,
        level: course.level,
        language: course.language,
        price: course.price,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// exports.enrollCourse = async (req, res) => {
//   try {
//     const { courseId } = req.body;
//     const userId = req.session.userId; // updated to match your session setup

//     const course = await Course.findById(courseId);
//     if (!course) return res.status(404).json({ message: "Course not found" });

//     // Free course
//     if (course.type === "free") {
//       await Enrollment.create({ user: userId, course: courseId });
//       return res.json({ isFree: true, message: "Successfully enrolled in free course." });
//     }

//     // Paid course → create Razorpay order
//     const options = {
//       amount: course.price * 100, // paise
//       currency: "INR",
//       receipt: `receipt_${Date.now()}`,
//     };

//     const order = await razorpay.orders.create(options);

//     res.json({
//       isFree: false,
//       amount: order.amount,
//       orderId: order.id,
//       razorpayKey: process.env.RAZORPAY_KEY_ID,
//       courseTitle: course.title,
//       userName: req.session.user.name,
//       userEmail: req.session.user.email,
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error. Please try again later." });
//   }
// };

exports.enrollCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.session.userId;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // 🔹 Free course
    if (course.type === "free") {
      await Enrollment.create({
        user: userId,
        course: courseId,
        status: "enrolled",
        amountPaid: 0
      });

    // ✅ Send confirmation messages
    sendEnrollmentEmail(req.session.user.email, req.session.user.name, course.title);
    sendWhatsAppConfirmation(req.session.user.phone, req.session.user.name, course.title);

      return res.json({ isFree: true, message: "Successfully enrolled in free course." });
    }

    // 🔹 Paid course → create Razorpay order
    const options = {
      amount: course.price * 100, // paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    console.log(order);
    
    // Save pending enrollment before payment success
    await Enrollment.create({
      user: userId,
      course: courseId,
      status: "pending",
      amount: course.price,
      paymentId: null,
      orderId: order.id
    });

    res.json({
      isFree: false,
      amount: order.amount,
      orderId: order.id,
      razorpayKey: process.env.RAZORPAY_KEY_ID,
      courseTitle: course.title,
      userName: req.session.user.name,
      userEmail: req.session.user.email,
    });

  } catch (err) {
    console.error("Error in enrollCourse:", err);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

exports.paymentSuccess = async (req, res) => {
  try {
    const { courseId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;
    const userId = req.session.userId;
    console.log(courseId, razorpayPaymentId, razorpayOrderId, razorpaySignature, userId);
    
    // 🟡 Step 1: Verify session
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not logged in." });
    }

    // 🟢 Step 2: Verify Razorpay Signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpayOrderId + "|" + razorpayPaymentId)
      .digest("hex");

    if (generatedSignature !== razorpaySignature) {
      console.error("⚠️ Signature verification failed!");
      return res.status(400).json({ success: false, message: "Payment verification failed." });
    }

    // 🟢 Step 3: Find the pending enrollment
    const enrollment = await Enrollment.findOne({
      user: userId,
      course: courseId,
      orderId: razorpayOrderId,
      status: "pending",
    });

    if (!enrollment) {
      return res.status(404).json({ success: false, message: "Pending enrollment not found." });
    }

    // 🟢 Step 4: Fetch user and course details
    const [user, course] = await Promise.all([
      User.findById(userId),
      Course.findById(courseId),
    ]);

    if (!user || !course) {
      return res.status(404).json({ success: false, message: "User or course not found." });
    }

    // 🟢 Step 5: Update enrollment after successful payment
    enrollment.status = "enrolled";
    enrollment.paymentId = razorpayPaymentId;
    enrollment.enrolledAt = new Date();
    await enrollment.save();

    console.log(`✅ Enrollment updated for user: ${user.name}, course: ${course.title}`);

    // 🟢 Step 6: Send confirmation notifications (Email + WhatsApp)
    try {
      await sendEnrollmentEmail(user.email, user.name, course.title);
      await sendWhatsAppConfirmation(user.phone, user.name, course.title);
      console.log("✅ Notifications sent successfully!");
    } catch (notifyErr) {
      console.error("⚠️ Notification sending failed:", notifyErr.message);
    }

    // 🟢 Step 7: Send success response
    res.status(200).json({
      success: true,
      message: "Payment verified successfully. You are now enrolled in the course!",
    });

  } catch (err) {
    console.error("❌ Error in paymentSuccess:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};


// exports.paymentSuccess = async (req, res) => {
//   try {
//     const { courseId, razorpayPaymentId, razorpayOrderId } = req.body;
//     const userId = req.session.userId;

//     const enrollment = await Enrollment.findOne({
//       user: userId,
//       course: courseId,
//       orderId: razorpayOrderId,
//       status: "pending"
//     });

//     if (!enrollment) {
//       return res.status(404).json({ message: "Pending enrollment not found." });
//     }

//     // Update enrollment after payment success
//     enrollment.status = "enrolled";
//     enrollment.paymentId = razorpayPaymentId;
//     enrollment.enrolledAt = Date.now();
//     await enrollment.save();

//     // ✅ Send confirmation messages
//     sendEnrollmentEmail(req.session.user.email, req.session.user.name, enrollment.course.title);
//     sendWhatsAppConfirmation(req.session.user.phone, req.session.user.name, enrollment.course.title);

//     res.json({ message: "Payment successful and course enrolled!" });

//   } catch (err) {
//     console.error("Error in paymentSuccess:", err);
//     res.status(500).json({ message: "Server error. Please try again later." });
//   }
// };


// exports.paymentSuccess = async (req, res) => {
//   try {
//     const { courseId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;
//     const userId = req.session.user.id;

//     await Enrollment.create({
//       user: userId,
//       course: courseId,
//       paymentId: razorpayPaymentId,
//       orderId: razorpayOrderId,
//       status: "Paid",
//     });

//     res.json({ message: "Payment successful and course enrolled!" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error. Please try again later." });
//   }
// };

exports.logout = async (req, res) => {
  try {
    // Destroy the session
    req.session.destroy(err => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).send("Could not log out. Try again.");
      }
      // Clear cookie if using cookies for session
      res.clearCookie("connect.sid"); // default cookie name for express-session
      // Redirect to login page or homepage
      res.redirect("/login");
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Something went wrong.");
  }
}