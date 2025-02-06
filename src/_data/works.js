require("dotenv").config();
const notion = require("../_lib/utils").notionClient;
const blockParser = require("../_lib/utils").notionBlockParser;
const cloudinary = require("../_lib/utils").cloudinary;
var slugify = require("slugify");

const workDatabase = process.env.NOTION_WORK_DB_ID;

module.exports = async () => {
    let results = [];

    let data = await notion.databases.query({
        database_id: workDatabase,
    });

    results = [...data.results];

    while (data.has_more) {
        data = await notion.databases.query({
            database_id: workDatabase,
            start_cursor: data.next_cursor,
        });

        results = [...results, ...data.results];
    }

    var works = await Promise.all(results.map(getBlocksAndUploadImages));

    let updatedWorks = works
        .map((work) => {
            return {
                pageId: work.id,
                published: getCustomDate(work.created_time),
                edited: getCustomDate(work.last_edited_time),
                tags: work.properties.Tags.multi_select.map((tag) => tag.name),
                title: work.properties.Title.title[0].plain_text,
                body: work.content,
                description: work.properties.Description.rich_text[0].plain_text,
            };
        })
        .sort((a, b) => {
            return new Date(b.published) - new Date(a.published);
        });

    return updatedWorks;
};

function getCustomDate(date) {
    let newDate = new Date(date);
    return newDate.toLocaleString("en-US", { month: "long" }) + " " + newDate.getFullYear();
}

async function getBlocksAndUploadImages(work) {
    let directory = "works/" + slugify(work.properties.Title.title[0].plain_text, { lower: true });

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
                block_id: work.id,
            });

            blocks = [...blockPage.results];

            while (blockPage.has_more) {
                blockPage = await notion.blocks.children.list({
                    block_id: work.id,
                    start_cursor: blockPage.next_cursor,
                });

                blocks = [...blocks, ...blockPage.results];
            }

            blocks = blocks.map(async (block) => {
                // shift all headings to be one level lower, to exclude h1 (used for the work title)
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

            work.content = blockParser.parse(blocks);
            return work;
        });
}
