const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const haversine = require("haversine-distance");
const rateLimit = require("express-rate-limit");
const passport = require("passport");
const session = require("express-session");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");

const app = express();

const authRoute = require("./routes/authRoute");
const riderRoute = require("./routes/riderRoute");
const driverRoute = require("./routes/driverRoute");
const directionsRoute = require("./routes/directionsRoute");
const rideHistoryRoute = require("./routes/rideHistoryRoute");
const contactRoute = require("./routes/contactRoute");
const reviewRoute = require("./routes/reviewRoute");

const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const rideHistory = require("./model/rideHistoryModel");
const Driver = require("./model/driverModel");
const Rider = require("./model/riderModel");
const corsOptions = {
  origin: ["http://localhost:5173", "https://rideonix.netlify.app"],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
};
const io = new Server(server, {
  cors: corsOptions,
});

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://rideonix-backend.onrender.com/auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      const userData = {
        username: profile.displayName,
        email: profile.emails[0].value,
        profilePicture: profile.photos[0].value,
      };
      return done(null, userData); // don't return whole profile
    }
  )
);

passport.serializeUser((user, done) => done(null, user)); // save the user in session
passport.deserializeUser((user, done) => done(null, user)); // retrive data when needed

app.use(express.json());

app.use(cors(corsOptions));

app.set("trust proxy", 1);

mongoose
  .connect(
    "mongodb+srv://affansayeed234:Kg7SXm4OvuvKZETa@cluster0.rfaqlhz.mongodb.net/Uber",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log(`Error connecting to MongoDB: ${err}`));

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
});

app.use("/api", limiter);

app.use((req, res, next) => {
  if (req.query && typeof req.query === "object") {
    req.query = { ...req.query }; // now it's mutable again
  }
  next();
});

app.get("/", (req, res) => {
  res.send({ message: "Welcome to the Uber Clone" });
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "https://rideonix.netlify.app",
  }),
  (req, res) => {
    const user = req.user;

    // optional: generate a short-lived temp token
    const tempToken = jwt.sign(user, process.env.JWT_SECRET_KEY, {
      expiresIn: "10m",
    });

    // Redirect with token (or use session cookie)
    res.redirect(
      `https://rideonix.netlify.app/registerPhoneNumber?token=${tempToken}`
    );
  }
);

app.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
});

app.get("/get-city", async (req, res) => {
  try {
    const { lat, lon } = req.query;

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      {
        headers: {
          "User-Agent": "rideonix-resume-project (contact@rideonix.com)",
        },
      }
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.json(error);
  }
});

app.use("/api/auth", authRoute);
app.use("/api/rider", riderRoute);
app.use("/api/driver", driverRoute);
app.use("/api", directionsRoute);
app.use("/api/rideHistory", rideHistoryRoute);
app.use("/api/contact", contactRoute);
app.use("/api/review", reviewRoute);

const driverList = new Map(); // change to map from array
const nearestDriverList = new Map();
const rideLocks = new Map(); // 🔐 This goes outside the socket.on()
const riderSocketMap = new Map();
const driverSocketMap = new Map();

