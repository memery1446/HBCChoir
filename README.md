# HBCChoir
Your JSON Format for Multi-Page Songs:
json{
"title": "I BELIEVE IN A HILL CALLED MOUNT CALVARY",
"useImages": true,
"imageBaseName": "6-I-Believe-in-a-Hill-Called-Mount-Calvary",
"pageCount": 6,
"tracks": [
{"name": "MELODY", "src": "audio/I.Believe.Old.Rugged.mp3"},
{"name": "ALTO", "src": "audio/I.Believe.Old.Rugged.6.5.Sus.mp3"},
{"name": "TENOR", "src": "audio/I.Believe.Old.Rugged.Db.mp3"}
]
}
For Single Page Songs:
json{
"title": "SINGLE PAGE SONG",
"useImages": true,
"imageBaseName": "1-Single-Page-Song",
"pageCount": 1,
"tracks": [...]
}


### for pdfs to jpg:
node convert-pdfs.js

### for pptx to pdf: 
node convert-pptx-to-pdf.js

### for lyric slide pdf to jpg:
node convert-lyric-pdfs.js