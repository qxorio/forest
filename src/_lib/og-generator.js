const { createCanvas, registerFont, loadImage } = require("canvas");
var slugify = require("slugify");
const cloudinary = require("./utils").cloudinary;

// Wrap text in canvas
const wrapText = (context, text, x, y, maxWidth, lineHeight) => {
    var words = text.split(" ");
    var line = "";

    for (var n = 0; n < words.length; n++) {
        var testLine = line + words[n] + " ";
        var metrics = context.measureText(testLine);
        var testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            context.fillText(line, x, y);
            line = words[n] + " ";
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    context.fillText(line, x, y);
};

async function generate(post) {
    return await loadImage("./src/assets/images/logo-og.png").then(async (logo) => {
        const width = 1200;
        const height = 630;

        let titleFontSize = 100;
        let titleFontLineHeight = 130;
        let titleX = 50;
        let titleY = 20;

        let dateAndTagFontSize = 30;
        let dateX = 50;
        let dateY = 460;
        let tagsX = 50;
        let tagsY = 535;

        let logoX = 1030;
        let logoY = 460;

        registerFont("./src/assets/fonts/sora/sora-light.ttf", {
            family: "Sora Light",
        });

        registerFont("./src/assets/fonts/paper-orange/paper-orange.ttf", {
            family: "Paper Orange",
        });

        const canvas = createCanvas(width, height);
        const context = canvas.getContext("2d");

        context.fillStyle = "#171717";
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.drawImage(logo, logoX, logoY, 120, 120);

        context.textAlign = "left";
        context.textBaseline = "top";
        context.fillStyle = "#ffffff";

        context.font = `normal ${titleFontSize}pt Paper Orange`;
        wrapText(context, `${post.title}`, titleX, titleY, 1150, titleFontLineHeight);

        context.font = `normal ${dateAndTagFontSize}pt 'Sora Light'`;
        context.fillText(`${post.tags.join("   ")}`, tagsX, tagsY);
        context.globalAlpha = 0.7;
        context.fillText(`${post.published.toUpperCase()}`, dateX, dateY);

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

        return {
            title: post.title,
            url: response.secure_url,
        };
    });
}

exports.generateOgImage = generate;
