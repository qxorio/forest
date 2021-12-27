require("dotenv").config();
const notion = require("../_lib/utils").notionClient;
const blockParser = require("../_lib/utils").notionBlockParser;

const postDatabase = process.env.NOTION_POST_DB_ID;

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

    var posts = await Promise.all(results.map(getBlocks));

    return posts.map((post) => {
        return {
            published: post.created_time,
            edited: post.last_edited_time,
            tags: post.properties.Tags.multi_select.map((tag) => tag.name),
            title: post.properties.Title.title[0].plain_text,
            body: post.content,
        };
    });
};

async function getBlocks(post) {
    var blocks = [];

    let blockPage = await notion.blocks.children.list({
        block_id: post.id,
    });

    blocks = [...blockPage.results];

    while (blockPage.has_more) {
        blockPage = await notion.blocks.children.list({
            block_id: post.id,
            start_cursor: blockPage.next_cursor,
        });

        blocks = [...blocks, ...blockPage.results];
    }

    blocks = blocks.map((block) => {
        switch (block.type) {
            case "image":
                return (
                    '<img src="' +
                    block.image.file.url +
                    '" alt="' +
                    block.image.caption[0].plain_text.toString() +
                    '">'
                );
            default:
                return blockParser.parse([block]);
        }
    });

    post.content = blocks.join("");
    return post;
}
