import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads/resources');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique name keeping original extension
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf', // pdf
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
    'application/zip', // zip
    'application/x-zip-compressed',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ];

  const allowedExts = ['.pdf', '.docx', '.pptx', '.zip', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.webm', '.mov'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, video, image, ZIP, DOCX, and PPTX files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20 MB limit
  },
  fileFilter
});

export default upload;
