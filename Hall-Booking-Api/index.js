const express = require("express");
const bodyparser = require("body-parser");
const app = express();
app.use(bodyparser.json());

const rooms = [];
const bookings = [];
const customersWithBookedData = [];
app.post("/rooms", (req, res) => {
  const { roomName, seats, pricePerHour, amenities } = req.body;

  const roomId = rooms.length + 1;
  const room = { roomId, roomName, seats, pricePerHour, amenities };
  rooms.push(room);

  res.json({ message: "Room created successfully", room });
});

app.post("/bookings", (req, res) => {
  const { roomId, customerName, startTime, endTime, date } = req.body;

  // Function to check room availability
  function isRoomAvailable(roomId, date, startTime, endTime) {
    for (const bookingId in bookings) {
      const booking = bookings[bookingId];
      if (booking.roomId === roomId && booking.date === date) {
        if (startTime < booking.endTime && endTime > booking.startTime) {
          return false;
        }
      }
    }
    return true;
  }

  if (!isRoomAvailable(roomId, date, startTime, endTime)) {
    return res.status(400).json({ error: "Room already booked at that time" });
  }

  const bookingId = bookings.length + 1;
  const bookingDate = new Date().toISOString();
  const bookingStatus = "Booked";

  const booking = {
    bookingId,
    roomId,
    customerName,
    startTime,
    endTime,
    date,
    bookingDate,
    bookingStatus,
  };
  bookings.push(booking);

  res.json({ message: "Room booked successfully", booking });
});

//LIST of ROOMS with BOOKED DATA

app.get("/bookings/rooms", (req, res) => {
  const roomsWithBookedData = rooms.map((room) => {
    const bookedData = bookings.filter(
      (booking) => booking.roomId === room.roomId
    );

    return {
      roomName: room.roomName,
      bookedData: bookedData.map((booking) => {
        return {
          customerName: booking.customerName,
          bookingStatus: booking.bookingStatus,
          startTime: booking.startTime,
          endTime: booking.endTime,
          date: booking.date,
        };
      }),
    };
  });

  res.json(roomsWithBookedData);
});

//LIST of All customers with booked data

app.get("/bookings/customers", (req, res) => {
  bookings.forEach((booking) => {
    const customerIndex = customersWithBookedData.findIndex(
      (cust) => cust.customerName === booking.customerName
    );
    if (customerIndex === -1) {
      customersWithBookedData.push({
        customerName: booking.customerName,
        bookedData: [
          {
            roomName: rooms.find((room) => room.roomId === booking.roomId)
              .roomName,
            bookingStatus: booking.bookingStatus,
            startTime: booking.startTime,
            endTime: booking.endTime,
            date: booking.date,
          },
        ],
      });
    } else {
      customersWithBookedData[customerIndex].bookedData.push({
        roomName: rooms.find((room) => room.roomId === booking.roomId).roomName,
        bookingStatus: booking.bookingStatus,
        startTime: booking.startTime,
        endTime: booking.endTime,
        date: booking.date,
      });
    }
  });

  res.json(customersWithBookedData);
});

//how many times a customer booked the room

app.get("/bookings/customers/:customerName", (req, res) => {
  const customerName = req.params.customerName;
  const customerBookings = bookings.filter(
    (booking) => booking.customerName === customerName
  );

  if (customerBookings.length === 0) {
    return res
      .status(404)
      .json({ error: "Customer not found or has no bookings" });
  }

  const response = customerBookings.map((booking) => {
    const room = rooms.find((room) => room.roomId === booking.roomId);
    return {
      roomName: room.roomName,
      startTime: booking.startTime,
      endTime: booking.endTime,
      date: booking.date,
      bookingId: booking.bookingId,
      bookingDate: booking.bookingDate,
      bookingStatus: booking.bookingStatus,
    };
  });

  res.json(response);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
