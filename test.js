var youtube = require('./youtube');

var yt = new youtube();

yt.setAttr('apiKey', 'AIzaSyBUqO8tKDzyyE_Bbs7ArYkwuMmLT1vxnoQ');

yt.getChannelId('alnahareg', (e, id, data)=>{
    console.log(id)
});
