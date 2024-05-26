require("dotenv").config();
const notion = require("../_lib/utils").notionClient;
const blockParser = require("../_lib/utils").notionBlockParser;

const postDatabase = process.env.NOTION_BOOKSHELF_DB_ID;
const openLibraryAPI = "https://openlibrary.org/search.json?q=";

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

    let updatedBooks = await Promise.all(results.map(getBlocksAndBookInfo));

    return updatedBooks
        .map((book) => {
            return {
                read: getCustomDate(book.properties.Read.date.start),
                author: book.olBook.author_name.shift(),
                rating: new Array(book.properties.Rating.number).fill(""),
                title: book.olBook.title,
                cover: book.olBook.coverImage,
                review: book.content,
                goodreads: book.properties.Review.url,
                reading: book.properties.Reading.checkbox,
                dnf: book.properties.DNF.checkbox,
                audiobook: book.properties.Audio.checkbox,
            };
        })
        .sort((a, b) => {
            return new Date(b.read) - new Date(a.read);
        });
};

function getCustomDate(date) {
    return new Date(date).toDateString().split(" ").splice(1).join(" ");
}

async function getBlocksAndBookInfo(book) {
    let olid = `OL${book.properties.OLID.number}M`;
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

    blocks = blocks.map((block) => {
        // shift all headings to be one level lower, to exclude h1 (used for the post title)
        if (block.type.startsWith("heading")) {
            const { heading, ...restOfBlock } = block;
            let incrementedHeading = "heading_" + (+block.type.split("_")[1] + 1);

            let newBlock = {
                ...restOfBlock,
                type: incrementedHeading,
            };

            newBlock[incrementedHeading] = block[block.type];
            return newBlock;
        }

        return block;
    });

    let olBook = await fetch(openLibraryAPI + olid).then(async (response) => {
        let results = await response.json();
        return results.docs.shift();
    });

    olBook.coverImage = `https://covers.openlibrary.org/b/olid/${olid}-L.jpg`;

    book.content = blockParser.parse(blocks);
    book.olBook = olBook;

    return book;
}
