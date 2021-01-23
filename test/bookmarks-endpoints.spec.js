const { expect } = require("chai");
const knex = require("knex");
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

  describe(`GET /bookmarks`, () => {
    //test when database is empty
    context(`Given no bookmarks`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app).get("/bookmarks").expect(200, []);
      });
    });

    context("Given there are bookmarks in the database", () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach("insert bookmarks", () => {
        return db.into("bookmarks").insert(testBookmarks);
      });

      it("responds with 200 and all of the articles", () => {
        return supertest(app).get("/bookmarks").expect(200, testBookmarks);
      });
    });
  });
});
