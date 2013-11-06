npm-ondemand
============

A npm cache proxy


usage
============

npm install
node index.js

Then change your local registry to use the proxy:

npm set registry http://localhost:8000/


Reset to default behaviour:

npm set registry http://registry.npmjs.org/