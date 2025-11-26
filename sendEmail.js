const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,  // Must be APP PASSWORD in live
  }
});

// Utility to avoid undefined errors
const safe = (v) => (v ? v : "N/A");

async function sendOrderEmail(order) {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.log("❌ MAIL_USER or MAIL_PASS missing");
    return;
  }

  // Generate items HTML
  const itemsHtml = order.items
    .map((item) => {
      const qty = item.quantity || item.quantityOrdered || 0;
      const price = item.price || item.productValue || 0;

      return `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${safe(item.productName)}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align:center;">${qty}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">₹${price}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">₹${qty * price}</td>
        </tr>
      `;
    })
    .join("");

  // Main HTML template
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f2f2f7;">
      <div style="max-width: 600px; margin: auto; background: white; padding: 25px; border-radius: 10px;">

        <h2 style="text-align: center; color: #333;">🛒 New Order Received</h2>
        <hr style="margin: 20px 0;">

        <h3 style="margin-bottom: 6px;">📌 Customer Details</h3>
        <table style="width: 100%; margin-bottom: 20px;">
          <tr><td style="padding: 4px 0;"><b>Name:</b></td><td>${safe(order.customer.fullName)}</td></tr>
          <tr><td style="padding: 4px 0;"><b>Mobile:</b></td><td>${safe(order.customer.mobile)}</td></tr>
          <tr><td style="padding: 4px 0;"><b>Email:</b></td><td>${safe(order.customer.email)}</td></tr>
          <tr><td style="padding: 4px 0;"><b>City:</b></td><td>${safe(order.customer.city)}</td></tr>
          <tr><td style="padding: 4px 0;"><b>Pincode:</b></td><td>${safe(order.customer.pincode)}</td></tr>
          <tr><td style="padding: 4px 0;"><b>Address:</b></td><td>${safe(order.customer.address)}</td></tr>
        </table>

        <h3 style="margin-bottom: 6px;">🧾 Order Items</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f1f1f1;">
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

        <h2 style="text-align: right; margin-top: 20px;">
          💰 Total: <span style="color: #007bff;">₹${order.totalPrice}</span>
        </h2>

        <p style="margin-top: 20px; color: #555;">
          <b>Order ID:</b> ${order._id}<br>
          <b>Date:</b> ${new Date(order.createdAt).toLocaleString()}
        </p>

      </div>
    </div>
  `;

  const mailOptions = {
    from: process.env.MAIL_USER,
    to: process.env.MAIL_USER,
    subject: `🛒 New Order Received (#${order._id})`,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✔ Email sent successfully");
  } catch (err) {
    console.log("❌ Email sending failed:", err.message);
  }
}

module.exports = sendOrderEmail;
