 var $ = require('jquery');
  
$.get('https://gdata.youtube.com/feeds/api/videos/' + 'gH7dMBcg-gE' + '?v=2&alt=jsonc', 
     function(r){
       console.log(r)
     });