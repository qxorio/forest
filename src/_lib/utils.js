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

exports.notionClient = notionClient;
exports.notionBlockParser = notionBlockParser;
