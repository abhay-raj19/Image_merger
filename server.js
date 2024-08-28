const express = require('express');
const multer = require('multer');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

const app = express();
const port = 3000;


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

app.use(express.static('public'));


app.set('view engine', 'ejs');


app.get('/', (req, res) => {
  res.render('index', { backgrounds: getBackgrounds() });
});


app.post('/upload', upload.single('image'), (req, res) => {
  const imagePath = req.file.path;
  const background = req.body.background;

  if (!imagePath || !background) {
    return res.status(400).send('Image and background are required.');
  }

  const outputPath = `output/${Date.now()}-output.png`;
  processImage(imagePath, background, outputPath)
    .then(() => res.sendFile(path.resolve(outputPath)))
    .catch(err => res.status(500).send(err.message));
});


function getBackgrounds() {
  return [
    'public/backgrounds/bg1.png',
    'public/backgrounds/bg2.png',
  
  ];
}

const processImage = async (imagePath, backgroundPath, outputPath) => {
  try {
  
    const image = await loadImage(imagePath);
    const background = await loadImage(backgroundPath);

    
    const canvas = createCanvas(background.width, background.height);
    const ctx = canvas.getContext('2d');

    // Draw the background image
    ctx.drawImage(background, 0, 0);

    
    const imgWidth = Math.min(image.width, background.width);
    const imgHeight = Math.min(image.height, background.height);

    // Draw the uploaded image
    ctx.drawImage(image, 0, 0, imgWidth, imgHeight);

    // yaha pe save, the final image to the output path
    const out = fs.createWriteStream(outputPath);
    const stream = canvas.createPNGStream();
    stream.pipe(out);

    return new Promise((resolve, reject) => {
      out.on('finish', () => resolve());
      out.on('error', (err) => reject(err));
    });
  } catch (error) {
    throw new Error(`Image processing failed: ${error.message}`);
  }
};

// server logic 
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

