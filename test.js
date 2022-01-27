const axios = require('axios')
const Parser = require('./index.js')

let parser = new Parser()

config = {
  "name": "data",
  "map": [
      {"function": "string-to-element"},
      {"function": "css", "kwargs": {"patterns": ["#comic > .row > .exemptComicItem"]}},
  ],
  "children": [{
      "name": "title",
      "map": [
          {"function": "css", "kwargs": {"patterns": ["p[title]"]}},
      ]
  }, {
      "name": "img",
      "map": [
          {"function": "css", "kwargs": {"patterns": [".exemptComicItem-img > a > img"]}},
          {"function": "attr", "kwargs": {"attrName": "data-src"}},
      ]
  }, {
      "name": "comic_id",
      "map": [
          {"function": "css", "kwargs": {"patterns": [".exemptComicItem-img > a"]}},
          {"function": "attr", "kwargs": {"attrName": "href"}},
          {"function": "regex", "kwargs": {"pattern": "comic/(.*?)$"}},
      ]
  }, {
      "name": "author",
      "map": [
          {"function": "css", "kwargs": {"patterns": [".exemptComicItem-txt > span.exemptComicItem-txt-span > a[href^=\"/author\"]"]}},
      ],
  }]
}

axios({
  method: 'GET',
  headers: {
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36'
  },
  url: 'https://copymanga.org/recommend'
}).then(response => {
  const content = response.data
  resp = parser.parse(content, config)
  console.log(JSON.stringify(resp))
}, err => {
  console.error(err)
})

// ========

let resp = parser.parse({a: {b: [{c: 1}]}}, {
  name: 'c',
  map: [
    { function: 'index', kwargs: { pattern: 'a.b[0].c' } }
  ]
})
console.log(resp)
