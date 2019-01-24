const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const { argv } = require('yargs');
const readline = require('readline');
require('dotenv').config({ path: path.resolve(__dirname, './.env') });

let action = 'list';
if (argv.l) {
  action = 'list';
}
if (argv.u) {
  action = 'upload';
}
if (argv.d) {
  action = 'delete';
}

AWS.config = new AWS.Config();
AWS.config.accessKeyId = process.env.S3_ACCESS_KEY_ID;
AWS.config.secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
const s3 = new AWS.S3({ apiVersion: process.env.S3_API_VERSION });

const params = {
  Bucket: process.env.S3_BUCKET,
};

if (action === 'list') {
  s3.listObjects(params, (err, data) => {
    if (err) {
      console.log(err, err.stack);
      return;
    }

    const objects = data.Contents;

    delete data.Contents;
    Object.keys(data).forEach((key) => {
      console.log(`${key}:`, data[key]);
    });
    console.log('List of objects:');
    console.log(JSON.stringify(objects, null, 2));
  });
}

if (action === 'upload') {
  const readStream = fs.createReadStream(path.join(__dirname, 'test.png'));
  s3.upload({
    Bucket: process.env.S3_BUCKET,
    Key: `test-${Math.random().toString(32).substr(2)}.png`,
    Body: readStream,
  }, (err, data) => {
    if (err) {
      console.log(err, err.stack);
      return;
    }
    
    console.log('Object uploaded successfully');
    console.log(JSON.stringify(data, null, 2));
  });
}

if (action === 'delete') {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Enter object key to delete: ', (key) => {
    if (!key) {
      console.log('Invalid key entered');
      rl.close();
      return;
    }

    s3.deleteObject({
      Bucket: process.env.S3_BUCKET,
      Key: key,
    }, (err) => {
      if (err) {
        console.log(err, err.stack);
        return;
      }

      console.log('Object deleted successfully');
      rl.close();
    });
  });
}