io.on("connection", (socket) => {
  console.log("🧩 New socket connected:", socket.id);

  socket.on("register_rider", (data) => {
    riderSocketMap.set(data.riderId, socket.id);
  });

  socket.on("register_driver", (data) => {
    driverSocketMap.set(data.driverId, socket.id);
  });

  socket.on("driverOnline", (data) => {
    const { driverInfo, location } = data;

    if (!driverInfo || !driverInfo.driverId) {
      console.warn("❌ Invalid driver data received:", data);
      return;
    }
    const alreadyExists = Array.from(driverList.values()).some(
      (entry) => entry.driverInfo.driverId === data.driverInfo.driverId
    );

    if (!alreadyExists) {
      driverList.set(socket.id, {
        driverInfo: driverInfo,
        location: location,
      });
      console.log("✅ Driver added:", data.driverInfo.username);
    } else {
      console.log("⚠️ Driver already exists:", data.driverInfo.username);
    }
  });

  socket.on("driverOffline", (data) => {
    for (const [socketId, driver] of driverList.entries()) {
      if (driver.driverInfo.driverId === data.driverInfo.driverId) {
        driverList.delete(socketId);
        console.log("✅ Driver removed:", driver.driverInfo.username);
        break;
      }
    }
  });

  socket.on("driverLocationUpdate", (data) => {
    const { driverId, location } = data;

    if (!driverId || !location) {
      console.warn("❌ Invalid driver data received");
      return;
    }

    for (const [socketId, driver] of driverList.entries()) {
      if (driverId === driver.driverInfo.driverId) {
        driverList.set(socketId, {
          ...driver,
          location: location,
        });

        const riderSocket =
          rideLocks.size > 0 && rideLocks.get(driverId)?.riderSocket;
        if (riderSocket) {
          io.to(riderSocket).emit("driver_location_update", {
            driverId,
            location,
          });
        }
        break;
      }
    }
  });

  socket.on("ride_request", (data) => {
    const nearbyKm = Number(process.env.MAX_NEARBY_KM) || 8;
    const maxDistance = nearbyKm * 1000;
    const pickUpLocation = data.pickUpLocation;
    const vehicleType = data.vehicleType;

    for (const [socketId, driver] of driverList.entries()) {
      const rawVehicle = driver.driverInfo.selectedVehicle; // "🚘 RideonixGo"

      const cleanedVehicle = rawVehicle
        .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "")
        .trim();

      const locationDiffrence = haversine(pickUpLocation, driver.location);
      if (cleanedVehicle === vehicleType && locationDiffrence <= maxDistance) {
        nearestDriverList.set(socketId, driver);
      }
    }

    console.log("🚖 Nearest drivers found:", nearestDriverList.size);

    for (const [socketId, driver] of nearestDriverList.entries()) {
      io.to(socketId).emit("ride_request_to_driver", {
        ...data,
        requestedAt: new Date().toISOString(),
      });
    }
  });

  socket.on("ride_accepted", (data) => {
    console.log("<---------------From Accept Ride--------------->");
    const riderId = data.rideData.riderId;
    const driverId = data.driverData.driverId;

    if (rideLocks.has(data.rideData.riderId)) {
      socket.emit("ride_already_taken");
      return;
    }

    const riderSocket = riderSocketMap.get(riderId);
    const driverSocket = driverSocketMap.get(driverId);
    const otp = Math.floor(Math.random() * 9000 + 1000);

    rideLocks.set(data.rideData.riderId, {
      driverData: data.driverData,
      riderSocket: riderSocket,
      OTP: otp,
    });

    let driverLocation = null;

    for (const [socketId, driver] of driverList.entries()) {
      if (driver.driverId === driverId) {
        driverLocation = driver.location || { lat: 0, lon: 0 };
      }
    }

    io.to(riderSocket).emit("ride_confirmed", {
      driverData: data.driverData,
      location: driverLocation,
      otp: rideLocks.get(data.rideData.riderId).OTP,
    });

    io.to(driverSocket).emit("ride_assigned", {
      rideData: data.rideData,
    });

    nearestDriverList.clear();
  });

  socket.on("ride_rejected", (data) => {
    const driverSocket = driverSocketMap.get(data.driverId);
    nearestDriverList.delete(driverSocket);

    console.log("🚖Current Nearest drivers found:", nearestDriverList.size);
    if (nearestDriverList.size === 0) {
      const riderSocket = riderSocketMap.get(data.riderId);
      io.to(riderSocket).emit("no_driver_found");
    }
  });

  socket.on("ride_canceled_by_rider", (data) => {
    console.log(
      "<-------------------FROM RIDE CANCEL BY RIDER--------------------->"
    );
    const driverSocket = driverSocketMap.get(data.driverId);

    rideLocks.delete(data.riderId);
    nearestDriverList.delete(data.rideId);

    if (!driverSocket) {
      console.warn("Driver socket not found. Driver might be offline.");
      return;
    }

    io.to(driverSocket).emit("ride_cancel_to_driver", {
      reason: data.reason || "Rider canceled the ride",
      cancelTime: data.timestamp || Date.now(),
      currentTime: Date.now(),
    });
  });

  socket.on("ride_canceled_by_driver", (data) => {
    console.log(
      "<-------------------FROM RIDE CANCEL BY DRIVER--------------------->"
    );
    const riderSocket = riderSocketMap.get(data.riderId);

    rideLocks.delete(data.riderId);
    nearestDriverList.delete(data.rideId);

    if (!riderSocket) {
      console.warn("Rider socket not found. Rider might be offline.");
      return;
    }

    io.to(riderSocket).emit("ride_cancel_to_rider", {
      reason: data.reason || "Driver canceled the ride",
      cancelTime: data.timestamp || Date.now(),
      currentTime: Date.now(),
    });
  });

  socket.on("ride_started_by_driver", (data) => {
    console.log(
      "<--------------------FROM RIDE START BY DRIVER--------------------->"
    );

    const riderId = data.riderId;

    const OTP = rideLocks.get(riderId).OTP;
    const otp = Number(data.otp);

    const driverSocket = driverSocketMap.get(data.driverId);
    const riderSocket = riderSocketMap.get(riderId);

    if (!driverSocket || !riderSocket) {
      console.log("Driver or rider socket not found");
      return;
    }

    if (OTP !== otp) {
      console.log("OTP is incorrect");
      io.to(driverSocket).emit("otp_incorrect");
      return;
    }

    console.log("OTP matched ✅ Ride starting...");
    io.to(riderSocket).emit("ride_start");
  });

  socket.on("ride_finished", async (data) => {
    try {
      const driverData = await Driver.findById(data.driverId);
      const newHistory = await rideHistory.create({
        driver: {
          driverId: driverData._id,
          driverName: driverData.username,
          profilePicture: driverData.profilePicture,
          vehicleType: driverData.selectedVehicle,
          cityName: driverData.cityName,
        },
        rider: {
          riderId: data.riderId,
          riderName: data.riderName,
          pickUpLocationName: data.pickUpLocationName,
          dropLocationName: data.dropLocationName,
        },
        price: data.price,
      });

      const riderSocket = riderSocketMap.get(data.riderId);
      rideLocks.delete(data.riderId);
      nearestDriverList.clear();
      io.to(riderSocket).emit("ride_finished_on_rider", {
        rideId: newHistory._id,
      });
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("payment_done", (data) => {
    const riderId = data.riderId;
    const riderSocket = riderSocketMap.get(riderId);

    io.to(riderSocket).emit("payment_success");
  });

  socket.on("disconnect", () => {
    console.log(`${socket.id} disconnected`);
    driverList.delete(socket.id);
    console.log("Disconnected driver list:", driverList);
  });
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});
