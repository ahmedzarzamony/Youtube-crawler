var https = require('https');

module.exports = class Youtube {
    constructor() {
        this.url = 'https://www.googleapis.com/youtube/v3/';
        this.part = '';
        this.apiKey = '';
        this.channelId = '';
        this.count = '';
        this.list = ['apiKey', 'channelId', 'count'];
    }

    /**
     * @param {string} name is string and must be one of these apiKey, channelId, count
     * @param {string} value is a value for selected key
     */
    setAttr(name, value) {
        try {
            if (this.list.indexOf(name) == -1) {
                throw new SyntaxError("Unkown attribute name");
            }
            this[name] = value;
        } catch (e) {
            console.log('Attribute Error:', e.message)
        }
    }

    /**
     * @param {string} name get value for any key of these apiKey, channelId, count
     */
    getAttr(name) {
        try {
            if (this.list.indexOf(name) == -1) {
                throw new SyntaxError("Unkown attribute name");
            }
            return this[name];
        } catch (e) {
            console.log('Attribute Error:', e.message)
        }
    }
    getChannelId(name, callback) {
        var _this = this;
        this.request(this.url + 'channels?part=snippet&forUsername=' + name + "&key=" + this.apiKey, (e, data) => {
            try {
                if (e || data.pageInfo.totalResults == 0) {
                    throw new SyntaxError('Can\'t get channel data')
                }
                _this.channelId = data.items[0].id;
                callback(e, data.items[0].id, data);
            } catch (e) {
                console.log('Channel Error:', e.message)
            }

        })
    }
    search() {

    }
    video() {

    }
    category() {

    }
    request(url, callback) {
        https.get(url, function (res) {
            var body = '';
            res.on('data', function (chunk) {
                body += chunk;
            });
            res.on('end', function () {
                var data = JSON.parse(body);
                callback(null, data);
            });
        }).on('error', function (e) {
            callback(e, null);
        });
    }

}
