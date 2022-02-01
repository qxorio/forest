const { createCanvas, registerFont } = require("canvas");
var slugify = require("slugify");
const cloudinary = require("./utils").cloudinary;

const width = 1200;
const height = 630;

async function generate(post) {
    registerFont("./src/assets/fonts/fahkwang/fahkwang-regular.woff", { family: "Fahkwang" });

    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");

    context.textAlign = "center";

    context.fillStyle = "#f8f8f8";
    context.fillRect(0, 0, width, height);

    // Add titles
    context.fillStyle = "#527a51";
    context.font = "60pt Fahkwang";
    context.fillText("quinn tenorio", canvas.width / 2, 100);

    context.fillStyle = "#333333";
    context.font = "85pt Fahkwang";
    context.fillText(`${post.title}`, canvas.width / 2, canvas.height / 2 + 40);

    // Add labels
    context.font = "35pt Fahkwang";
    context.fillText(`${post.published} • ${post.tags.join(", ")}`, canvas.width / 2, 575);

    const base64 = canvas.toDataURL("image/jpeg");

    let file = "posts/" + slugify(post.title, { lower: true }) + "/" + slugify(post.title, { lower: true });
    let response = await cloudinary.uploader.upload(
        base64,
        {
            public_id: file,
        },
        function (err, res) {
            if (err) console.warn(err);
            return res.secure_url;
        }
    );

    return response.secure_url;
}

exports.generateOgImage = generate;
