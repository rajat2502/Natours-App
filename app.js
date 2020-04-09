const fs = require("fs");
const express = require("express");

const app = express();

app.use(express.json()); // middleware to add request data to the body

// app.get("/", (req, res) => {
//   res
//     .status(200)
//     .json({ message: "Hello from the server side", app: "Natours" });
// });

// app.post("/", (req, res) => {
//   res.send("You can post to this endpoint...");
// });

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
);

// get tours
app.get("/api/v1/tours", (req, res) => {
  res.status(200).json({
    status: "success",
    results: tours.length,
    data: {
      tours
    }
  });
});

// get tour by id
app.get("/api/v1/tours/:id", (req, res) => {
  // console.log(req.params);
  const id = parseInt(req.params.id);
  const tour = tours.find(elm => elm.id === id);

  if (!tour) {
    return res.status(404).json({
      status: "fail",
      message: "ID not found"
    });
  }
  res.status(200).json({
    status: "success",
    data: {
      tour
    }
  });
});

// create a new tour
app.post("/api/v1/tours", (req, res) => {
  const newId = tours[tours.length - 1].id + 1;
  const newTour = Object.assign({ id: newId }, req.body);
  tours.push(newTour);
  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    err => {
      res.status(201).json({
        status: "success",
        data: {
          tour: newTour
        }
      });
    }
  );
});

// update a tour
app.patch("/api/v1/tours/:id", (req, res) => {
  const id = parseInt(req.params.id);
  console.log(req.body, id);
  if (id > tours.length) {
    return res.status(404).json({
      status: "fail",
      message: "ID not found!"
    });
  }
  res.status(200).json({
    status: "success",
    data: {
      tour: "<Updated Tour"
    }
  });
});

// delete a tour
app.delete("/api/v1/tours/:id", (req, res) => {
  const id = parseInt(req.params.id);

  if (id > tours.length) {
    return res.status(404).json({
      status: "fail",
      message: "ID not found!"
    });
  }
  res.status(204).json({
    status: "success",
    data: null
  });
});

const port = 3000;
app.listen(port, "127.0.0.1", () => {
  console.log(`App running on port ${port}...`);
});
