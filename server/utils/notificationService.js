// utils/notificationService.js
const nodemailer = require("nodemailer");
const Mailgen = require("mailgen");
const twilio = require("twilio");

// 🔹 Twilio setup for WhatsApp
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// 🔹 Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASS,
  },
});

// 🔹 Mailgen configuration
const mailGenerator = new Mailgen({
  theme: "default",
  product: {
    name: "SkillUp Academy",
    link: "https://yourwebsite.com/",
  },
});

// =============================
// SEND EMAIL CONFIRMATION
// =============================
exports.sendEnrollmentEmail = async (email, userName, courseTitle) => {
  try {
    const emailContent = {
      body: {
        name: userName,
        intro: `Congratulations! You’ve successfully enrolled in the course **${courseTitle}**.`,
        action: {
          instructions: "You can start your learning journey by visiting Our Website:",
          button: {
            color: "#22BC66",
            text: "Go to Website",
            link: "https://skillup-ca86.onrender.com",
          },
        },
        outro: "Thank you for choosing SkillUp Academy. Keep learning and growing!",
      },
    };

    const emailBody = mailGenerator.generate(emailContent);
    const message = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Enrollment Confirmed - ${courseTitle}`,
      html: emailBody,
    };

    await transporter.sendMail(message);
    console.log(`✅ Enrollment email sent to ${email}`);
  } catch (error) {
    console.error("❌ Error sending enrollment email:", error);
  }
};

// =============================
// SEND WHATSAPP CONFIRMATION
// =============================
exports.sendWhatsAppConfirmation = async (phone, userName, courseTitle) => {
  try {
    await twilioClient.messages.create({
      from: "whatsapp:+14155238886", // Twilio Sandbox number
      to: `whatsapp:+91${phone}`,   // User's number (India example)
      body: `Hi ${userName}! 🎉 You’ve successfully enrolled in "${courseTitle}". Start learning at https://skillup-ca86.onrender.com.`,
    });

    console.log(`✅ WhatsApp message sent to +91${phone}`);
  } catch (error) {
    console.error("❌ Error sending WhatsApp message:", error);
  }
};
