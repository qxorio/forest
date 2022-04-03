const instance = Bricks({
    container: ".bookshelf",
    packed: "data-packed",
    sizes: [
        { columns: 1, gutter: 25 },
        { mq: "389px", columns: 2, gutter: 25 },
        { mq: "584px", columns: 3, gutter: 25 }, // 560 + 12 + 12
    ],
});

document.addEventListener("readystatechange", (event) => {
    instance
        .resize(true) // bind resize handler
        .pack(); // pack initial items
});
