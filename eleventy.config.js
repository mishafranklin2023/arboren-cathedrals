module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("base.css");
  eleventyConfig.addPassthroughCopy("styles.css");
  eleventyConfig.addPassthroughCopy("script.js");
  eleventyConfig.addPassthroughCopy("supabase-config.js");
  eleventyConfig.addPassthroughCopy("images/ArbCatioLogo.png");
  eleventyConfig.addPassthroughCopy("images/CrewPicsOpt");
  eleventyConfig.addPassthroughCopy("images/cathedral-bridge.svg");
  eleventyConfig.addPassthroughCopy("images/optimized/carousel-*.webp");
  eleventyConfig.addPassthroughCopy("images/pawthorne-bridge.svg");
  eleventyConfig.addPassthroughCopy("images/taillikum-bridge.svg");
  eleventyConfig.addPassthroughCopy("Dave_Thom-optimized.avif");

  eleventyConfig.addWatchTarget("base.css");
  eleventyConfig.addWatchTarget("styles.css");
  eleventyConfig.addWatchTarget("script.js");

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes"
    },
    htmlOutputSuffix: "",
    passthroughFileCopy: true
  };
};
