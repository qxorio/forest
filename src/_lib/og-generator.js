const { createCanvas, registerFont } = require("canvas");
var slugify = require("slugify");
const cloudinary = require("./utils").cloudinary;

const width = 1200;
const height = 630;

async function generate(post) {
    registerFont("./src/assets/fonts/viaoda-libre/viaoda-libre.woff", { family: "Viaoda Libre" });
    registerFont("./src/assets/fonts/firasans-light/firasans-light.woff", { family: "Fira Sans" });

    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");

    context.textAlign = "center";

    context.fillStyle = "#ececec";
    context.fillRect(0, 0, width, height);

    // Add titles
    context.fillStyle = "#3c5237";
    context.font = "60pt Viaoda Libre";
    context.fillText("quinn tenorio", canvas.width / 2, 100);

    context.fillStyle = "#000";
    context.font = "80pt Viaoda Libre";
    context.fillText(`${post.title}`, canvas.width / 2, canvas.height / 2 + 45);

    // Add labels
    context.font = "35pt Fira Sans";
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
