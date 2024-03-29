const { Router } = require("express");
const router = Router();
const userMiddleware = require("../middleware/user");
const { User, Course } = require("../db");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

// User Routes
router.post("/signup", async (req, res) => {
  // Implement user signup logic
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(404)
      .send({ messgae: "username and password both required" });
  }

  try {
    const existingUser = await User.findOne({
      username: username,
    });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exist" });
    }

    const newUser = await User.create({
      username,
      password,
    });

    res.status(200).send({ message: "User created successfully" });
  } catch (error) {
    res.status(501).send({
      message: "Some error occured while creating user, try again",
    });
  }
});

router.post("/signin", async (req, res) => {
  // Implement admin signup logic
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(404)
      .send({ messgae: "username and password both required" });
  }

  try {
    const user = await User.findOne({ username: username, password: password });

    if (!user) {
      return res
        .status(404)
        .send({ message: "User not fount with given credentials" });
    }

    const token = await jwt.sign(
      { username: username, password: password },
      "secret123"
    );

    if (token) {
      res.status(200).json({ message: "Logged in successfully", token: token });
    }
  } catch (error) {
    return res.status(500).send({ message: "Some error occured, try again" });
  }
});

router.get("/courses", userMiddleware, async (req, res) => {
  // Implement listing all courses
  try {
    const courses = await Course.find({});

    res.send({
      message: "Courses fetched successfully",
      numberOfCourses: courses.length,
      courses: courses,
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

router.post("/courses/:courseId", userMiddleware, async (req, res) => {
  // Implement course purchase logic
  const { courseId } = req.params;
  if (!courseId) {
    res.status(404).send({ message: "CourseId required" });
  }

  try {
    const purchasedCourse = await Course.findById(courseId);

    if (!purchasedCourse) {
      return res
        .status(404)
        .send({ message: "Course not found with given courseId" });
    }

    await User.updateOne(
      {
        username: req.userDetails.username,
        purchasedCourses: { $ne: courseId },
      },
      {
        $push: {
          purchasedCourses: courseId,
        },
      }
    );

    res.status(200).send({ message: "Course purchased successfully" });
  } catch (error) {
    res.status(404).send({ message: error.message });
  }
});

router.get("/purchasedCourses", userMiddleware, async (req, res) => {
  // Implement fetching purchased courses logic
  try {
    const user = await User.findOne({ username: req.userDetails.username });

    // const courses = await user.purchasedCourses.forEach(async (c) => {
    //   const abc = await Course.findById(c);
    //   return abc;
    // });

    const courses = await Course.find({
      _id: {
        $in: user.purchasedCourses,
      },
    });

    res.status(200).json({
      message: "Courses fetched successfully",
      courses: courses,
    });
  } catch (error) {
    res.status(500).send({ message: "Some error occured, try again" });
  }
});

module.exports = router;
