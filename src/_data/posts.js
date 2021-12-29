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

    return posts
        .map((post) => {
            return {
                published: new Date(post.created_time).toDateString(),
                edited: new Date(post.last_edited_time).toDateString(),
                tags: post.properties.Tags.multi_select.map((tag) => tag.name),
                title: post.properties.Title.title[0].plain_text,
                body: post.content,
            };
        })
        .sort((a, b) => {
            return new Date(b.published) - new Date(a.published);
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

    blocks = blockParser.parse(blocks);
    console.log(typeof blocks);

    post.content = blocks.replace(/<figcaption.*?>.*?<\/figcaption>/gi, ""); //.join("");
    return post;
}
