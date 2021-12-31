require("dotenv").config();
const notion = require("../_lib/utils").notionClient;

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

    return results
        .map((book) => {
            return {
                read: getCustomDate(book.properties.Read.date.start),
                author: book.properties.Author.rich_text[0].plain_text,
                rating: book.properties.Rating.rich_text[0].plain_text,
                title: book.properties.Title.title[0].plain_text,
                cover: book.properties.Cover.files[0].name,
                review: book.properties.Review.url,
                reading: book.properties.Reading.checkbox,
            };
        })
        .sort((a, b) => {
            return new Date(b.read) - new Date(a.read);
        });
};

function getCustomDate(date) {
    return new Date(date).toDateString().split(" ").splice(1).join(" ");
}
