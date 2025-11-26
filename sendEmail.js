const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS, // MUST BE APP PASSWORD IN LIVE
  }
});

// MAIN email function
async function sendOrderEmail(order) {

  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.log("❌ Email error: MAIL_USER or MAIL_PASS missing");
    return;
  }

  // fallback for undefined fields
  const safe = (v) => (v ? v : "N/A");

  const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${safe(item.productName)}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${safe(item.quantity || item.quantityOrdered)}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">₹${safe(item.price || item.productValue)}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">₹${(item.quantity || item.quantityOrdered) * (item.price || item.productValue)}</td>
      </tr>
  `).join("");

  const mailOptions = {
    from: process.env.MAIL_USER,
    to: process.env.MAIL_USER,
    subject: `🛒 New Order Received (#${order._id})`,
    html: `
      <div style="font-family: Arial; padding:20px; background:#f8f8f8;">
        <div style="max-width:600px; margin:auto; background:white; padding:20px; border-radius:10px;">
          
          <h2 style="text-align:center;">🛒 New Order Received</h2>

          <h3>Customer Details</h3>
          <p><b>Name:</b> ${safe(order.customer.fullName)}</p>
          <p><b>Mobile:</b> ${safe(order.customer.mobile)}</p>
          <p><b>Email:</b> ${safe(order.customer.email)}</p>
          <p><b>Address:</b> ${safe(order.customer.address)}, ${safe(order.customer.city)} - ${safe(order.customer.pincode)}</p>

          <h3>Order Items</h3>
          <table style="width:100%; border-collapse:collapse;">
            <thead>
              <tr style="background:#eee;">
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <h2 style="text-align:right;">
            Total: <span style="color:#007bff;">₹${order.totalPrice}</span>
          </h2>

          <p><b>Order Date:</b> ${new Date(order.createdAt).toLocaleString()}</p>

        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✔ Email sent successfully");
  } catch (err) {
    console.log("❌ Email sending failed:", err.message);
  }
}

module.exports = sendOrderEmail;
