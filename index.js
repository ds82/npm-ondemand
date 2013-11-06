var http      = require('http'),
    url       = require('url'),
    request   = require('request'),
    fs        = require('fs'),
    path      = require('path'),
    stream    = require('stream');

var options = {
  data: './data/',
  host: 'localhost',
  port: 8000
};

if ( ! fs.existsSync( options.data ) || ! fs.statSync( options.data ).isDirectory()) {
  console.log('Please ensure that data directory exists...');
  process.exit(1);
}

http.createServer( function(req, res ) {

  var urlPath = url.parse(req.url).path;
  console.log( Date().toLocaleString(), req.headers.host, urlPath );

  if (!urlPath.match(/\.tgz$/g)) {
    return request.get('http://registry.npmjs.org' + req.url,
        function( err, response, body ) {

          var body = JSON.parse(body),
              versions = body.versions,
              name = body.name;

              if ( body.dist && body.dist.tarball ) {
                body.dist.tarball = body.dist.tarball
                  .replace(/http(s)?\:\/\/registry.npmjs.org\//,
                          'http://'+options.host+':'+options.port+'/'
                  );
              } 

              if ( versions ) {
                Object.keys(versions).forEach(function(version) {
                  versions[version].dist.tarball = 
                    versions[version].dist.tarball
                      .replace(
                        /http(s)?\:\/\/registry.npmjs.org\//,
                        'http://'+options.host+':'+options.port+'/'
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

}).listen( options.port );
console.log('Running on-demand npm mirror on port '+ options.port +' ...');

