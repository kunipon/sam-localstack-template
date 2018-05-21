const AWS = require('aws-sdk');
const LineStream = require('byline').LineStream;
const stream = require('stream');
const zlib = require('zlib');
const NODE_ENV = process.env.NODE_ENV;
const config = require(`./aws-config${NODE_ENV}.json`);
const s3 = new AWS.S3(config);

const convert = async (s3Bucket, s3Key) => {
    const s3GetStream = s3.getObject({Bucket: s3Bucket, Key: s3Key}).createReadStream();
    const zlibStream = zlib.createGunzip();
    const lineStream = new LineStream();
    const transformStream = new stream.Transform({objectMode: true});
    transformStream._transform = function(line, encoding, done) {
        this.push(line.toString());
        done();
    };
    // const compressStream = snappyStream.createCompressStream();
    // const dest = fs.createWriteStream('dest.txt', 'utf8');

    let data = [];
    s3GetStream
        .pipe(zlibStream)
        .pipe(lineStream)
        .pipe(transformStream)
        .on('data', (transformedOnject) => {
            data.push(transformedOnject);
        });

    return new Promise((resolve, reject) => {
        transformStream.on('end', () => resolve(data));
        s3GetStream.on('error', reject);
        zlibStream.on('error', reject);
        lineStream.on('error', reject);
        transformStream.on('error', reject);
    });
};

const run = async (s3Bucket, s3Key) => {
    return await convert(s3Bucket, s3Key);
};

// run().catch(console.error.bind(console));

exports.handler = async (event, context, callback) => {
    // const message = JSON.parse(event.Records[0].Sns.Message);
    const s3Bucket = `${event.Records[0].s3.bucket.name}`;
    const s3Key = `${event.Records[0].s3.object.key}`;
    const result = await run(s3Bucket, s3Key).catch(console.error.bind(console));
    callback(null, `${result}`);
};