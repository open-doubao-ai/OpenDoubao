import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  collectRowFeedPhotos,
  FEED_PHOTO_MAX,
} from "./smart-image-fields.js";

describe("collectRowFeedPhotos", () => {
  it("returns empty when only an avatar is present", () => {
    const urls = collectRowFeedPhotos(
      {
        "Moment.content": "hi",
        "User.head": "https://cdn.example/a.jpg",
      },
      "Moment",
      ["Moment.content", "User.head"],
    );
    assert.deepEqual(urls, []);
  });

  it("uses pictureList and caps at 9", () => {
    const pics = Array.from(
      { length: 12 },
      (_, i) => `https://cdn.example/${i}.jpg`,
    );
    const urls = collectRowFeedPhotos(
      {
        "Moment.pictureList": pics,
        "User.head": "https://cdn.example/head.jpg",
        "User.pictureList": ["https://cdn.example/user-album.jpg"],
      },
      "Moment",
      ["Moment.pictureList", "User.head", "User.pictureList"],
    );
    assert.equal(urls.length, FEED_PHOTO_MAX);
    assert.deepEqual(urls, pics.slice(0, 9));
  });

  it("falls back to a primary-table single image", () => {
    const urls = collectRowFeedPhotos(
      {
        "Moment.picture": "https://cdn.example/one.jpg",
        "User.head": "https://cdn.example/head.jpg",
      },
      "Moment",
      ["Moment.picture", "User.head"],
    );
    assert.deepEqual(urls, ["https://cdn.example/one.jpg"]);
  });
});
