const express = require("express");
const { v4: uuid } = require("uuid");
const logger = require("./logger");
const { bookmarks } = require("./store");

const bookmarksRouter = express.Router();
const bodyParser = express.json();

bookmarksRouter
  .route("/bookmarks")
  .get((req, res) => {
    res.json(bookmarks);
  })
  .post(bodyParser, (req, res) => {
    const { title, url, rating, description } = req.body;

    if (!title) {
      logger.error(`title is required`);
      return res.status(400).send("Invalid data");
    }
    if (!url) {
      logger.error(`title is required`);
      return res.status(400).send("Invalid data");
    }
    if (!rating) {
      logger.error(`title is required`);
      return res.status(400).send("Invalid data");
    }
    if (!description) {
      logger.error(`title is required`);
      return res.status(400).send("Invalid data");
    }

    const id = uuid();

    const bookmark = {
      id,
      title,
      url,
      rating,
      description,
    };

    bookmarks.push(bookmark);
    logger.info(`Bookmark with id ${id} created`);
    res
      .status(201)
      .location(`http://localhost:8000/bookmarks/${id}`)
      .json({ id });
  });

bookmarksRouter.route("/bookmarks/:id").get((req, res) => {
  const { id } = req.params;
  const bookmark = bookmarks.find((book) => book.id == id);

  if (!bookmark) {
    logger.error(`Bookmark with id ${id} not found.`);
    return res.status(404).send("Bookmark Not Found");
  }

  res.json(bookmark);
});

module.exports = bookmarksRouter;
