const express = require("express");
const { v4: uuid } = require("uuid");
const logger = require("./logger");
const { bookmarks } = require("./store");
const BookmarksService = require("./bookmarks-service");

const bookmarksRouter = express.Router();
const bodyParser = express.json();

bookmarksRouter
  .route("/bookmarks")
  .get((req, res) => {
    const knexInstance = req.app.get("db");
    BookmarksService.getAllBookmarks(knexInstance).then((bookmarks) => {
      res.json(bookmarks);
    });
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

bookmarksRouter
  .route("/bookmarks/:id")
  .get((req, res) => {
    const { id } = req.params;
    const bookmark = bookmarks.find((book) => book.id == id);

    if (!bookmark) {
      logger.error(`Bookmark with id ${id} not found.`);
      return res.status(404).send("Bookmark Not Found");
    }

    res.json(bookmark);
  })
  .delete((req, res) => {
    const { id } = req.params;

    const bookmarkIndex = bookmarks.findIndex((book) => book.id == id);

    if (bookmarkIndex === -1) {
      logger.error(`Bookmark with id ${id} not found.`);
      return res.status(404).send("Not Found");
    }

    bookmarks.splice(bookmarkIndex, 1);

    logger.info(`Bookmark with id ${id} deleted.`);
    res.status(204).end();
  });

module.exports = bookmarksRouter;
