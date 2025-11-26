const nodemailer = require("nodemailer");

// Gmail SMTP (Best for Render)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.MAIL_USER,   // Gmail
    pass: process.env.MAIL_PASS,   // Gmail App Password
  },
});

// Safe check for empty values
const safe = (v) => (v ? v : "N/A");

async function sendOrderEmail(order) {
  // Debug to check render env vars
  console.log("MAIL_USER:", process.env.MAIL_USER);
  console.log("MAIL_PASS exists:", !!process.env.MAIL_PASS);

  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.log("❌ MAIL_USER or MAIL_PASS missing on Render");
    return;
  }

  // Order items table
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

  // HTML template
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f7f7f7;">
      <div style="max-width: 600px; margin: auto; background: #fff; padding: 25px; border-radius: 10px;">
        
        <h2 style="text-align:center;">🛒 New Order Received</h2>
        <hr />

        <h3>📌 Customer Details</h3>
        <table style="width:100%;">
          <tr><td><b>Name:</b></td><td>${safe(order.customer.fullName)}</td></tr>
          <tr><td><b>Mobile:</b></td><td>${safe(order.customer.mobile)}</td></tr>
          <tr><td><b>Email:</b></td><td>${safe(order.customer.email)}</td></tr>
          <tr><td><b>City:</b></td><td>${safe(order.customer.city)}</td></tr>
          <tr><td><b>Pincode:</b></td><td>${safe(order.customer.pincode)}</td></tr>
          <tr><td><b>Address:</b></td><td>${safe(order.customer.address)}</td></tr>
        </table>

        <h3 style="margin-top:20px;">🧾 Order Items</h3>
        <table style="width:100%; border-collapse: collapse;">
          <thead>
            <tr style="background:#eaeaea;">
              <th style="padding:8px; border:1px solid #ddd;">Product</th>
              <th style="padding:8px; border:1px solid #ddd;">Qty</th>
              <th style="padding:8px; border:1px solid #ddd;">Price</th>
              <th style="padding:8px; border:1px solid #ddd;">Total</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>

        <h2 style="text-align:right; margin-top:20px;">
          💰 Total: <span style="color:#007bff;">₹${order.totalPrice}</span>
        </h2>

        <p style="color:#555; margin-top:20px;">
          <b>Order ID:</b> ${order._id}<br />
          <b>Date:</b> ${new Date(order.createdAt).toLocaleString()}
        </p>

      </div>
    </div>
  `;

  const mailOptions = {
    from: process.env.MAIL_USER,
    to: process.env.MAIL_USER,   // send to your own email
    subject: `🛒 New Order (#${order._id})`,
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
