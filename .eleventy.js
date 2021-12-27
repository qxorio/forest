module.exports = function (eleventyConfig) {
    eleventyConfig.addLayoutAlias("post", "includes/layouts/post.njk");
    return {
        // These are all optional, defaults are shown:
        dir: {
            input: "src",
            includes: "_includes",
            data: "_data",
            output: "_site",
        },
    };
};
