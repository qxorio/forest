require("dotenv").config();
const notion = require("../_lib/utils").notionClient;
const blockParser = require("../_lib/utils").notionBlockParser;

const postDatabase = process.env.NOTION_BOOKSHELF_DB_ID;

module.exports = async () => {
    let results = [];

    let data = await notion.databases.query({
        database_id: postDatabase,
    });

    results = [...data.results];

    while (data.has_more) {
        data = await notion.databases.query({
            database_id: postDatabase,
            start_cursor: data.next_cursor,
        });

        results = [...results, ...data.results];
    }

    var books = await Promise.all(results.map(getBlocks));

    return books.map((book) => {
        return {
            read: book.properties.Read.date.start,
            author: book.properties.Author.rich_text[0].plain_text,
            rating: book.properties.Rating.rich_text[0].plain_text,
            title: book.properties.Title.title[0].plain_text,
            cover: book.properties.Cover.files[0].file.url,
            review: book.content,
        };
    });
};

async function getBlocks(book) {
    var blocks = [];

    let blockPage = await notion.blocks.children.list({
        block_id: book.id,
    });

    blocks = [...blockPage.results];

    while (blockPage.has_more) {
        blockPage = await notion.blocks.children.list({
            block_id: book.id,
            start_cursor: blockPage.next_cursor,
        });

        blocks = [...blocks, ...blockPage.results];
    }

    book.content = blockParser.parse(blocks);
    return book;
}
