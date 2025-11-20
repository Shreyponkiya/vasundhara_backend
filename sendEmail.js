// utils/sendEmail.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

async function sendOrderEmail(order) {  

  // Generate items table
  const itemsHtml = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${item.productName}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${item.quantity}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">₹${item.price}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">₹${item.quantity * item.price}</td>
        </tr>
      `
    )
    .join("");

  const mailOptions = {
    from: process.env.MAIL_USER,
    to: process.env.MAIL_USER, // admin email
    subject: `🛒 New Order Received (#${order._id})`,
    html: `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f4f4f4;">
      <div style="max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 10px;">
        
        <h2 style="text-align: center; color: #333;">🛒 New Order Received</h2>

        <p style="font-size: 16px; color: #555;">
          A new order has been placed. Below are the details:
        </p>

        <h3 style="margin-top: 20px;">📌 Customer Details</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr><td><b>Name:</b></td><td>${order.customer.fullName}</td></tr>
          <tr><td><b>Mobile:</b></td><td>${order.customer.mobile}</td></tr>
          <tr><td><b>Email:</b></td><td>${order.customer.email}</td></tr>
          <tr><td><b>Pincode:</b></td><td>${order.customer.pincode}</td></tr>
          <tr><td><b>City:</b></td><td>${order.customer.city}</td></tr>
          <tr><td><b>Address:</b></td><td>${order.customer.address}</td></tr>
        </table>

        <h3 style="margin-top: 20px;">🧾 Order Items</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background: #eee;">
              <th style="padding: 8px; border: 1px solid #ddd;">Product</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Qty</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Price</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <h3 style="margin-top: 20px; text-align: right;">
          💰 Order Total: <span style="color: #007bff;">₹${order.totalPrice}</span>
        </h3>

        <p style="margin-top: 20px; font-size: 14px; color: #555;">
          <b>Order ID:</b> ${order._id}<br>
          <b>Date:</b> ${new Date(order.createdAt).toLocaleString()}
        </p>

      </div>
    </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Order email sent successfully");
  } catch (err) {
    console.log("Error sending email:", err.message);
  }
}

module.exports = sendOrderEmail;
