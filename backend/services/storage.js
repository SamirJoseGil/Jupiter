const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const getStorageConfig = () => {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const bucket = process.env.CLOUDFLARE_R2_BUCKET;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const publicBaseUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || '';

  const enabled = !!(accountId && bucket && accessKeyId && secretAccessKey);

  return {
    enabled,
    accountId,
    bucket,
    accessKeyId,
    secretAccessKey,
    publicBaseUrl,
  };
};

const getClient = (config) => {
  if (!config.enabled) {
    return null;
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
};

const sanitizeFileName = (fileName = 'archivo') =>
  fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'archivo';

const dataUrlToBuffer = (dataUrl) => {
  const match = String(dataUrl || '').match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid file payload (expected data URL base64)');
  }

  const [, contentType, base64Data] = match;
  return {
    contentType,
    buffer: Buffer.from(base64Data, 'base64'),
  };
};

const buildObjectKey = ({ date, trackingId, kind, fileName }) => {
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd}/${trackingId}/${kind}/${sanitizeFileName(fileName)}`;
};

const uploadEvidenceFiles = async ({ trackingId, files = [], kind }) => {
  const config = getStorageConfig();
  const client = getClient(config);
  const now = new Date();

  const uploaded = [];

  for (let index = 0; index < files.length; index += 1) {
    const item = files[index];
    const fileName = sanitizeFileName(item.fileName || `${kind}-${index + 1}`);
    const { contentType, buffer } = dataUrlToBuffer(item.dataUrl);
    const key = buildObjectKey({ date: now, trackingId, kind, fileName });

    if (client) {
      const command = new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: buffer,
        ContentType: item.contentType || contentType,
      });
      await client.send(command);
    }

    const url = config.publicBaseUrl
      ? `${config.publicBaseUrl.replace(/\/$/, '')}/${key}`
      : null;

    uploaded.push({
      key,
      fileName,
      contentType: item.contentType || contentType,
      size: buffer.length,
      url,
      storage: client ? 'r2' : 'unconfigured',
    });
  }

  return uploaded;
};

module.exports = {
  uploadEvidenceFiles,
};
