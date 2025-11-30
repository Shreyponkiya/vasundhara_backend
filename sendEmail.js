const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", 
  auth: {
    user: process.env.MAIL_USER, 
    pass: process.env.MAIL_PASS, 
  },
});

const safe = (v) => (v ? v : "N/A");

async function sendOrderEmail(order) {
  try {
    if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
      console.log("❌ MAIL_USER or MAIL_PASS missing in env!");
      return;
    }

    console.log("📨 Preparing email to send...");

    const itemsHtml = order.items
      .map((item) => {
        const qty = item.quantity || 0;
        const price = item.price || 0;

        return `
          <tr>
            <td style="padding:8px;border:1px solid #ddd;">${safe(item.productName)}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:center;">${qty}</td>
            <td style="padding:8px;border:1px solid #ddd;">₹${price}</td>
            <td style="padding:8px;border:1px solid #ddd;">₹${qty * price}</td>
          </tr>
        `;
      })
      .join("");

    const htmlBody = `
      <div style="font-family:Arial;padding:20px;background:#f7f7f7">
        <div style="max-width:600px;margin:auto;background:#fff;padding:25px;border-radius:10px;">
          
          <h2 style="text-align:center;">🛒 New Order Received</h2>
          <hr />

          <h3>Customer Details</h3>
          <p><b>Name:</b> ${safe(order.customer.fullName)}</p>
          <p><b>Mobile:</b> ${safe(order.customer.mobile)}</p>
          <p><b>Email:</b> ${safe(order.customer.email)}</p>
          <p><b>Address:</b> ${safe(order.customer.address)}</p>

          <h3 style="margin-top:20px;">Order Items</h3>
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:#eaeaea">
                <th style="padding:8px;border:1px solid #ddd;">Product</th>
                <th style="padding:8px;border:1px solid #ddd;">Qty</th>
                <th style="padding:8px;border:1px solid #ddd;">Price</th>
                <th style="padding:8px;border:1px solid #ddd;">Total</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>

          <h2 style="text-align:right;margin-top:20px;">Total: ₹${order.totalPrice}</h2>

          <p><b>Order ID:</b> ${order._id}</p>
          <p><b>Date:</b> ${new Date(order.createdAt).toLocaleString()}</p>

        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.MAIL_USER,
      to: process.env.MAIL_USER, // Your own email
      subject: `New Order Received (#${order._id})`,
      html: htmlBody,
    };

    await transporter.sendMail(mailOptions);

    console.log("✔ Email sent successfully!");

  } catch (err) {
    console.error("❌ Email error:", err.message);
  }
}

module.exports = sendOrderEmail;
