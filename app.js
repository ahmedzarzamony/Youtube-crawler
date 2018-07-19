var compression = require('compression')
var express = require('express');
var https = require('https');
var timeout = require('connect-timeout')


var app = express();
app.use(timeout('5s'))
app.use(compression())
app.set('view engine', 'ejs');

app.use(function(req,res,next){
    var _send = res.end;
    var sent = false;
    res.send = function(data){
        if(sent) return;
        _send.bind(res)(data);
        sent = true;
    };
    next();
});

const apiKey = 'AIzaSyBUqO8tKDzyyE_Bbs7ArYkwuMmLT1vxnoQ';
var cats_names = [];
var channelId = '';
const target = 500;
const port = 10;

app.get('/', function (req, res) {
    res.render('index', {
        error: req.query.error
    });
})

app.get('/list', function (req, res) {
    console.log('\nNew Process...')
    console.log('***********************************')
    var fdate = new Date();
    if (!req.query.channel || req.query.channel.length != 24) {
        console.log('Invalid channel id, back to home.')
        return res.redirect(301, '/?error=Invalid channel id');
    } else {
        channelId = req.query.channel
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    var listv = [];
    getList('', listv, 1, function (err, data, rcode, total_videos, lastres_count) {
        if(err){
            console.log('Search error: ', err);
            return res.redirect(301, '/?error=somthing wrong in search process, please try again.');
        }
        if (total_videos) {
            getCats(rcode)
            var new_data = JSON.parse(JSON.stringify(data));
            var list = [];
            let v_list = [];
            var i = 0;
            new_data.forEach(function (ndata) {
                var ids = [];
                ndata.forEach(function (item) {
                    ids.push(item.id.videoId);
                    list[i] = {
                        'count': i + 1,
                        'name': item.snippet.channelTitle,
                        'rcode': rcode,
                        'id': item.id.videoId,
                        'title': item.snippet.title,
                        'statistics': '',
                        'catname': ''
                    };
                    i++;
                });
                if (ids.length == 50 || ids.length >= total_videos || ids.length >= lastres_count) {
                    getVideos(ids.join(), v_list, list, function (err, data) {
                        if(err){
                            console.log('videos error: ', err);
                            return res.redirect(301, '/?error=somthing wrong in videos list, please try again.');
                        }
                        res.render('list', {
                            total: total_videos, 
                            data: data,
                            date: (new Date() - fdate)
                        })
                    });
                }
            });
        }//total_videos END IF
        else{
            res.render('list', {
                total: total_videos
            })
        }
    });

});

function getList(next, listv, i, callback) {
    console.time('Search processed.')
    var part = 'id%2Csnippet';
    var maxResults = '50';
    var nextPageToken = (next != '') ? next : '';

    var url = "https://www.googleapis.com/youtube/v3/search?order=date&type=video&part=" + part + "&channelId=" + channelId + "&maxResults=" + maxResults + "&key=" + apiKey + "&pageToken=" + nextPageToken;
    https.get(url, function (res) {
        var body = '';

        res.on('data', function (chunk) {
            body += chunk;
        });

        res.on('end', function () {
            var data = JSON.parse(body);
            if(data.pageInfo.totalResults == 0){
                console.log('Search found 0 video.')
                callback(null, listv, '', 0, 0);
                return;
            }
            next = '';
            if (data.nextPageToken) {
                next = data.nextPageToken;
            }
            var rcode = (data.regionCode) ? data.regionCode : '';
            if (data.items.length) {
                i += data.items.length;
                listv.push(data.items);
            }
            if (next && i <= target) {
                getList(data.nextPageToken, listv, i, callback);
            } else {
                console.timeEnd('Search processed.')
                callback(null, listv, rcode, i, data.items.length);
            }
        });
    }).on('error', function (e) {
        callback(e, null);
    });
}

function getVideos(ids, list, olist, callback) {
    console.time('Videos processed.')
    var url = "https://www.googleapis.com/youtube/v3/videos?part=snippet%2Cstatistics&id=" + ids + "&key=" + apiKey;
    https.get(url, function (res) {
        var videos = '';
        res.on('data', function (d) {
            videos += d;
        })
        res.on('end', function () {
            var list_videos = JSON.parse(videos);
            list_videos.items.forEach(function (item) {
                if (olist[list.length]) {
                    olist[list.length].catname = cats_names[item.snippet.categoryId];
                    olist[list.length].statistics = item.statistics;
                    list.push(item.snippet.categoryId)
                }
            })
            console.log('Got', list.length, 'videos from', olist.length)
            if (list.length >= target || list.length >= olist.length) {
                console.timeEnd('Videos processed.')
                callback(null, olist)
            }
        })
    }).on('error', function (e) {
        callback(e, null);
    });
}

function getCats(rcode) {
    console.time('Categories processed.')
    var url = "https://www.googleapis.com/youtube/v3/videoCategories?part=snippet&regionCode=" + rcode + "&fields=items(id%2Csnippet%2Ftitle)%2CpageInfo&key=" + apiKey;
    https.get(url, function (res) {
        var cats = '';
        res.on('data', function (d) {
            cats += d;
        })
        res.on('end', function () {
            var list_cats = JSON.parse(cats);
            var objItem = {};
            list_cats.items.forEach(function (item) {
                objItem[item.id] = item.snippet.title;
            });
            cats_names = objItem;
            console.timeEnd('Categories processed.')
        })
    }).on('error', function (e) {
        console.log('Get Categories has error.')
    });
}



app.listen(port, function(){
    console.log(`\nServer running at http://127.0.0.1:${port}`);
});