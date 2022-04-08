require("dotenv").config();
const notion = require("../_lib/utils").notionClient;
const blockParser = require("../_lib/utils").notionBlockParser;
const cloudinary = require("../_lib/utils").cloudinary;
const generateOg = require("../_lib/og-generator").generateOgImage;
var slugify = require("slugify");

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

    var posts = await Promise.all(results.map(getBlocksAndUploadImages));

    let updatedPosts = posts
        .map((post) => {
            return {
                pageId: post.id,
                published: getCustomDate(post.created_time),
                edited: getCustomDate(post.last_edited_time),
                tags: post.properties.Tags.multi_select.map((tag) => tag.name),
                title: post.properties.Title.title[0].plain_text,
                body: post.content,
                description: post.properties.Description.rich_text[0].plain_text,
                ogImage: post.properties.OG.files.length === 1 ? post.properties.OG.files[0].external.url : "",
            };
        })
        .sort((a, b) => {
            return new Date(b.published) - new Date(a.published);
        });

    let titleAndOgUrls = await Promise.all(await updatedPosts.filter((up) => !up.ogImage).map(generateOg));

    titleAndOgUrls.forEach((x) => {
        let current = updatedPosts.find((p) => p.title == x.title);
        current.ogImage = x.url;
        notion.pages.update({
            page_id: current.pageId,
            properties: {
                OG: {
                    files: [
                        {
                            name: x.url,
                            type: "external",
                            external: {
                                url: x.url,
                            },
                        },
                    ],
                },
            },
        });
        delete current.pageId;
    });

    return updatedPosts;
};

function getCustomDate(date) {
    return new Date(date).toDateString().split(" ").splice(1).join(" ");
}

async function getBlocksAndUploadImages(post) {
    let directory = "posts/" + slugify(post.properties.Title.title[0].plain_text, { lower: true });

    return await cloudinary.search
        .expression(`folder=${directory}`)
        .execute()
        .then(async (result) => {
            if (!result || result.totalCount < 1) {
                console.warn(`Incorrect image block(s) pulled from Cloudinary with folder of ${directory}`);
            }

            let imageArray = result.resources;

            // get blocks
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

            blocks = blocks.map(async (block) => {
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

                if (block.image) {
                    let filename = slugify(block.image.caption[0].plain_text, { lower: true });
                    let imageFromCloudinary = imageArray.find((img) => img.public_id == `${directory}/${filename}`);

                    switch (block.image.type) {
                        case "external":
                            if (imageFromCloudinary) {
                                block.image.external.url = imageFromCloudinary.secure_url;
                            } else {
                                await cloudinary.uploader.upload(
                                    block.image.external.url,
                                    {
                                        public_id: `${directory}/${filename}`,
                                    },
                                    function (err, res) {
                                        if (err) console.warn(err);
                                        block.image.external.url = res.secure_url;
                                        return;
                                    }
                                );
                            }
                            return block;
                        case "file":
                            if (imageFromCloudinary) {
                                block.image.file.url = imageFromCloudinary.secure_url;
                            } else {
                                await cloudinary.uploader.upload(
                                    block.image.file.url,
                                    {
                                        public_id: `${directory}/${filename}`,
                                    },
                                    function (err, res) {
                                        if (err) console.warn(err);
                                        block.image.file.url = res.secure_url;
                                        return;
                                    }
                                );
                            }
                            return block;
                        default:
                            break;
                    }
                }

                return block;
            });

            blocks = await Promise.all(blocks);

            post.content = blockParser.parse(blocks);
            return post;
        });
}
