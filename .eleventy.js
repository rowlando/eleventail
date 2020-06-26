const { DateTime }  = require('luxon');
const util          = require('util');
const moment        = require("moment");

function generateDateSet(collection, format){
  let dateSet = new Set();

  collection.getAllSorted().forEach(function(item) {
    if( "date" in item.data ) {

      var tags = item.data.tags;
      if( typeof tags === "string" ) {
        tags = [tags];
      }
      if ( tags && ( tags.includes("post") ) ){
        let itemDate = item.data.date;
        var date = moment(itemDate).format(format);
        dateSet.add(date);
      }     
    }
  });

  return Array.from(dateSet);
}

function getItemsByDate(collection, date, format){

  var result = {};
  result = collection.getAll().filter(function(item) {

      var tags = item.data.tags;

      if( typeof tags === "string" ) {
        tags = [tags];
      }

      if ( tags && ( tags.includes("post") ) ){

        if( !item.data.date ){
          return false;
        }

        var itemDate = item.data.date;
        var itemShortDate = moment(itemDate).format(format);

        return (itemShortDate == date);
      };
      return false;
    });

  result = result.sort(function(a, b) {
    return b.date - a.date;
  });

  return result;
}

const contentByDateString = (collection, format) => {
  var dateSet = {};
  var newSet = new Set();

  dateSet = generateDateSet(collection, format);

  dateSet.forEach(function(date){
    var result = getItemsByDate(collection, date, format)
    newSet[date] = result;
  });

  return [{...newSet}];
}

function contentByYear(collection) {
  return contentByDateString(collection, "YYYY");
}

module.exports = function(eleventyConfig) {

  eleventyConfig.addCollection("collectionByYear" , function(collection) {
    var collectionByYear = contentByYear(collection);
    return collectionByYear[0];
  });

  // Layout aliases for convenience
  eleventyConfig.addLayoutAlias('default', 'layouts/base.njk');
  eleventyConfig.addLayoutAlias('conf', 'layouts/conf.njk');

  // a debug utility
  eleventyConfig.addFilter('dump', obj => {
    return util.inspect(obj)
  });

  // Date helpers
  eleventyConfig.addFilter('readableDate', dateObj => {
    return DateTime.fromJSDate(dateObj, {
      zone: 'utc'
    }).toFormat('dd/MM/yy');
  });

  eleventyConfig.addFilter('htmlDate', dateObj => {
    return DateTime.fromJSDate(dateObj, {
      zone: 'utc'
    }).toFormat('y-MM-dd');
  });

  // Grab excerpts and sections from a file
  eleventyConfig.addFilter("section", require("./src/utils/section.js") );

  // compress and combine js files
  eleventyConfig.addFilter("jsmin", require("./src/utils/minify-js.js") );

  // minify the html output when running in prod
  if (process.env.NODE_ENV == "production") {
    eleventyConfig.addTransform("htmlmin", require("./src/utils/minify-html.js") );
  }

  // Static assets to pass through
  eleventyConfig.addPassthroughCopy("./src/site/fonts");
  eleventyConfig.addPassthroughCopy("./src/site/images");
  eleventyConfig.addPassthroughCopy("./src/site/css");

  return  {
    dir: {
      input: "src/site",
      includes: "_includes",
      output: "dist"
    },
    passthroughFileCopy: true,
    templateFormats : ["njk", "md"],
    htmlTemplateEngine : "njk",
    markdownTemplateEngine : "njk",
  };

};
