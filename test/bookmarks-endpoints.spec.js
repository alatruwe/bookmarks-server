const { expect } = require("chai");
const knex = require("knex");
const supertest = require("supertest");
const app = require("../src/app");
const { makeBookmarksArray } = require("./bookmarks.fixtures");

describe("Bookmarks Endpoints", function () {
  let db;

  // connect to database
  before("make knex instance", () => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DB_URL,
    });
    // tests skip server.js so we need the instance here
    app.set("db", db);
  });

  // disconnect to database
  after("disconnect from db", () => db.destroy());

  // clean the data
  before("clean the table", () => db("bookmarks").truncate());

  // remove ant table data so that each test has a clean start
  afterEach("cleanup", () => db("bookmarks").truncate());

  before("clean the table", () => db("bookmarks").truncate());

  afterEach("cleanup", () => db("bookmarks").truncate());

  describe(`GET /api/bookmarks`, () => {
    //test when database is empty
    context(`Given no bookmarks`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app).get("/api/bookmarks").expect(200, []);
      });
    });

    context("Given there are bookmarks in the database", () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach("insert bookmarks", () => {
        return db.into("bookmarks").insert(testBookmarks);
      });

      it("responds with 200 and all of the articles", () => {
        return supertest(app).get("/api/bookmarks").expect(200, testBookmarks);
      });
    });
  });

  describe(`GET /api/bookmarks/:bookmark_id`, () => {
    context(`Given no bookmarks`, () => {
      it(`responds with 404`, () => {
        const bookmarkId = 123456;
        return supertest(app)
          .get(`/api/bookmarks/${bookmarkId}`)
          .expect(404, { error: { message: `Bookmark doesn't exist` } });
      });
    });

    context("Given there are bookmarks in the database", () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach("insert bookmarks", () => {
        return db.into("bookmarks").insert(testBookmarks);
      });

      it("responds with 200 and the specified bookmark", () => {
        const bookmarkId = 2;
        const expectedBookmark = testBookmarks[bookmarkId - 1];
        return supertest(app)
          .get(`/api/bookmarks/${bookmarkId}`)
          .expect(200, expectedBookmark);
      });
    });
  });

  describe(`POST /api/bookmarks`, () => {
    it(`creates a bookmark, responding with 201 and the new bookmark`, function () {
      this.retries(3);
      const newBookmark = {
        //title, url, rating, description
        title: "Test new bookmark",
        url: "Listicle",
        rating: "3",
        description: "Test new bookmark content...",
      };
      return supertest(app)
        .post("/api/bookmarks")
        .send(newBookmark)
        .expect(201)
        .expect((res) => {
          expect(res.body.title).to.eql(newBookmark.title);
          expect(res.body.url).to.eql(newBookmark.url);
          expect(res.body.rating).to.eql(newBookmark.rating);
          expect(res.body.description).to.eql(newBookmark.description);
          expect(res.body).to.have.property("id");
          expect(res.headers.location).to.eql(`/api/bookmarks/${res.body.id}`);
        })
        .then((postRes) =>
          supertest(app)
            .get(`/api/bookmarks/${postRes.body.id}`)
            .expect(postRes.body)
        );
    });

    // test the body, see if required data is missing
    const requiredFields = ["title", "url", "rating", "description"];

    requiredFields.forEach((field) => {
      const newBookmark = {
        //title, url, rating, description
        title: "Test new bookmark",
        url: "Listicle",
        rating: "3",
        description: "Test new article content...",
      };

      it(`responds with 400 and an error message when the '${field}' is missing`, () => {
        delete newBookmark[field];

        return supertest(app)
          .post("/api/bookmarks")
          .send(newBookmark)
          .expect(400, {
            error: { message: `Missing '${field}' in request body` },
          });
      });
    });
  });

  describe(`DELETE /api/bookmarks/:bookmark_id`, () => {
    context(`Given no bookmark`, () => {
      it(`responds with 404`, () => {
        const bookmarkId = 123456;
        return supertest(app)
          .delete(`/api/bookmarks/${bookmarkId}`)
          .expect(404, { error: { message: `Bookmark doesn't exist` } });
      });
    });
    context("Given there are bookmarks in the database", () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach("insert bookmarks", () => {
        return db.into("bookmarks").insert(testBookmarks);
      });

      it("responds with 204 and removes the bookmark", () => {
        const idToRemove = 2;
        const expectedBookmarks = testBookmarks.filter(
          (bookmark) => bookmark.id !== idToRemove
        );
        return supertest(app)
          .delete(`/api/bookmarks/${idToRemove}`)
          .expect(204)
          .then((res) =>
            supertest(app).get(`/api/bookmarks`).expect(expectedBookmarks)
          );
      });
    });
  });

  describe.only(`PATCH /api/bookmarks/:bookmark_id`, () => {
    context(`Given no bookmarks`, () => {
      it(`responds with 404`, () => {
        const bookmarkId = 12345678;
        return supertest(app)
          .patch(`/api/bookmarks/${bookmarkId}`)
          .expect(404, { error: { message: `Bookmark doesn't exist` } });
      });
    });
    context("Given there are articles in the database", () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach("insert bookmarks", () => {
        return db.into("bookmarks").insert(testBookmarks);
      });

      it("responds with 204 and updates the bookmark", () => {
        const idToUpdate = 2;
        const updateBookmark = {
          title: "Test again update bookmark",
          url: "update again",
          rating: "3",
          description: "Test again update bookmark content...",
        };
        const expectedBookmark = {
          ...testBookmarks[idToUpdate - 1],
          ...updateBookmark,
        };
        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .send(updateBookmark)
          .expect(204)
          .then((res) =>
            supertest(app)
              .get(`/api/bookmarks/${idToUpdate}`)
              .expect(expectedBookmark)
          );
      });

      it(`responds with 400 when no required fields supplied`, () => {
        const idToUpdate = 2;
        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .send({ irrelevantField: "foo" })
          .expect(400, {
            error: {
              message: `Request body must contain either 'title', 'url', 'rating' or 'description'`,
            },
          });
      });

      it(`responds with 204 when updating only a subset of fields`, () => {
        const idToUpdate = 2;
        const updateBookmark = {
          title: "updated bookmark title",
        };
        const expectedBookmark = {
          ...testBookmarks[idToUpdate - 1],
          ...updateBookmark,
        };

        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .send({
            ...updateBookmark,
            fieldToIgnore: "should not be in GET response",
          })
          .expect(204)
          .then((res) =>
            supertest(app)
              .get(`/api/bookmarks/${idToUpdate}`)
              .expect(expectedBookmark)
          );
      });
    });
  });
});
