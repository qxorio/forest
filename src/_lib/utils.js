require("dotenv").config();

// notion client
const notionSDK = require("@notionhq/client");
const notionClient = new notionSDK.Client({
    auth: process.env.NOTION_TOKEN,
});

// notion block parser
const notionBlocks = require("@notion-stuff/blocks-html-parser");
const notionBlockParser = notionBlocks.NotionBlocksHtmlParser.getInstance({
    mdParserOptions: { emptyParagraphToNonBreakingSpace: true },
});

const cloudinary = require("cloudinary").v2;
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.notionClient = notionClient;
exports.notionBlockParser = notionBlockParser;
exports.cloudinary = cloudinary;
