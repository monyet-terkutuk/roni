const mongoose = require("mongoose");
const dns = require("dns");

try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (e) {
  console.log("Could not set custom DNS servers:", e.message);
}

const connectDatabase = () => {
  mongoose
    .connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log(`MongoDB connected with server: ${mongoose.connection.host}`);
    })
    .catch((error) => {
      console.error("MongoDB connection error:", error.message);
    });
};

module.exports = connectDatabase;
