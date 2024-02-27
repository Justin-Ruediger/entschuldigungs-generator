const fs = require("fs/promises");
var PdfLib = require("pdf-lib");
var PDFDocument = PdfLib.PDFDocument;
var StandardFonts = PdfLib.StandardFonts;
const { writeFileSync, readFileSync } = require("fs");
var rgb = PdfLib.rgb;

var files = [
  {
    name: "Entschuldigung-Krankheit Eintägig",
    destination: "Entschuldigung-Krankheit",
    customProperties: [
      { name: "start_date", question: "Datum" }
    ],
  },
  {
    name: "Entschuldigung-Krankheit Mehrtägig",
    destination: "Entschuldigung-Timespan-Krankheit",
    customProperties: [
      { name: "start_date", question: "Von..." },
      { name: "end_date", question: "Bis..." },
    ],
  },
  {
    name: "Freistellung Eintägig",
    destination: "Freistellung-Day",
    customProperties: [
      { name: "on_date", question: "Datum" },
      { name: "reason", question: "Aufgrund ..." },
    ],
  },
  {
    name: "Freistellung Mehrtägig",
    destination: "Freistellung-Timespan",
    customProperties: [
      { name: "start_date", question: "Von..." },
      { name: "end_date", question: "Bis..." },
      { name: "reason", question: "Aufgrund ..." },
    ],
  },
];

function getCurrentDateString() {
  const event = new Date();
  const options = { year: "numeric", month: "long", day: "numeric" };

  return event.toLocaleDateString("de-DE", options);
}
async function getPdfSimple(loacation) {
  const pdfData = await fs.readFile("./pdf/" + loacation);
  var pdfDoc = await PDFDocument.load(pdfData);

  var pdfBytes = await pdfDoc.save();
  var pdfBuffer = Buffer.from(pdfBytes.buffer, "binary");
  return pdfBuffer;
}
async function getPdf(loacation, gender, args) {
  var suffix = gender == "m" ? "-Male" : "-Female";
  const pdfData = await fs.readFile("./pdf/" + loacation + suffix + ".pdf");
  var pdfDoc = await PDFDocument.load(pdfData);

  var form = pdfDoc.getForm();

  var fields = form.getFields();
  fields.forEach((field) => {
    try {
      var fieldName = field.getName();
      if (fieldName.endsWith("_inline")) {
        fieldName = fieldName.substring(0, fieldName.length - 7);
        argsNames = fieldName.split("&");
        argsNames.forEach((argName) => {
          if (args.hasOwnProperty(argName)) {
            field.setText(
              field
                .getText()
                .replaceAll(`[${argName}]`, args[argName].toString())
            );
            field.enableReadOnly();
          }
        });
      } else if (args.hasOwnProperty(fieldName)) {
        field.setText(args[fieldName]);
        // field.enableReadOnly();
      }
    } catch (err) {
      console.log(err);
    }
  });

  var pdfBytes = await pdfDoc.save();
  var pdfBuffer = Buffer.from(pdfBytes.buffer, "binary");
  return pdfBuffer;
}
function getCustomProperties(destination) {
  try {
    return files.find((file) => file.destination == destination)
      .customProperties;
  } catch (err) {
    console.log(err);
    return [];
  }
}
function getFiles() {
  return files;
}
module.exports = {
  getPdf,
  getCustomProperties,
  getPdfSimple,
  getCurrentDateString,
  getFiles,
};

/*
{
  child_name: 'Justin Rüdiger',
  child_grade: 'KII',
  user_name: 'Justin Rüdiger',
  user_address: 'Möwenweg 14',
  user_city: 'Forst',
  teacher_name: 'Utech',
  teacher_gender: 'm',
  schools_city: '76646 Bruchsal'
  date: '1. Januar 2021'
}
*/
