const fs = require('fs');
const path = require('path');

console.log("Checking schedule files in bahan-dari-ust-aziz...");
const dirPath = "c:\\Users\\itpua\\Dev\\Work\\al-andalus\\alandalus-alimam\\bahan-dari-ust-aziz";
const files = fs.readdirSync(dirPath);
console.log("Files found:", files);
