var http      = require('http'),
    url       = require('url'),
    request   = require('request'),
    util      = require('util'),
    fs        = require('fs'),
    path      = require('path'),
    stream    = require('stream');

var options = {
  data: 'data/',

};

http.createServer( function(req, res ) {

  var urlPath = url.parse(req.url).path;

  if (!urlPath.match(/\.tgz$/g)) {
    return request.get('http://registry.npmjs.org' + req.url,
        function( err, response, body ) {

          var body = JSON.parse(body),
              versions = body.versions,
              name = body.name;

              //console.log(util.inspect(body, null, null, null));
              console.log( urlPath, name );

              if ( body.dist && body.dist.tarball ) {
                body.dist.tarball = body.dist.tarball
                  .replace(/http(s)?\:\/\/registry.npmjs.org\//,
                          'http://localhost:8000/'
                  );
              } 

              if ( versions ) {
                Object.keys(versions).forEach(function(version) {
                  versions[version].dist.tarball = 
                    versions[version].dist.tarball
                      .replace(
                        /http(s)?\:\/\/registry.npmjs.org\//,
                        'http://localhost:8000/'
                      );
                });
              }


          res.end(JSON.stringify(body));
        });
  
  } else {

    var file = path.basename( req.url );

    fs.exists( options.data + file, function( exists ) {
      
      if ( exists ) {
        var data = fs.createReadStream( options.data + file );
        data.pipe( res );
      
      } else {
        var write = fs.createWriteStream( options.data + file );

        write.on('finish', function() {
          var read = fs.createReadStream( options.data + file );
          read.pipe( res );
        });
        request.get('http://registry.npmjs.org' + req.url).pipe( write );
      }
      
    });
  }

}).listen(8000);
console.log('Running on-demand npm mirror on port 8000...');